const Joi = require('joi');

const watchEventValidator = Joi.object({
  clientEventId: Joi.string()
    .guid()
    .required()
    .messages({
      'string.guid': 'clientEventId must be a UUID',
      'any.required': 'clientEventId must be a UUID'
    }),

  videoId: Joi.string()
    .pattern(/^[A-Za-z0-9_-]{11}$/)
    .required()
    .messages({
      'string.pattern.base': 'videoId must be a valid YouTube video ID',
      'any.required': 'videoId must be a valid YouTube video ID'
    }),

  secondsWatched: Joi.number()
    .integer()
    .min(1)
    .max(6 * 60 * 60)
    .required()
    .messages({
      'number.base': 'secondsWatched must be between 1 and 21600',
      'number.integer': 'secondsWatched must be between 1 and 21600',
      'number.min': 'secondsWatched must be between 1 and 21600',
      'number.max': 'secondsWatched must be between 1 and 21600',
      'any.required': 'secondsWatched must be between 1 and 21600'
    }),

  watchedAt: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'watchedAt must be an ISO 8601 date',
      'date.format': 'watchedAt must be an ISO 8601 date',
      'any.required': 'watchedAt must be an ISO 8601 date'
    })
});

module.exports = watchEventValidator;
