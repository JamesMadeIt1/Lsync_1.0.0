
const validate = (schema, property = 'body') => {
  if (!schema || typeof schema.validate !== 'function') {
    throw new TypeError('validate requires a Joi schema');
  }

  return (req, res, next) => {
    const input = req[property] === undefined ? {} : req[property];
    const { error, value } = schema.validate(input, {
      abortEarly: false,
      allowUnknown: true,
      convert: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map((detail) => detail.message)
      });
    }

    req[property] = value;
    return next();
  };
};

module.exports = validate;
