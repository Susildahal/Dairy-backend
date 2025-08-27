import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/user.js';

// Function to create admin user from env variables
const createAdminFromEnv = async () => {
  try {
    // Check if admin user already exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@dairyapp.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', adminEmail);
      return;
    }
    
    // Get admin details from env
    const adminUser = {
      name: process.env.ADMIN_NAME || 'Admin User',
      email: adminEmail,
      phone: process.env.ADMIN_PHONE || '9876543210',
      password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin@123', 10),
      role: 'admin'
    };
    
    // Create admin user
    const newAdmin = await User.create(adminUser);
    console.log('Admin user created successfully:', newAdmin.email);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

export default createAdminFromEnv;
