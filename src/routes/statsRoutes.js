const router = require('express').Router();

const auth = require('../middleware/auth');

const {
  getMyStats,
  getWatchTimeByCategory,
  getWatchTimeByVideo
} = require('../controllers/statsController');

router.get('/stats', auth, getMyStats);
router.get('/watch-time-by-category', auth, getWatchTimeByCategory);
router.get('/watch-time-by-video', auth, getWatchTimeByVideo);

module.exports = router;