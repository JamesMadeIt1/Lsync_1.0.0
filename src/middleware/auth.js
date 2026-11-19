
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const auth = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    // Check authorization header format
    if (
      !authorization ||
      !authorization.startsWith('Bearer ')
    ) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    const token = authorization.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    // Verify token signature and expiration
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      { algorithms: ['HS256'] }
    );

    // Confirm user still exists
    const user = await User.findById(decoded.id)
      .select('+tokenVersion');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists'
      });
    }

    const tokenVersion = Number.isInteger(decoded.tokenVersion)
      ? decoded.tokenVersion
      : 0;

    if (tokenVersion !== (user.tokenVersion || 0)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Keep compatibility with existing controllers
    req.user = user._id;

    next();

  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    next(error);
  }
};

module.exports = auth;
