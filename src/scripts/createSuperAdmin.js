import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/user.js';

// ES Module filename/dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (one folder up from src)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const createSuperAdmin = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is not defined in .env file');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for SuperAdmin creation...');

        const superAdminEmail = 'superadmin@dairy.com';
        const existingSuperAdmin = await User.findOne({ email: superAdminEmail });

        if (existingSuperAdmin) {
            console.log('SuperAdmin already exists with email:', superAdminEmail);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash('superadmin123', 10);

        const superAdmin = new User({
            name: 'Super Admin',
            email: superAdminEmail,
            phone: '9800000000',
            password: hashedPassword,
            role: 'superadmin',
            tagnumber: 'SUPER001',
            both: true,
            maxUsers: 999
        });

        await superAdmin.save();
        console.log('✅ SuperAdmin created successfully!');
        console.log('Email: superadmin@dairy.com');
        console.log('Password: superadmin123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating SuperAdmin:', error);
        process.exit(1);
    }
};

createSuperAdmin();
