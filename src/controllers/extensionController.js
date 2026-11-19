const crypto = require('crypto');

const ExtensionToken = require('../models/extensionTokenModel');
const { hashExtensionToken } = require('../utils/extensionToken');

const linkExtension = async (req, res, next) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');

    await ExtensionToken.findOneAndUpdate(
      { user: req.user },
      { $set: { tokenHash: hashExtensionToken(token) } },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Extension linked. Save this token; it will not be shown again.',
      data: { token }
    });
  } catch (error) {
    return next(error);
  }
};

const revokeExtension = async (req, res, next) => {
  try {
    await ExtensionToken.deleteOne({ user: req.user });
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  linkExtension,
  revokeExtension
};
