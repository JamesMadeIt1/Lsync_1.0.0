
const router = require('express').Router();

const auth = require('../middleware/auth');

const {
  connectGitHub,
  githubCallback
} = require('../controllers/githubController');

const {
  getGitHubRepositories,
  getGitHubCommits
} = require('../controllers/githubDataController');

const {
  syncGitHubCommits
} = require('../controllers/githubSyncController');

const {
  getMyGitHubActivities
} = require('../controllers/githubActivityController');

router.get('/connect', auth, connectGitHub);

router.get('/callback', githubCallback);

router.get(
  '/repositories',
  auth,
  getGitHubRepositories
);

router.get(
  '/repositories/:owner/:repo/commits',
  auth,
  (req, res, next) => {
    const { owner, repo } = req.params;

    const validName = /^[A-Za-z0-9_.-]+$/;

    if (
      !validName.test(owner) ||
      !validName.test(repo) ||
      owner.length > 39 ||
      repo.length > 100 ||
      owner.startsWith('-') ||
      repo === '.' ||
      repo === '..'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub repository owner or name'
      });
    }

    next();
  },
  getGitHubCommits
);


router.post(
  '/repositories/:owner/:repo/sync',
  auth,
  (req, res, next) => {
    const { owner, repo } = req.params;

    const validName = /^[A-Za-z0-9_.-]+$/;

    if (
      !validName.test(owner) ||
      !validName.test(repo) ||
      owner.length > 39 ||
      repo.length > 100 ||
      owner.startsWith('-') ||
      repo === '.' ||
      repo === '..'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub repository owner or name'
      });
    }

    next();
  },
  syncGitHubCommits
);


router.get(
  '/activities',
  auth,
  getMyGitHubActivities
);


module.exports = router;
