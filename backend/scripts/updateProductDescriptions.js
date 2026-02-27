import mongoose from 'mongoose';
import connectDB from '../config/mongodb.js';
import Product from '../models/productModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Generate detailed description based on product information
const generateDescription = (product) => {
    const name = product.name || 'This product';
    const flavour = product.flavour || 'unique flavor';

    // Extract category names if they are objects
    const categoriesList = product.categories && product.categories.length > 0
        ? product.categories.map(c => typeof c === 'string' ? c : (c.name || 'vaping'))
        : ['vaping'];

    const categories = categoriesList.join(', ');

    // Check if it's a vape product
    const vapeKeywords = ['vape', 'vaping', 'e-juice', 'e-liquid', 'pod', 'disposable', 'coil', 'tank', 'kit'];
    const isVape = categoriesList.some(cat => {
        const catString = String(cat || '');
        return vapeKeywords.some(keyword => catString.toLowerCase().includes(keyword));
    });

    // Calculate total pods/units based on variants
    let podInfo = '';
    if (product.variants && product.variants.length > 0) {
        const sizes = product.variants.map(v => v.size).join(', ');
        podInfo = ` Available in multiple sizes: ${sizes}.`;
    }

    // Sweetness and mint level information
    let flavorProfile = '';
    if (product.sweetnessLevel !== undefined && product.sweetnessLevel !== null) {
        flavorProfile += ` With a sweetness level of ${product.sweetnessLevel}/10`;
    }
    if (product.mintLevel !== undefined && product.mintLevel !== null && product.mintLevel > 0) {
        flavorProfile += ` and a refreshing mint level of ${product.mintLevel}/10`;
    }
    if (flavorProfile) {
        flavorProfile += ', this product delivers a perfectly balanced taste experience.';
    }

    // Build the description
    const experienceType = isVape ? 'vaping' : 'user';
    let description = `${name} is an exceptional ${categories} product that delivers an outstanding ${experienceType} experience. `;

    if (flavour && flavour !== 'unique flavor') {
        description += `This premium ${isVape ? 'vape' : 'product'} features the exquisite flavor of ${flavour}, carefully crafted to provide a satisfying and authentic taste${isVape ? ' with every puff' : ''}. `;
    }

    if (podInfo) {
        description += podInfo;
    }

    if (flavorProfile) {
        description += ` ${flavorProfile}`;
    }

    description += ` Designed with the adult user in mind, this product adheres to all specifications and regulatory guidelines set by governing authorities. `;
    description += `Each unit is manufactured to the highest quality standards, ensuring consistency, safety, and satisfaction. `;
    description += `The sleek and convenient design makes it perfect for on-the-go use, while the premium ingredients guarantee a smooth and enjoyable ${experienceType} experience. `;

    if (product.bestseller) {
        description += `This bestselling product has become a favorite among our customers for its exceptional quality and remarkable flavor profile. `;
    }

    description += `Please note: This product is intended exclusively for adult users aged 19 and over. By purchasing this product, you confirm that you meet the legal age requirements in your jurisdiction. `;
    description += `Always use responsibly and in accordance with local laws and regulations.`;

    return description;
};

// Update products with empty or broken descriptions
const updateProductDescriptions = async (force = false) => {
    try {
        // Find all products with empty, missing, or broken descriptions
        const query = force ? {} : {
            $or: [
                { description: { $exists: false } },
                { description: '' },
                { description: null },
                { description: { $regex: /cloverId|ObjectId/i } } // Fix broken ones
            ]
        };

        const products = await Product.find(query);
        console.log(`Found ${products.length} products to process`);

        if (products.length === 0) {
            console.log('No products need updating. All products have descriptions.');
            return;
        }

        let updatedCount = 0;

        for (const product of products) {
            const newDescription = generateDescription(product);

            product.description = newDescription;
            await product.save();

            updatedCount++;
            console.log(`✓ Updated: ${product.name} (ID: ${product.productId})`);
        }

        console.log(`\n✅ Successfully updated ${updatedCount} products with detailed descriptions.`);

    } catch (error) {
        console.error('Error updating products:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
};

// Run the script
const run = async () => {
    console.log('Starting product description update script...\n');
    await connectDB();
    await updateProductDescriptions();
};

run();
