const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authValidators } = require('../validators');

const router = express.Router();

router.post('/register', authValidators.register, validate, authController.register);
router.post('/login', authValidators.login, validate, authController.login);
router.post('/forgot-password', authValidators.forgotPassword, validate, authController.forgotPassword);
router.post('/reset-password', authValidators.resetPassword, validate, authController.resetPassword);

router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authValidators.updateProfile, validate, authController.updateProfile);
router.put('/change-password', authenticate, authValidators.changePassword, validate, authController.changePassword);

module.exports = router;
