const router = require('express').Router();

const {
  forgotPassword,
  resetPassword
} = require('../controllers/email_service_controller');
const {
  forgotPasswordValidator,
  resetPasswordValidator
} = require('../validators/authValidate');
const validate = require('../middleware/validate');

router.post(
  '/forgot-password',
  validate(forgotPasswordValidator),
  forgotPassword
);
router.post(
  '/reset-password',
  validate(resetPasswordValidator),
  resetPassword
);

module.exports = router;