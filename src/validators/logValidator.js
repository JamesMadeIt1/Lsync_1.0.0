const Joi = require('joi');

const objectId = Joi.string().hex().length(24);

const logValidator = Joi.object({
  title: Joi.string()
    .trim()
    .required()
    .messages({
      'string.base': 'Title must be text',
      'string.empty': 'Title is required',
      'any.required': 'Title is required'
    }),

  durationMinutes: Joi.number()
    .positive()
    .required()
    .messages({
      'number.base': 'Duration must be greater than zero',
      'number.positive': 'Duration must be greater than zero',
      'any.required': 'Duration must be greater than zero'
    }),

  durationSeconds: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'Duration in seconds must be a positive whole number',
      'number.integer': 'Duration in seconds must be a positive whole number',
      'number.min': 'Duration in seconds must be a positive whole number'
    }),

  type: Joi.string().valid(
    'Video',
    'Reading',
    'Coding',
    'Project',
    'Practice',
    'Certificate'
  ).messages({
    'any.only': 'Invalid learning activity type'
  }),

  proofUrl: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .allow('')
    .messages({
      'string.uri': 'Proof must be a valid HTTP or HTTPS URL'
    }),

  date: Joi.date().iso().messages({
    'date.format': 'Date must be valid',
    'date.base': 'Date must be valid'
  }),

  skill: objectId.messages({
    'string.hex': 'Invalid skill ID',
    'string.length': 'Invalid skill ID'
  }),

  platform: objectId.messages({
    'string.hex': 'Invalid platform ID',
    'string.length': 'Invalid platform ID'
  }),

  track: objectId.messages({
    'string.hex': 'Invalid track ID',
    'string.length': 'Invalid track ID'
  })
});

const logProgressParamsValidator = Joi.object({
  id: objectId.required().messages({
    'string.hex': 'Invalid learning activity ID',
    'string.length': 'Invalid learning activity ID',
    'any.required': 'Invalid learning activity ID'
  })
});

const logProgressValidator = Joi.object({
  watchedSeconds: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      'number.base': 'Watched time must be a non-negative whole number',
      'number.integer': 'Watched time must be a non-negative whole number',
      'number.min': 'Watched time must be a non-negative whole number',
      'any.required': 'Watched time must be a non-negative whole number'
    })
});

const trackValidator = Joi.object({
  name: Joi.string().min(1).required().messages({
    'string.empty': 'Track name required',
    'any.required': 'Track name required'
  })
});

const skillValidator = Joi.object({
  name: Joi.string().min(1).required().messages({
    'string.empty': 'Skill name is required',
    'any.required': 'Skill name is required'
  })
});

const platformValidator = Joi.object({
  name: Joi.string()
    .trim()
    .required()
    .messages({
      'string.base': 'Platform name must be text',
      'string.empty': 'Platform name is required',
      'any.required': 'Platform name is required'
    }),
  type: Joi.string().valid(
    'YouTube',
    'Udemy',
    'Coursera',
    'GitHub',
    'Blogs',
    'Book',
    'edX',
    'Other'
  ).required().messages({
    'any.only': 'Invalid platform type',
    'any.required': 'Invalid platform type'
  })
});

const projectValidator = Joi.object({
  title: Joi.string().min(1).required().messages({
    'string.empty': 'Title is required',
    'any.required': 'Title is required'
  })
});

module.exports = {
  logValidator,
  logProgressParamsValidator,
  logProgressValidator,
  trackValidator,
  skillValidator,
  platformValidator,
  projectValidator
};
