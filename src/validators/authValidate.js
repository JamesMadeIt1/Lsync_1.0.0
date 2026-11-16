
const { body } = require('express-validator');

const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),

  body('username')
    .trim()
    .toLowerCase()
    .isLength({ min: 5 })
    .withMessage('Username must be at least 5 characters')
    .matches(/^[a-z0-9_]+$/)
    .withMessage('Username can contain lowercase letters, numbers and underscores'),

  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
];

const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

module.exports = {
  registerValidator,
  loginValidator
};
