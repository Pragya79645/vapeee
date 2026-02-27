
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/productModel.js';
dotenv.config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        const products = await Product.find({});
        console.log(`Checking ${products.length} products...`);

        for (let p of products) {
            const error = p.validateSync();
            if (error) {
                console.log(`Validation failed for ${p.name}:`, error.message);
                // Specifically check categories
                console.log('Categories:', JSON.stringify(p.categories));
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
check();
