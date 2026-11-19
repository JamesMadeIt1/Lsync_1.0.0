const router = require('express').Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validate = require('../middleware/validate');
const { getAllUsers, getMe, updateProfile, updatePassword, updatePrivacy, addPlatformAccount, removePlatformAccount, deleteAccount } = require('../controllers/userController');
const { updateProfileValidator, updatePasswordValidator, deleteAccountValidator, privacyValidator, addAccountLinkValidator } = require('../validators/userValidator');

router.get('/', auth, admin, getAllUsers);
router.get('/me', auth, getMe);

router.put('/profile', auth, validate(updateProfileValidator), updateProfile);

router.put('/password', auth, validate(updatePasswordValidator), updatePassword);

router.put('/privacy', auth, validate(privacyValidator), updatePrivacy);

router.post('/accounts', auth, validate(addAccountLinkValidator), addPlatformAccount);

router.delete('/accounts/:accountId', auth, removePlatformAccount);

router.delete('/delete', auth, validate(deleteAccountValidator), deleteAccount);

module.exports = router;