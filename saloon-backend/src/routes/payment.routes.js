const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { paymentValidators } = require('../validators');

const router = express.Router();

router.post('/webhook', paymentController.paypalWebhook);

router.use(authenticate);

router.post('/create-order', paymentValidators.createOrder, validate, paymentController.createPayPalOrder);
router.post('/capture', paymentValidators.capture, validate, paymentController.capturePayment);
router.get('/history', paymentController.getPaymentHistory);

module.exports = router;
