const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(serviceController.getServices)
  .post(protect, authorize('admin'), serviceController.createService);

router.route('/:id')
  .put(protect, authorize('admin'), serviceController.updateService)
  .delete(protect, authorize('admin'), serviceController.deleteService);

router.post('/:id/request', serviceController.requestService);

router.get('/available-products', protect, authorize('admin'), serviceController.getAvailableProducts);

module.exports = router; 