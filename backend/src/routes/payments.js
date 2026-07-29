/**
 * Payment Routes
 * Stripe integration for subscriptions
 * GET /api/payments/plans
 * POST /api/payments/create-intent
 * POST /api/payments/webhook
 * GET /api/payments/history
 */

const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getDB } = require('../models/database');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');

const PLANS = {
  free: { name: 'Free', price: 0, resumes: 3, aiGenerations: 5 },
  basic: { name: 'Basic', price: 9.99, resumes: 10, aiGenerations: 25, stripePriceId: process.env.STRIPE_PRICE_BASIC },
  pro: { name: 'Pro', price: 19.99, resumes: 50, aiGenerations: 100, stripePriceId: process.env.STRIPE_PRICE_PRO },
  enterprise: { name: 'Enterprise', price: 49.99, resumes: 999, aiGenerations: 500, stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE },
};

// @route   GET /api/payments/plans
// @desc    Get available plans
// @access  Public
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    plans: PLANS,
  });
});

// @route   POST /api/payments/create-intent
// @desc    Create Stripe payment intent
// @access  Private
router.post('/create-intent', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    const planConfig = PLANS[plan];

    if (!planConfig || plan === 'free') {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(planConfig.price * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: req.user.id,
        plan,
        email: req.user.email,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    logger.error('Create payment intent error:', error);
    res.status(500).json({ success: false, message: 'Payment processing failed' });
  }
});

// @route   POST /api/payments/create-subscription
// @desc    Create Stripe subscription
// @access  Private
router.post('/create-subscription', protect, async (req, res) => {
  try {
    const { plan, paymentMethodId } = req.body;
    const planConfig = PLANS[plan];

    if (!planConfig || !planConfig.stripePriceId) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    // Create or get Stripe customer
    let customer;
    const existingPayment = db.prepare('SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(req.user.id);

    if (existingPayment?.stripe_subscription_id) {
      customer = { id: existingPayment.stripe_subscription_id.split('_')[0] };
    } else {
      customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { userId: req.user.id },
        payment_method: paymentMethodId,
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: planConfig.stripePriceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Store subscription reference
    const db = getDB();
    db.prepare(`
      INSERT INTO payments (user_id, stripe_subscription_id, amount, currency, status, plan)
      VALUES (?, ?, ?, 'usd', 'pending', ?)
    `).run(req.user.id, subscription.id, planConfig.price * 100, plan);

    res.json({
      success: true,
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    logger.error('Create subscription error:', error);
    res.status(500).json({ success: false, message: 'Subscription creation failed' });
  }
});

// @route   POST /api/payments/webhook
// @desc    Stripe webhook handler
// @access  Public (Stripe sends this)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Stripe webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const db = getDB();

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata.userId;
      const plan = paymentIntent.metadata.plan;

      if (userId && plan) {
        db.prepare('UPDATE users SET plan = ?, plan_expires_at = date("now", "+30 days") WHERE id = ?')
          .run(plan, userId);

        db.prepare(`
          UPDATE payments SET status = 'succeeded' WHERE stripe_payment_intent_id = ?
        `).run(paymentIntent.id);

        logger.info(`Payment succeeded for user ${userId}, plan: ${plan}`);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const subscription = event.data.object;
      logger.warn(`Payment failed for subscription: ${subscription.id}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      db.prepare('UPDATE users SET plan = "free" WHERE id = (SELECT user_id FROM payments WHERE stripe_subscription_id = ?)')
        .run(subscription.id);
      logger.info(`Subscription cancelled: ${subscription.id}`);
      break;
    }
  }

  res.json({ received: true });
});

// @route   GET /api/payments/history
// @desc    Get user's payment history
// @access  Private
router.get('/history', protect, (req, res) => {
  const db = getDB();
  const payments = db.prepare(`
    SELECT id, amount, currency, status, plan, created_at
    FROM payments WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(req.user.id);

  res.json({ success: true, payments });
});

// @route   POST /api/payments/cancel
// @desc    Cancel subscription
// @access  Private
router.post('/cancel', protect, async (req, res) => {
  try {
    const db = getDB();
    const payment = db.prepare('SELECT * FROM payments WHERE user_id = ? AND status = "succeeded" ORDER BY created_at DESC LIMIT 1')
      .get(req.user.id);

    if (payment?.stripe_subscription_id) {
      await stripe.subscriptions.cancel(payment.stripe_subscription_id);
    }

    db.prepare('UPDATE users SET plan = "free", plan_expires_at = NULL WHERE id = ?').run(req.user.id);

    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel subscription' });
  }
});

module.exports = router;
