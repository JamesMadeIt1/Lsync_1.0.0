const { body, param } = require('express-validator');


const logValidator = [
  body('title')
    .isString()
    .withMessage('Title must be text')
    .trim()
    .notEmpty()
    .withMessage('Title is required'),

  body('durationMinutes')
    .isFloat({ gt: 0 })
    .withMessage('Duration must be greater than zero'),

  body('durationSeconds')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration in seconds must be a positive whole number')
    .toInt(),

  body('type')
    .optional()
    .isIn([
      'Video',
      'Reading',
      'Coding',
      'Project',
      'Practice',
      'Certificate'
    ])
    .withMessage('Invalid learning activity type'),

  body('proofUrl')
    .optional({ values: 'falsy' })
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Proof must be a valid HTTP or HTTPS URL'),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be valid'),

  body('skill')
    .optional()
    .isMongoId()
    .withMessage('Invalid skill ID'),

  body('platform')
    .optional()
    .isMongoId()
    .withMessage('Invalid platform ID'),

  body('track')
    .optional()
    .isMongoId()
    .withMessage('Invalid track ID')
];

const logProgressValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid learning activity ID'),

  body('watchedSeconds')
    .isInt({ min: 0 })
    .withMessage('Watched time must be a non-negative whole number')
    .toInt()
];

const trackValidator = [
    body('name').notEmpty().withMessage('Track name required')
];

const skillValidator = [
    body('name').notEmpty().withMessage('Skill name is required')
];


const platformValidator = [
  body('name')
    .isString()
    .withMessage('Platform name must be text')
    .trim()
    .notEmpty()
    .withMessage('Platform name is required'),

  body('type')
    .isIn([
      'Youtube',
      'Udemy',
      'Coursera',
      'GitHub',
      'Blogs',
      'Book',
      'edX',
      'Other'
    ])
    .withMessage('Invalid platform type')
];


const projectValidator = [
    body('title').notEmpty().withMessage('Title is required')
];

module.exports = {
    logValidator,
    logProgressValidator,
    trackValidator,
    skillValidator,
    platformValidator,
    projectValidator
};