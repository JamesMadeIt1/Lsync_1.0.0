const router = require('express').Router();

const auth = require('../middleware/auth');
const {
  linkExtension,
  revokeExtension
} = require('../controllers/extensionController');

router.post('/link', auth, linkExtension);
router.delete('/link', auth, revokeExtension);

module.exports = router;
