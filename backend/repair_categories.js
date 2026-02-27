
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/productModel.js';
dotenv.config();

function isCorrupted(categories) {
    if (!categories || !Array.isArray(categories)) return false;
    for (const cat of categories) {
        if (!cat) continue;
        const keys = Object.keys(cat);
        const hasNumericKeys = keys.some(k => !isNaN(parseInt(k)));
        const hasName = !!cat.name;
        if (hasNumericKeys && !hasName) return true;
    }
    return false;
}

function repair(categories) {
    return categories.map(cat => {
        const keys = Object.keys(cat);
        const hasNumericKeys = keys.some(k => !isNaN(parseInt(k)));
        const hasName = !!cat.name;

        if (hasNumericKeys && !hasName) {
            let name = '';
            const sortedKeys = keys.filter(k => !isNaN(parseInt(k))).sort((a, b) => parseInt(a) - parseInt(b));
            name = sortedKeys.map(k => cat[k]).join('');
            return {
                name: name.trim() || 'Uncategorized',
                cloverId: cat.cloverId || ''
            };
        }
        return cat;
    });
}

async function run() {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/ecommerce`);
        console.log('Connected to MongoDB (ecommerce)');

        const products = await Product.find({}).lean();
        console.log(`Checking ${products.length} products...`);

        // Debug the first few products
        for (let i = 0; i < Math.min(2, products.length); i++) {
            console.log(`Debug Product ${i}:`, products[i].name);
            console.log(`Categories:`, JSON.stringify(products[i].categories));
            console.log(`Is Corrupted:`, isCorrupted(products[i].categories));
        }

        let fixedCount = 0;
        for (let rawProd of products) {
            if (isCorrupted(rawProd.categories)) {
                const repairedCategories = repair(rawProd.categories);
                try {
                    await Product.updateOne(
                        { _id: rawProd._id },
                        { $set: { categories: repairedCategories } }
                    );
                    fixedCount++;
                } catch (saveErr) {
                    console.error(`Failed to update ${rawProd.name}:`, saveErr.message);
                }
            }
        }

        console.log(`Successfully repaired ${fixedCount} products.`);
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

run();
