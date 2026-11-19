const router = require('express').Router();

const requireExtensionAuth = require('../middleware/extensionAuth');
const validate = require('../middleware/validate');
const { recordWatchEvent } = require('../controllers/watchEventController');
const watchEventValidator = require('../validators/watchEventValidator');

router.post(
  '/',
  requireExtensionAuth,
  validate(watchEventValidator),
  recordWatchEvent
);

module.exports = router;
