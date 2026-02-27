import 'dotenv/config';
import mongoose from 'mongoose';
import { syncClover } from './controllers/adminController.js';

async function run() {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/ecommerce`);
        console.log('MongoDB Connected');

        const req = { body: {}, query: {}, user: { email: 'test@admin.com' } };
        const res = {
            status: (code) => ({
                json: (data) => console.log(`Response ${code}:`, data)
            })
        };

        console.log('Starting syncClover...');
        await syncClover(req, res);
        console.log('Finished syncClover');
    } catch (e) {
        console.error('CRASH:', e);
    }
    process.exit(0);
}
run();
