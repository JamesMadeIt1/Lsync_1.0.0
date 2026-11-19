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
  logProgressParamsValidator,
  logProgressValidator
} = require('../validators/logValidator');
const validate = require('../middleware/validate');


router.post('/log', auth, validate(logValidator), createLog);

router.get('/log', auth, getMyLogs);

router.patch(
  '/log/:id/progress',
  auth,
  validate(logProgressParamsValidator, 'params'),
  validate(logProgressValidator),
  updateLogProgress
);

router.delete('/log/:id', auth, deleteLog);

module.exports = router;