const request = require('supertest');
const app = require('../server');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

describe('Order Endpoints', () => {
  let adminToken;
  let productId;

  beforeEach(async () => {
    await Order.deleteMany({});
    await Product.deleteMany({});
    await User.deleteMany({});

    // Create admin user
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      });
    adminToken = adminRes.body.data.token;

    // Create a product
    const product = await Product.create({
      name: 'Test Panel',
      category: 'panel',
      description: 'Test Description',
      capacity: '100W',
      price: 200,
      quantityInStock: 10
    });
    productId = product._id;
  });

  describe('POST /api/orders/products', () => {
    it('should create product order', async () => {
      const res = await request(app)
        .post('/api/orders/products')
        .send({
          items: [{
            product: productId,
            quantity: 2
          }],
          client: {
            name: 'Test Client',
            email: 'client@example.com',
            phone: '1234567890',
            location: 'Test Location'
          }
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.orderType).toBe('product');
      expect(res.body.data.totalAmount).toBe(400); // 2 * 200
    });

    it('should not create order if insufficient stock', async () => {
      const res = await request(app)
        .post('/api/orders/products')
        .send({
          items: [{
            product: productId,
            quantity: 20 // More than available stock
          }],
          client: {
            name: 'Test Client',
            email: 'client@example.com',
            phone: '1234567890',
            location: 'Test Location'
          }
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Insufficient stock');
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('should update order status if admin', async () => {
      // Create an order first
      const order = await Order.create({
        orderType: 'product',
        client: {
          name: 'Test Client',
          email: 'client@example.com',
          phone: '1234567890',
          location: 'Test Location'
        },
        items: [{
          product: productId,
          quantity: 1
        }],
        totalAmount: 200,
        status: 'pending'
      });

      const res = await request(app)
        .put(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'completed'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('completed');
    });
  });
}); 