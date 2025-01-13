const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },
  dateOfBirth: {
    type: Date,
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'superadmin'],
    default: 'customer',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt only if it's not already hashed
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  // Check if the password is already hashed
  if (this.password.startsWith('$2')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    console.log('\n=== Password Comparison ===');
    console.log('Stored hashed password:', this.password);
    console.log('Entered password:', enteredPassword);
    
    if (!this.password) {
      console.error('No password stored for user');
      return false;
    }

    // Ensure password is trimmed
    const trimmedPassword = enteredPassword.trim();
    const isMatch = await bcrypt.compare(trimmedPassword, this.password);
    console.log('Password match result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

module.exports = mongoose.model('User', userSchema); 