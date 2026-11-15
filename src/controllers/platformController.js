
const Platform = require('../models/platformModel');

// CREATE PLATFORM
const createPlatform = async (req, res, next) => {
  try {
    const { name, type } = req.body;

    // Check whether this user already has this platform
    const existingPlatform = await Platform.findOne({
      user: req.user,
      type
    });

    if (existingPlatform) {
      return res.status(409).json({
        success: false,
        message: 'Platform already exists for this user'
      });
    }

    const platform = await Platform.create({
      name,
      type,
      user: req.user
    });

    return res.status(201).json({
      success: true,
      message: 'Platform created successfully',
      data: platform
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Platform already exists for this user'
      });
    }

    next(error);
  }
};

// GET USER'S PLATFORMS
const getMyPlatforms = async (req, res, next) => {
  try {
    const platforms = await Platform.find({
      user: req.user
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: platforms.length,
      data: platforms
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPlatform,
  getMyPlatforms
};
