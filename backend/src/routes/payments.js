const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Create subscription checkout
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { tier } = req.body; // 'pro' or 'enterprise'
    const priceId = tier === 'enterprise' 
      ? process.env.STRIPE_PRICE_ID_ENTERPRISE 
      : process.env.STRIPE_PRICE_ID_PRO;

    if (!priceId) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    let customerId = req.user.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { userId: req.user.id }
      });
      customerId = customer.id;
      db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customerId, req.user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: { userId: req.user.id, tier }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create payment intent (for one-time purchases)
router.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // convert to cents
      currency: 'usd',
      description,
      metadata: { userId: req.user.id }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe payment intent error:', err);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Get user payment history
router.get('/history', authenticateToken, (req, res) => {
  const payments = db.prepare(
    'SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.id);
  res.json({ payments });
});

// Stripe webhook
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const tier = session.metadata?.tier;
      
      if (userId && tier) {
        db.prepare('UPDATE users SET subscription_tier = ?, subscription_status = ? WHERE id = ?')
          .run(tier, 'active', userId);
        
        db.prepare('INSERT INTO payments (user_id, stripe_payment_intent_id, amount, currency, status, tier, description) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(userId, session.payment_intent, session.amount_total, session.currency, 'succeeded', tier, `Subscription: ${tier}`);
      }
      break;
    }
    
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const user = db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?').get(customerId);
      
      if (user) {
        db.prepare('UPDATE users SET subscription_status = ? WHERE id = ?').run('active', user.id);
      }
      break;
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const user = db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?').get(customerId);
      
      if (user) {
        db.prepare('UPDATE users SET subscription_status = ? WHERE id = ?').run('past_due', user.id);
      }
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const user = db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?').get(customerId);
      
      if (user) {
        db.prepare('UPDATE users SET subscription_status = ?, subscription_tier = ? WHERE id = ?')
          .run('cancelled', 'free', user.id);
      }
      break;
    }
  }

  res.json({ received: true });
});

module.exports = router;
