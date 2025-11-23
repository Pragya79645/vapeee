import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import 'dotenv/config';
import Admin from '../models/adminModel.js';
import connectDB from '../config/mongodb.js';

// Connect to DB
await connectDB();

// Admin credentials
const email = 'admin@example.com';
const password = 'admin123'; // Change this to your desired password

try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    
    if (existingAdmin) {
        console.log('Admin already exists. Updating password...');
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Update admin
        existingAdmin.password = hashedPassword;
        await existingAdmin.save();
        console.log('Admin password updated successfully!');
    } else {
        // Create new admin
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newAdmin = new Admin({
            email,
            password: hashedPassword,
            role: 'admin'
        });
        
        await newAdmin.save();
        console.log('Admin created successfully!');
    }
    
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    process.exit(0);
} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
