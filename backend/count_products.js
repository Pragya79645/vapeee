
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/productModel.js';
dotenv.config();

async function run() {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/ecommerce`);
        const total = await Product.countDocuments();
        const synced = await Product.countDocuments({ cloverSynced: true });
        const notSynced = await Product.countDocuments({ cloverSynced: { $ne: true } });
        console.log('Total Products:', total);
        console.log('Synced Products:', synced);
        console.log('Not Synced Products:', notSynced);

        // Sample one not synced product to see if it's healthy now
        const sample = await Product.findOne({ cloverSynced: { $ne: true } });
        if (sample) {
            console.log('Sample Not Synced:', sample.name);
            try {
                await sample.validate();
                console.log('Validation: SUCCESS');
            } catch (e) {
                console.log('Validation: FAILED -', e.message);
            }
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
run();
