const express = require('express');
const appointmentController = require('../controllers/appointment.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { appointmentValidators } = require('../validators');

const router = express.Router();

router.get('/slots', appointmentController.getAvailableSlots);
router.post('/calculate', appointmentValidators.calculate, validate, appointmentController.calculateBooking);

router.use(authenticate);

router.post('/', authorize('Customer', 'Admin'), appointmentValidators.create, validate, appointmentController.createAppointment);
router.get('/my', authorize('Customer'), appointmentController.getMyAppointments);
router.get('/suggestions', authorize('Customer'), appointmentController.getSuggestions);
router.get('/:id', appointmentController.getAppointment);
router.put('/:id/cancel', appointmentController.cancelAppointment);

module.exports = router;
