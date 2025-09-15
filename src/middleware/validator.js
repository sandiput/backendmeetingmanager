const { body, param, query, validationResult } = require('express-validator');
const { AppError } = require('../utils/logger');
const { isValidDate, isValidTime, isValidNIP } = require('../utils/validator');
const APP_CONSTANTS = require('../config/constants');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

// Meeting validation rules
const meetingValidation = {
  create: [
    body('title')
      .notEmpty()
      .trim()
      .withMessage('Title is required')
      .isLength({ max: 255 })
      .withMessage('Title must not exceed 255 characters'),

    body('date')
      .notEmpty()
      .withMessage('Date is required')
      .custom(isValidDate)
      .withMessage('Invalid date format. Use YYYY-MM-DD'),

    body('time')
      .notEmpty()
      .withMessage('Time is required')
      .custom(isValidTime)
      .withMessage('Invalid time format. Use HH:mm'),

    body('location')
      .notEmpty()
      .trim()
      .withMessage('Location is required')
      .isLength({ max: 255 })
      .withMessage('Location must not exceed 255 characters'),

    body('attendees')
      .isArray()
      .withMessage('Attendees must be an array')
      .notEmpty()
      .withMessage('At least one attendee is required')
      .custom((value) => value.length <= APP_CONSTANTS.MEETING.MAX_ATTENDEES)
      .withMessage(`Maximum ${APP_CONSTANTS.MEETING.MAX_ATTENDEES} attendees allowed`),

    body('reminder_minutes')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Reminder minutes must be a positive number'),

    validate
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid meeting ID'),

    body('title')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Title must not exceed 255 characters'),

    body('date')
      .optional()
      .custom(isValidDate)
      .withMessage('Invalid date format. Use YYYY-MM-DD'),

    body('time')
      .optional()
      .custom(isValidTime)
      .withMessage('Invalid time format. Use HH:mm'),

    body('location')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Location must not exceed 255 characters'),

    body('attendees')
      .optional()
      .isArray()
      .withMessage('Attendees must be an array')
      .custom((value) => !value || value.length <= APP_CONSTANTS.MEETING.MAX_ATTENDEES)
      .withMessage(`Maximum ${APP_CONSTANTS.MEETING.MAX_ATTENDEES} attendees allowed`),

    validate
  ]
};

// Participant validation rules
const participantValidation = {
  create: [
    body('name')
      .notEmpty()
      .trim()
      .withMessage('Name is required')
      .isLength({ max: 255 })
      .withMessage('Name must not exceed 255 characters'),

    body('nip')
      .notEmpty()
      .withMessage('NIP is required')
      .custom(isValidNIP)
      .withMessage('Invalid NIP format'),

    body('whatsapp_number')
      .notEmpty()
      .withMessage('WhatsApp number is required')
      .matches(/^[0-9]+$/)
      .withMessage('WhatsApp number must contain only digits')
      .isLength({ min: 10, max: 13 })
      .withMessage('Invalid WhatsApp number length'),

    body('seksi')
      .notEmpty()
      .trim()
      .withMessage('Seksi is required')
      .isLength({ max: 50 })
      .withMessage('Seksi must not exceed 50 characters'),

    validate
  ],

  update: [
    param('id')
      .isMongoId()
      .withMessage('Invalid participant ID'),

    body('name')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Name must not exceed 255 characters'),

    body('nip')
      .optional()
      .custom(isValidNIP)
      .withMessage('Invalid NIP format'),

    body('whatsapp_number')
      .optional()
      .matches(/^[0-9]+$/)
      .withMessage('WhatsApp number must contain only digits')
      .isLength({ min: 10, max: 13 })
      .withMessage('Invalid WhatsApp number length'),

    body('seksi')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Seksi must not exceed 50 characters'),

    validate
  ]
};

// Settings validation rules
const settingsValidation = {
  update: [
    body('notification_time')
      .optional()
      .custom(isValidTime)
      .withMessage('Invalid time format. Use HH:mm'),

    body('reminder_enabled')
      .optional()
      .isBoolean()
      .withMessage('Reminder enabled must be a boolean'),

    body('group_notification_enabled')
      .optional()
      .isBoolean()
      .withMessage('Group notification enabled must be a boolean'),

    body('whatsapp_group_id')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('WhatsApp group ID cannot be empty'),

    validate
  ],

  templates: [
    body('group_daily')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Group daily template cannot be empty'),

    body('individual_reminder')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Individual reminder template cannot be empty'),

    validate
  ]
};

// Pagination validation rules
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: APP_CONSTANTS.PAGINATION.MAX_LIMIT })
    .withMessage(`Limit must be between 1 and ${APP_CONSTANTS.PAGINATION.MAX_LIMIT}`),

  validate
];

// Search validation rules
const searchValidation = [
  param('query')
    .trim()
    .isLength({ min: APP_CONSTANTS.SEARCH.MIN_CHARS })
    .withMessage(`Search query must be at least ${APP_CONSTANTS.SEARCH.MIN_CHARS} characters long`),

  validate
];

// Admin validation rules
const adminValidation = {
  login: [
    body('username')
      .notEmpty()
      .trim()
      .withMessage('Username is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters'),

    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),

    validate
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),

    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long'),

    validate
  ]
};

module.exports = {
  meetingValidation,
  participantValidation,
  settingsValidation,
  paginationValidation,
  searchValidation,
  adminValidation
};