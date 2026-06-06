const express = require('express');
const treatmentController = require('../controllers/treatment.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { treatmentValidators } = require('../validators');

const router = express.Router();

router.get('/categories', treatmentController.listCategories);
router.get('/categories/:id', treatmentController.getCategory);
router.get('/', treatmentController.listTreatments);
router.get('/:id', treatmentController.getTreatment);

router.post('/categories', authenticate, authorize('Admin'), treatmentValidators.createCategory, validate, treatmentController.createCategory);
router.put('/categories/:id', authenticate, authorize('Admin'), treatmentValidators.createCategory, validate, treatmentController.updateCategory);
router.delete('/categories/:id', authenticate, authorize('Admin'), treatmentController.deleteCategory);

router.post('/', authenticate, authorize('Admin'), treatmentValidators.createTreatment, validate, treatmentController.createTreatment);
router.put('/:id', authenticate, authorize('Admin'), treatmentValidators.createTreatment, validate, treatmentController.updateTreatment);
router.delete('/:id', authenticate, authorize('Admin'), treatmentController.deleteTreatment);

module.exports = router;
