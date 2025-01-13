const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getUserPurchases
} = require('../controllers/productController');

// Public routes
router.get('/', getProducts);
router.get('/:id', getProduct);

// Admin only routes
router.post('/', protect, isAdmin, createProduct);
router.put('/:id', protect, isAdmin, updateProduct);
router.delete('/:id', protect, isAdmin, deleteProduct);
router.put('/:id/stock', protect, isAdmin, updateStock);

// Add this new route
router.get('/user/:userId/purchases', protect, getUserPurchases);

module.exports = router; 