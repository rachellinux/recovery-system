const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  checkout,
  getOrderStatus,
  updatePayment
} = require('../controllers/cartController');

// Public routes (accessible to both logged-in and guest users)
router.post('/checkout', checkout);
router.get('/order/:orderId', getOrderStatus);
router.post('/order/:orderId/payment', updatePayment);

module.exports = router; 