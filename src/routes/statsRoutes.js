const router = require('express').Router();

const auth = require('../middleware/auth');

const {
  getMyStats
} = require('../controllers/statsController');

router.get('/stats', auth, getMyStats);

module.exports = router;