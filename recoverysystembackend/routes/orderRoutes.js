const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrder,
  createProductOrder,
  createCourseOrder,
  updateOrderStatus,
  updatePaymentStatus,
  getMyOrders,
  getMyPurchases,
  getOrdersByProduct
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - orderType
 *         - client
 *         - items
 *         - totalAmount
 *       properties:
 *         orderType:
 *           type: string
 *           enum: [product, service, course]
 *         client:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *             location:
 *               type: string
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *               service:
 *                 type: string
 *               course:
 *                 type: string
 *               quantity:
 *                 type: number
 *         totalAmount:
 *           type: number
 *         paymentStatus:
 *           type: string
 *           enum: [pending, completed, failed]
 *         status:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 * 
 * /orders/products:
 *   post:
 *     summary: Create product order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               client:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   location:
 *                     type: string
 *     responses:
 *       201:
 *         description: Order created
 */

// Customer routes - these should come first
router.get('/my-orders', protect, getMyOrders);

// Admin routes
router.route('/')
  .get(protect, authorize('admin'), getOrders);

router.route('/product/:productId')
  .get(protect, authorize('admin'), getOrdersByProduct);

router.route('/:id')
  .get(protect, authorize('admin'), getOrder);

router.route('/:id/status')
  .put(protect, authorize('admin'), updateOrderStatus);

router.route('/:id/payment')
  .put(protect, authorize('admin'), updatePaymentStatus);

// Public routes
router.route('/products')
  .post(createProductOrder);

// Protected routes
router.route('/courses')
  .post(protect, createCourseOrder);

router.get('/my-purchases', protect, getMyPurchases);

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, completed, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated
 *       404:
 *         description: Order not found
 *       403:
 *         description: Not authorized
 * 
 * /orders/{id}/payment:
 *   put:
 *     summary: Update payment status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentStatus
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [pending, completed, failed]
 *     responses:
 *       200:
 *         description: Payment status updated
 *       404:
 *         description: Order not found
 *       403:
 *         description: Not authorized
 */

module.exports = router; 