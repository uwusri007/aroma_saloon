const { body, param, query: q } = require('express-validator');

const authValidators = {
  register: [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').trim().notEmpty(),
    body('last_name').trim().notEmpty(),
    body('phone').optional().trim(),
  ],
  login: [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  forgotPassword: [body('email').isEmail().normalizeEmail()],
  resetPassword: [
    body('token').notEmpty(),
    body('password').isLength({ min: 6 }),
  ],
  updateProfile: [
    body('first_name').trim().notEmpty(),
    body('last_name').trim().notEmpty(),
    body('phone').optional().trim(),
  ],
  changePassword: [
    body('current_password').notEmpty(),
    body('new_password').isLength({ min: 6 }),
  ],
};

const treatmentValidators = {
  createCategory: [
    body('name').trim().notEmpty(),
    body('description').optional(),
    body('sort_order').optional().isInt(),
  ],
  createTreatment: [
    body('category_id').isInt(),
    body('name').trim().notEmpty(),
    body('duration_minutes').isInt({ min: 5 }),
    body('price').isFloat({ min: 0 }),
  ],
};

const appointmentValidators = {
  calculate: [body('treatment_ids').isArray({ min: 1 })],
  create: [
    body('treatment_ids').isArray({ min: 1 }),
    body('appointment_date').isISO8601(),
    body('start_time').matches(/^\d{2}:\d{2}(:\d{2})?$/),
    body('staff_id').isInt(),
  ],
};

const paymentValidators = {
  createOrder: [
    body('appointment_id').isInt(),
  ],
  capture: [
    body('order_id').notEmpty(),
    body('appointment_id').isInt(),
  ],
};

const adminValidators = {
  createStaff: [body('name').trim().notEmpty()],
  createHoliday: [body('date').isISO8601()],
  updateStatus: [body('status').isIn(['Pending Payment', 'Confirmed', 'Completed', 'Cancelled'])],
};

module.exports = {
  authValidators,
  treatmentValidators,
  appointmentValidators,
  paymentValidators,
  adminValidators,
};
