const router = require('express').Router();
const { register, login } = require('../controllers/authController');
const { registerValidator, loginValidator } = require('../validators/authValidate');
const validate = require('../middleware/validate');
const emailServiceRoutes = require('./email.service.route');

router.post('/register', validate(registerValidator), register);

router.post('/login', validate(loginValidator), login);

router.use(emailServiceRoutes);

module.exports = router;