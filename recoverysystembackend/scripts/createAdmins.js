const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require(path.join(__dirname, '../models/User'));

async function createAdmins() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Delete existing admins for fresh start
    await User.deleteMany({ 
      email: { 
        $in: ['superadmin@linuxfriends.com', 'admin@linuxfriends.com'] 
      } 
    });
    console.log('Cleared existing admin accounts');

    // Create password hash directly (bypass mongoose middleware)
    const salt = await bcrypt.genSalt(10);
    const superAdminHash = await bcrypt.hash('SuperAdmin@123', salt);
    const adminHash = await bcrypt.hash('Admin@123', salt);

    // Create superadmin with pre-hashed password
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@linuxfriends.com',
      password: superAdminHash, // Use pre-hashed password
      role: 'superadmin',
      phone: '+237123456789',
      address: 'Linux Friends HQ'
    });
    console.log('Superadmin created successfully:', {
      name: superAdmin.name,
      email: superAdmin.email,
      role: superAdmin.role
    });

    // Create regular admin with pre-hashed password
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@linuxfriends.com',
      password: adminHash, // Use pre-hashed password
      role: 'admin',
      phone: '+237987654321',
      address: 'Linux Friends Branch Office'
    });
    console.log('Admin created successfully:', {
      name: admin.name,
      email: admin.email,
      role: admin.role
    });

    // Verify passwords immediately after creation
    const superAdminVerify = await User.findOne({ email: 'superadmin@linuxfriends.com' }).select('+password');
    const superAdminMatch = await bcrypt.compare('SuperAdmin@123', superAdminVerify.password);
    console.log('\nImmediate verification:');
    console.log('Superadmin password match:', superAdminMatch);

    const adminVerify = await User.findOne({ email: 'admin@linuxfriends.com' }).select('+password');
    const adminMatch = await bcrypt.compare('Admin@123', adminVerify.password);
    console.log('Admin password match:', adminMatch);

    console.log('\nAdmin Credentials:');
    console.log('==================');
    console.log('\nSuperadmin:');
    console.log('Email: superadmin@linuxfriends.com');
    console.log('Password: SuperAdmin@123');
    console.log('\nAdmin:');
    console.log('Email: admin@linuxfriends.com');
    console.log('Password: Admin@123');

  } catch (error) {
    console.error('Error creating admins:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

createAdmins(); 