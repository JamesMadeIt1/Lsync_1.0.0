
const GitHubActivity = require('../models/githubActivityModel');

const getMyGitHubActivities = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters'
      });
    }

    const filter = {
      user: req.user,
      provider: 'GitHub'
    };

    const total = await GitHubActivity.countDocuments(filter);

    const activities = await GitHubActivity.find(filter)
      .select('-__v')
      .sort({ committedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      provider: 'GitHub',
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      count: activities.length,
      data: activities
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyGitHubActivities
};
