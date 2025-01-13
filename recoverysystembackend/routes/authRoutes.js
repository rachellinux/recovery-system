const express = require('express');
const router = express.Router();
const { register, login, registerAdmin } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/register', protect, authorize('superadmin'), registerAdmin);

// @desc    Check API status
// @route   GET /api/auth/status
// @access  Public
router.get('/status', (req, res) => {
  res.json({ success: true, message: 'Auth service is running' });
});

// Add this route for development/testing only
router.post('/test/create-admin', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }

  try {
    const admin = await User.create({
      name: 'Test Admin',
      email: 'admin@linuxfriends.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+237987654321',
      address: 'Linux Friends Branch Office'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

module.exports = router; 