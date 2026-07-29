/**
 * Email Service
 * SMTP integration using Nodemailer
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter on startup
transporter.verify((error) => {
  if (error) {
    logger.warn('Email service not configured:', error.message);
  } else {
    logger.info('📧 Email service ready');
  }
});

/**
 * Send email
 * @param {Object} options - { to, subject, html, text }
 */
async function sendEmail(options) {
  try {
    // If SMTP not configured, log and return
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      logger.info('Email would be sent:', { to: options.to, subject: options.subject });
      return { messageId: 'mock-email-id' };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'ResumeAI Pro <noreply@resumeai.pro>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent:', info.messageId);
    return info;
  } catch (error) {
    logger.error('Email send error:', error);
    throw error;
  }
}

/**
 * Send resume completion email
 */
async function sendResumeCompleteEmail(to, resumeTitle, downloadUrl) {
  return sendEmail({
    to,
    subject: `Your Resume "${resumeTitle}" is Ready!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #d4af37;">Your Resume is Ready! 🎉</h1>
        <p>Hi there,</p>
        <p>Your resume "<strong>${resumeTitle}</strong>" has been successfully created and optimized.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${downloadUrl}" style="background: #d4af37; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Download Resume</a>
        </div>
        <p>Good luck with your job search!</p>
        <p style="color: #888; font-size: 12px;">ResumeAI Pro Team</p>
      </div>
    `,
  });
}

/**
 * Send upgrade reminder email
 */
async function sendUpgradeReminderEmail(to, usagePercent) {
  return sendEmail({
    to,
    subject: 'You\'re Almost Out of AI Generations!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #d4af37;">Running Low on AI Credits</h1>
        <p>You've used ${usagePercent}% of your monthly AI generation limit.</p>
        <p>Upgrade to Pro for unlimited AI-powered resume optimization!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/pricing.html" style="background: #d4af37; color: #000; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Upgrade Now</a>
        </div>
      </div>
    `,
  });
}

module.exports = {
  sendEmail,
  sendResumeCompleteEmail,
  sendUpgradeReminderEmail,
};
