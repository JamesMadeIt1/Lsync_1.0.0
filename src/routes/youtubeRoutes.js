const router = require('express').Router();

const auth = require('../middleware/auth');
const {
  connectYouTube,
  youtubeCallback
} = require('../controllers/youtubeController');

router.get('/connect', auth, connectYouTube);
router.get('/callback', youtubeCallback);

module.exports = router;
