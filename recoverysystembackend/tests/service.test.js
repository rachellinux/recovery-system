const request = require('supertest');
const app = require('../server');
const Service = require('../models/Service');
const User = require('../models/User');
const Product = require('../models/Product');

describe('Service Endpoints', () => {
  let token;
  let adminToken;

  beforeEach(async () => {
    await Service.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});

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

    // Create regular user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    token = userRes.body.data.token;
  });

  describe('GET /api/services', () => {
    it('should get all services', async () => {
      const res = await request(app)
        .get('/api/services');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBeTruthy();
    });
  });

  describe('POST /api/services', () => {
    it('should create new service if admin', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Service',
          description: 'Test Description',
          products: [],
          laborCost: 100
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty('name', 'Test Service');
    });

    it('should not create service if not admin', async () => {
      const res = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Service',
          description: 'Test Description',
          products: [],
          laborCost: 100
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/services/:id', () => {
    it('should get single service with populated products', async () => {
      // Create a product first
      const product = await Product.create({
        name: 'Test Panel',
        category: 'panel',
        description: 'Test Description',
        capacity: '100W',
        price: 200,
        quantityInStock: 10
      });

      // Create a service with the product
      const service = await Service.create({
        name: 'Test Service',
        description: 'Test Description',
        products: [{
          product: product._id,
          quantity: 2
        }],
        laborCost: 100
      });

      const res = await request(app)
        .get(`/api/services/${service._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.products[0].product.name).toBe('Test Panel');
    });

    it('should return 404 for non-existent service', async () => {
      const res = await request(app)
        .get('/api/services/5f7d3a2b1c9d8b4a3c2e1f0a');

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/services/:id/request', () => {
    it('should create service installation request', async () => {
      const service = await Service.create({
        name: 'Test Service',
        description: 'Test Description',
        products: [],
        laborCost: 100,
        totalCost: 100
      });

      const res = await request(app)
        .post(`/api/services/${service._id}/request`)
        .send({
          name: 'Test Client',
          email: 'client@example.com',
          phone: '1234567890',
          location: 'Test Location',
          startDate: '2024-01-01',
          endDate: '2024-01-07'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.orderType).toBe('service');
      expect(res.body.data.client.name).toBe('Test Client');
    });

    it('should validate required fields in request', async () => {
      const service = await Service.create({
        name: 'Test Service',
        description: 'Test Description',
        products: [],
        laborCost: 100,
        totalCost: 100
      });

      const res = await request(app)
        .post(`/api/services/${service._id}/request`)
        .send({
          // Missing required fields
          name: 'Test Client'
        });

      expect(res.statusCode).toBe(400);
    });
  });
}); 