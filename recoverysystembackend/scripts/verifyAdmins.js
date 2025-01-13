const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require(path.join(__dirname, '../models/User'));

async function verifyAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find superadmin
    const superAdmin = await User.findOne({ email: 'superadmin@linuxfriends.com' }).select('+password');
    console.log('\nSuperadmin found:', !!superAdmin);
    if (superAdmin) {
      console.log('Superadmin details:', {
        id: superAdmin._id,
        email: superAdmin.email,
        role: superAdmin.role,
        hasPassword: !!superAdmin.password
      });

      // Test password match
      const testPassword = 'SuperAdmin@123';
      const isMatch = await bcrypt.compare(testPassword, superAdmin.password);
      console.log('Password match test:', isMatch);
    }

    // Find admin
    const admin = await User.findOne({ email: 'admin@linuxfriends.com' }).select('+password');
    console.log('\nAdmin found:', !!admin);
    if (admin) {
      console.log('Admin details:', {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        hasPassword: !!admin.password
      });
    }

  } catch (error) {
    console.error('Verification error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

verifyAdmins(); 