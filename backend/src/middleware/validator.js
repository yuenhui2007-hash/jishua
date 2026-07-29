/**
 * Input Validation Middleware using express-validator
 */

const { body, param, validationResult } = require('express-validator');

// Helper to handle validation errors
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Auth validations
exports.registerValidation = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email too long'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain a number'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('First name must be 1-100 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Last name must be 1-100 characters'),
];

exports.loginValidation = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// Resume validations
exports.createResumeValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
  body('content')
    .notEmpty().withMessage('Resume content is required'),
  body('templateId')
    .optional()
    .isLength({ max: 100 }),
];

exports.updateResumeValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 }),
  body('content')
    .optional(),
  body('templateId')
    .optional()
    .isLength({ max: 100 }),
];

// AI generation validations
exports.aiGenerateValidation = [
  body('type')
    .notEmpty().withMessage('Generation type is required')
    .isIn(['summary', 'experience', 'skills', 'full-resume', 'ats-optimize', 'job-match'])
    .withMessage('Invalid generation type'),
  body('data')
    .optional()
    .isObject().withMessage('Data must be an object'),
  body('jobDescription')
    .optional()
    .isLength({ max: 10000 }).withMessage('Job description too long'),
];

// Template validation
exports.templateIdValidation = [
  param('id')
    .notEmpty().withMessage('Template ID is required'),
];
