const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Use absolute path for the User model
const User = require(path.join(__dirname, '../models/User'));

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if superadmin already exists
    const existingAdmin = await User.findOne({ email: 'superadmin@linuxfriends.com' });
    if (existingAdmin) {
      console.log('Superadmin already exists');
      process.exit(0);
    }

    // Create superadmin
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@linuxfriends.com',
      password: 'Admin@123',
      role: 'superadmin',
      phone: '+237123456789',
      address: 'Linux Friends HQ'
    });

    console.log('Superadmin created successfully:', {
      name: superAdmin.name,
      email: superAdmin.email,
      role: superAdmin.role
    });

  } catch (error) {
    console.error('Error creating superadmin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

createSuperAdmin(); 