const Joi = require('joi');

const objectId = Joi.string().hex().length(24);
const url = Joi.string().uri();

const updateProfileValidator = Joi.object({
  name: Joi.string().trim().min(2).max(50),
  username: Joi.string()
    .trim()
    .min(3)
    .max(20)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .messages({
      'string.min': 'Username 3-20 chars',
      'string.max': 'Username 3-20 chars',
      'string.pattern.base':
        'Username can only contain letters, numbers and underscore'
    }),
  bio: Joi.string().trim().max(300),
  avatar: url,
  track: objectId
});

const updatePasswordValidator = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Current password required',
      'any.required': 'Current password required'
    }),
  newPassword: Joi.string()
    .min(6)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password min 6 chars',
      'string.pattern.base':
        'New password must contain letter and number'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Passwords do not match'
    })
});

const deleteAccountValidator = Joi.object({
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password required to delete account',
      'any.required': 'Password required to delete account'
    }),
  confirmDelete: Joi.string()
    .valid('DELETE')
    .required()
    .messages({
      'any.only': 'You must type DELETE to confirm',
      'any.required': 'You must type DELETE to confirm'
    })
});

const privacyValidator = Joi.object({
  isPublic: Joi.boolean().required().messages({
    'any.required': 'isPublic must be boolean',
    'boolean.base': 'isPublic must be boolean'
  }),
  showStats: Joi.boolean(),
  showPlatforms: Joi.boolean()
});

const addAccountLinkValidator = Joi.object({
  platformId: objectId.required().messages({
    'string.hex': 'Valid platform required',
    'string.length': 'Valid platform required',
    'any.required': 'Valid platform required'
  }),
  platformUsername: Joi.string()
    .trim()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Platform username required',
      'any.required': 'Platform username required'
    }),
  profileUrl: url
});

module.exports = {
  updateProfileValidator,
  updatePasswordValidator,
  deleteAccountValidator,
  privacyValidator,
  addAccountLinkValidator
};
