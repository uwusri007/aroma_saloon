const express = require('express');
const adminController = require('../controllers/admin.controller');
const treatmentController = require('../controllers/treatment.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { adminValidators } = require('../validators');

const router = express.Router();

router.use(authenticate, authorize('Admin'));

router.get('/dashboard', adminController.getDashboardStats);

router.get('/appointments', adminController.listAppointments);
router.put('/appointments/:id/status', adminValidators.updateStatus, validate, adminController.updateAppointmentStatus);
router.put('/appointments/:id', adminController.updateAppointment);

router.get('/customers', adminController.listCustomers);
router.get('/customers/:id', adminController.getCustomer);
router.put('/customers/:id/toggle-status', adminController.toggleCustomerStatus);

router.get('/staff', adminController.listStaff);
router.get('/staff/:id', adminController.getStaffMember);
router.post('/staff', adminValidators.createStaff, validate, adminController.createStaff);
router.put('/staff/:id', adminController.updateStaff);
router.delete('/staff/:id', adminController.deleteStaff);

router.get('/working-hours', adminController.getWorkingHours);
router.put('/working-hours', adminController.updateWorkingHours);

router.get('/holidays', adminController.listHolidays);
router.post('/holidays', adminValidators.createHoliday, validate, adminController.createHoliday);
router.delete('/holidays/:id', adminController.deleteHoliday);

router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

router.get('/payments', require('../controllers/payment.controller').getPaymentHistory);

router.post('/treatment-suggestions', adminController.setTreatmentSuggestions);

module.exports = router;
