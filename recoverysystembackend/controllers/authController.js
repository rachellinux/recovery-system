const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register user (customer)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) { 
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user with default role 'customer'
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role: 'customer'
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'Registration failed'
    });
  }
};

// @desc    Register admin
// @route   POST /api/auth/admin/register
// @access  Private/SuperAdmin
exports.registerAdmin = async (req, res) => {
  try {
    // Check if the requesting user is a superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmins can create admin accounts'
      });
    }

    const { name, email, password, role } = req.body;

    // Validate role
    if (role && !['admin', 'superadmin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create admin user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'admin'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;
    
    // Trim and validate inputs
    email = email.trim();
    password = password.trim();

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide email and password' 
      });
    }

    console.log('\n=== Login Attempt ===');
    console.log('Email:', email);
    console.log('Password provided:', !!password);

    // Check for user with password field explicitly included
    const user = await User.findOne({ email }).select('+password');
    console.log('\nUser found:', !!user);
    
    if (!user) {
      console.log('No user found with this email');
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials',
        debug: 'User not found'
      });
    }

    console.log('User details:', {
      id: user._id,
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      actualPassword: user.password // temporary for debugging
    });

    // Check password
    const isMatch = await user.matchPassword(password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials',
        debug: 'Password mismatch'
      });
    }

    // Generate token and send response
    const token = generateToken(user._id);
    console.log('Token generated:', !!token);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}; 