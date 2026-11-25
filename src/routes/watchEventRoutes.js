const router = require('express').Router();

const auth = require('../middleware/auth');
const requireExtensionAuth = require('../middleware/extensionAuth');
const validate = require('../middleware/validate');
const {
  recordWatchEvent,
  listMyWatchEvents
} = require('../controllers/watchEventController');
const watchEventValidator = require('../validators/watchEventValidator');

router.get('/', auth, listMyWatchEvents);

router.post(
  '/',
  requireExtensionAuth,
  validate(watchEventValidator),
  recordWatchEvent
);

module.exports = router;
