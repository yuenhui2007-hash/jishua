/**
 * Email Service
 * SMTP integration using Nodemailer
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return null; // SMTP not configured
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

/**
 * Send email
 * @param {Object} options - { to, subject, html, text }
 */
async function sendEmail(options) {
  try {
    const t = getTransporter();
    // If SMTP not configured, log and return (no crash)
    if (!t) {
      logger.info('📧 Email (mock):', { to: options.to, subject: options.subject });
      return { messageId: 'mock-email-id' };
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'YH Studio <noreply@yh.studio>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    const info = await t.sendMail(mailOptions);
    logger.info('📧 Email sent:', info.messageId);
    return info;
  } catch (error) {
    logger.error('❌ Email send error:', error.message);
    // Don't throw — just return mock so app doesn't crash
    return { messageId: 'failed-email-id' };
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
        <h1 style="color: #A5A68F;">Your Resume is Ready! 🎉</h1>
        <p>Hi there,</p>
        <p>Your resume "<strong>${resumeTitle}</strong>" has been successfully created and optimized.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${downloadUrl}" style="background: #A5A68F; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Download Resume</a>
        </div>
        <p>Good luck with your job search!</p>
        <p style="color: #888; font-size: 12px;">YH Studio Team</p>
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
        <h1 style="color: #A5A68F;">Running Low on AI Credits</h1>
        <p>You've used ${usagePercent}% of your monthly AI generation limit.</p>
        <p>Upgrade to Pro for unlimited AI-powered resume optimization!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/pricing.html" style="background: #A5A68F; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Upgrade Now</a>
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
