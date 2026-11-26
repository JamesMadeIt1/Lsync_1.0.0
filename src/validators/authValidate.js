const Joi = require('joi');

const registerValidator = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Full name must be at least 2 characters',
      'any.required': 'Name is required'
    }),

  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Valid email is required',
      'string.empty': 'Valid email is required',
      'any.required': 'Valid email is required'
    }),

  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters'
    }),

  username: Joi.string()
    .trim()
    .min(3)
    .max(20)
    .pattern(/^[a-zA-Z0-9_]+$/)
});

const loginValidator = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Valid email is required',
      'string.empty': 'Valid email is required',
      'any.required': 'Valid email is required'
    }),

  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    })
});

const forgotPasswordValidator = Joi.object({
  email: Joi.string()
    .trim()
    .email()
    .lowercase()
    .required()
    .messages({
      'string.email': 'Valid email is required',
      'string.empty': 'Valid email is required',
      'any.required': 'Valid email is required'
    })
});

const resetPasswordValidator = Joi.object({
  token: Joi.string()
    .hex()
    .length(64)
    .required()
    .messages({
      'string.hex': 'Invalid or expired reset token',
      'string.length': 'Invalid or expired reset token',
      'any.required': 'Invalid or expired reset token'
    }),
  newPassword: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required'
    })
});

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator
};
