const User = require('../models/userModel');

const admin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user).select('role');

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = admin;
