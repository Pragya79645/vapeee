
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/productModel.js';
dotenv.config();

async function debug() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const p = await Product.findOne({ name: '14" Silicon Water Pipe' }).lean();
        console.log('Product:', p.name);
        console.log('Categories Type:', typeof p.categories);
        console.log('Categories IsArray:', Array.isArray(p.categories));
        console.log('Categories Raw:', JSON.stringify(p.categories, null, 2));
        if (p.categories && p.categories[0]) {
            console.log('Category 0 Type:', typeof p.categories[0]);
            console.log('Category 0 Keys:', Object.keys(p.categories[0]));
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
debug();
