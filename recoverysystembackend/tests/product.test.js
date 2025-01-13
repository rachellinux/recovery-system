const request = require('supertest');
const app = require('../server');
const Product = require('../models/Product');
const User = require('../models/User');

describe('Product Endpoints', () => {
  let adminToken;

  beforeEach(async () => {
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
  });

  describe('POST /api/products', () => {
    it('should create new product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Panel',
          category: 'panel',
          description: 'Test Description',
          capacity: '100W',
          price: 200,
          quantityInStock: 10
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty('name', 'Test Panel');
    });
  });

  describe('PUT /api/products/:id/stock', () => {
    it('should update product stock', async () => {
      // First create a product
      const product = await Product.create({
        name: 'Test Panel',
        category: 'panel',
        description: 'Test Description',
        capacity: '100W',
        price: 200,
        quantityInStock: 10
      });

      const res = await request(app)
        .put(`/api/products/${product._id}/stock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          quantityInStock: 15
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.quantityInStock).toBe(15);
    });
  });
}); 