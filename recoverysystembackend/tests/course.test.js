const request = require('supertest');
const app = require('../server');
const Course = require('../models/Course');
const User = require('../models/User');

describe('Course Endpoints', () => {
  let token;
  let adminToken;
  let studentId;

  beforeEach(async () => {
    await Course.deleteMany({});
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

    // Create student user
    const studentRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student User',
        email: 'student@example.com',
        password: 'password123'
      });
    token = studentRes.body.data.token;
    studentId = studentRes.body.data._id;
  });

  describe('POST /api/courses', () => {
    it('should create new course if admin', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Course',
          description: 'Test Description',
          level: 'beginner',
          category: 'office suite',
          price: 100,
          startDate: '2024-01-01',
          endDate: '2024-03-01',
          maxStudents: 20
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty('name', 'Test Course');
    });

    it('should not create course if not admin', async () => {
      const res = await request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Course',
          description: 'Test Description',
          level: 'beginner',
          price: 100
        });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/courses/:id/enroll', () => {
    it('should enroll student in course', async () => {
      // Create a course first
      const course = await Course.create({
        name: 'Test Course',
        description: 'Test Description',
        level: 'beginner',
        category: 'office suite',
        price: 100,
        startDate: '2024-01-01',
        endDate: '2024-03-01',
        maxStudents: 20
      });

      const res = await request(app)
        .post(`/api/courses/${course._id}/enroll`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.enrolledStudents).toContain(studentId);
    });

    it('should not enroll if course is full', async () => {
      // Create a course with max students = 1
      const course = await Course.create({
        name: 'Test Course',
        description: 'Test Description',
        level: 'beginner',
        category: 'office suite',
        price: 100,
        startDate: '2024-01-01',
        endDate: '2024-03-01',
        maxStudents: 1,
        enrolledStudents: ['someOtherId']
      });

      const res = await request(app)
        .post(`/api/courses/${course._id}/enroll`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Course is full');
    });
  });
}); 