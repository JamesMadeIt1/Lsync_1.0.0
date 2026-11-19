const ExtensionToken = require('../models/extensionTokenModel');
const User = require('../models/userModel');
const { hashExtensionToken } = require('../utils/extensionToken');

const requireExtensionAuth = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const match = /^Bearer ([0-9a-f]{64})$/.exec(authorization);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Valid extension token required'
      });
    }

    const record = await ExtensionToken.findOne({
      tokenHash: hashExtensionToken(match[1])
    });

    if (!record) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or revoked extension token'
      });
    }

    const user = await User.findById(record.user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists'
      });
    }

    req.user = user._id;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = requireExtensionAuth;
