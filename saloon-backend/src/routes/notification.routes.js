const express = require('express');
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', adminController.listNotifications);
router.put('/:id/read', adminController.markNotificationRead);

module.exports = router;
