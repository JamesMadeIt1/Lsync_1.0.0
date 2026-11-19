const router = require('express').Router();
const {
  createLog,
  getMyLogs,
  updateLogProgress,
  deleteLog
} = require('../controllers/learningLogController');
const auth = require('../middleware/auth');
const {
  logValidator,
  logProgressValidator
} = require('../validators/logValidator');
const validate = require('../middleware/validate');


router.post('/log', auth, logValidator, validate, createLog);

router.get('/log', auth, getMyLogs);

router.patch(
  '/log/:id/progress',
  auth,
  logProgressValidator,
  validate,
  updateLogProgress
);

router.delete('/log/:id', auth, deleteLog);

module.exports = router;