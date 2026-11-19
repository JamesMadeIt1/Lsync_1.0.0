const router = require('express').Router();
const { createTrack, getTracks } = require('../controllers/trackController');
const auth = require('../middleware/auth');
const { trackValidator } = require('../validators/logValidator');
const validate = require('../middleware/validate');


router.get('/track', getTracks);

router.post('/track', auth, validate(trackValidator), createTrack);

module.exports = router;