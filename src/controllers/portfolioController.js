
const User = require('../models/userModel');
const LearningLog = require('../models/learningLogModel');
const GitHubActivity = require('../models/githubActivityModel');


const getPublicPortfolio = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      username: username.toLowerCase()
    })
      .populate('track')
      .select('-password -email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }

    if (!user.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Portfolio is private'
      });
    }

    const logs = await LearningLog.find({
      user: user._id
    })
      .populate(['skill', 'platform', 'track'])
      .sort({ date: -1 })
      .limit(20);

    const totalLogs = await LearningLog.countDocuments({
      user: user._id
    });

    const allLogDurations = await LearningLog.find({
      user: user._id
    }).select('durationMinutes');

    const totalMinutes = allLogDurations.reduce(
      (sum, log) => sum + (log.durationMinutes || 0),
      0
    );


const githubFilter = {
  user: user._id,
  provider: 'GitHub',
  verificationStatus: 'matched'
};

const totalGitHubActivities =
  await GitHubActivity.countDocuments(githubFilter);

const githubActivities = await GitHubActivity.find(githubFilter)
  .select(
    'repository commitSha message author ' +
    'githubAuthorLogin committedAt commitUrl verificationStatus'
  )
  .sort({ committedAt: -1 })
  .limit(20)
  .lean();

  return res.status(200).json({
    success: true,
    user,
    stats: {
    totalLogs,
    totalHours: (totalMinutes / 60).toFixed(1),
    totalGitHubActivities
  },
  recentLogs: logs,
  githubEvidence: {
    provider: 'GitHub',
    verificationType: 'github_account_match',
    count: githubActivities.length,
    total: totalGitHubActivities,
    activities: githubActivities
  }
 });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getPublicPortfolio
 };