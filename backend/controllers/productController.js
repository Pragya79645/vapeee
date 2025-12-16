import { v2 as cloudinary } from 'cloudinary';
import xlsx from 'xlsx';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import User from '../models/userModel.js';
import Cart from '../models/cartModel.js';
import { productSchema } from "../validation/productValidation.js";
import { getIO } from '../socket.js';
import cloverService from '../services/cloverService.js';

// Helper function to generate detailed description based on product information
const generateDescription = (productData) => {
    const name = productData.name || 'This product';
    const flavour = productData.flavour || 'unique flavor';
    const categories = productData.categories && productData.categories.length > 0 
        ? productData.categories.join(', ') 
        : 'vaping';
    
    // Calculate total pods/units based on variants
    let podInfo = '';
    if (productData.variants && productData.variants.length > 0) {
        const sizes = productData.variants.map(v => v.size).join(', ');
        podInfo = ` Available in multiple sizes: ${sizes}.`;
    }
    
    // Sweetness and mint level information
    let flavorProfile = '';
    if (productData.sweetnessLevel !== undefined && productData.sweetnessLevel !== null) {
        flavorProfile += ` With a sweetness level of ${productData.sweetnessLevel}/10`;
    }
    if (productData.mintLevel !== undefined && productData.mintLevel !== null && productData.mintLevel > 0) {
        flavorProfile += ` and a refreshing mint level of ${productData.mintLevel}/10`;
    }
    if (flavorProfile) {
        flavorProfile += ', this product delivers a perfectly balanced taste experience.';
    }
    
    // Build the description
    let description = `${name} is an exceptional ${categories} product that delivers an outstanding vaping experience. `;
    
    if (flavour) {
        description += `This premium vape features the exquisite flavor of ${flavour}, carefully crafted to provide a satisfying and authentic taste with every puff. `;
    }
    
    if (podInfo) {
        description += podInfo;
    }
    
    if (flavorProfile) {
        description += ` ${flavorProfile}`;
    }
    
    description += ` Designed with the adult user in mind, this product adheres to all specifications and regulatory guidelines set by governing authorities. `;
    description += `Each unit is manufactured to the highest quality standards, ensuring consistency, safety, and satisfaction. `;
    description += `The sleek and convenient design makes it perfect for on-the-go use, while the premium ingredients guarantee a smooth and enjoyable vaping experience. `;
    
    if (productData.bestseller) {
        description += `This bestselling product has become a favorite among our customers for its exceptional quality and remarkable flavor profile. `;
    }
    
    description += `Please note: This product is intended exclusively for adult users aged 21 and over. By purchasing this product, you confirm that you meet the legal age requirements in your jurisdiction. `;
    description += `Always use responsibly and in accordance with local laws and regulations.`;
    
    return description;
};

// Function to add product
const addProduct = async (req, res) => {
    try {
        const { productId, name, description, price, categories, flavour, variants, stockCount, inStock, showOnPOS, otherFlavours, bestseller, sweetnessLevel, mintLevel } = req.body;

        // Validate input using Joi
        const { error, value } = productSchema.validate(
            { productId, name, description, price, categories, flavour, variants, stockCount, inStock, showOnPOS, otherFlavours, bestseller, sweetnessLevel, mintLevel },
            { abortEarly: false }
        );

        if (error) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.details.map((err) => err.message),
            });
        }

        // Parse variants and otherFlavours if sent as string
        const parsedVariants = value.variants
            ? (typeof value.variants === "string" ? JSON.parse(value.variants) : value.variants)
            : [];

        const parsedOtherFlavours = value.otherFlavours
            ? (typeof value.otherFlavours === "string" ? JSON.parse(value.otherFlavours) : value.otherFlavours)
            : [];

        // Process uploaded images
        const image1 = req?.files?.image1?.[0];
        const image2 = req?.files?.image2?.[0];
        const image3 = req?.files?.image3?.[0];
        const image4 = req?.files?.image4?.[0];

        const images = [image1, image2, image3, image4].filter((img) => img !== undefined);

        if (images.length === 0) {
            return res.status(400).json({ success: false, message: "At least one image is required" });
        }

        // Upload images to Cloudinary with per-image error handling + debug logs
        const imagesResults = [];
        for (const image of images) {
            try {
                console.log('Uploading image to Cloudinary, path:', image.path);
                const result = await cloudinary.uploader.upload(image.path, { resource_type: "image", folder: "products" });
                imagesResults.push({
                    url: result.secure_url.toString(),
                    public_id: result.public_id.toString(),
                });
            } catch (uploadErr) {
                // Masked env values for debugging
                const mask = (s) => (typeof s === 'string' && s.length > 6) ? s.slice(0, 3) + '...' + s.slice(-3) : s;
                console.error('Cloudinary upload failed for file:', image.path);
                console.error('Upload error full:', uploadErr);
                console.error('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? process.env.CLOUDINARY_CLOUD_NAME : 'missing');
                console.error('CLOUDINARY_API_KEY:', mask(process.env.CLOUDINARY_API_KEY));
                console.error('CLOUDINARY_API_SECRET:', mask(process.env.CLOUDINARY_API_SECRET));

                // Return helpful error for frontend
                return res.status(500).json({
                    success: false,
                    message: `Cloudinary upload error: ${uploadErr.message || 'unknown error'}`,
                    details: uploadErr && uploadErr.http_code ? { http_code: uploadErr.http_code, error: uploadErr } : undefined
                });
            }
        }

        // Construct and save product
        // Ensure categories is an array
        const parsedCategories = value.categories
            ? (typeof value.categories === 'string' ? JSON.parse(value.categories) : value.categories)
            : [];

        // Auto-generate description if empty
        let finalDescription = value.description;
        if (!finalDescription || finalDescription.trim() === '') {
            finalDescription = generateDescription({
                name: value.name,
                flavour: value.flavour,
                categories: parsedCategories,
                variants: parsedVariants,
                sweetnessLevel: value.sweetnessLevel !== undefined ? Number(value.sweetnessLevel) : 5,
                mintLevel: value.mintLevel !== undefined ? Number(value.mintLevel) : 0,
                bestseller: value.bestseller
            });
        }

        const product = new Product({
            productId: value.productId,
            name: value.name,
            description: finalDescription,
            price: Number(value.price),
            images: imagesResults,
            categories: parsedCategories,
            flavour: value.flavour || "",
            variants: parsedVariants,
            stockCount: Number(value.stockCount),
            inStock: value.inStock === undefined ? (Number(value.stockCount) > 0) : Boolean(value.inStock),
            showOnPOS: value.showOnPOS === undefined ? true : Boolean(value.showOnPOS),
            otherFlavours: parsedOtherFlavours,
            bestseller: value.bestseller,
            sweetnessLevel: value.sweetnessLevel !== undefined ? Number(value.sweetnessLevel) : 5,
            mintLevel: value.mintLevel !== undefined ? Number(value.mintLevel) : 0,
        });

        await product.save();

        // Best-effort: create item in Clover to keep POS in sync
        /* 
        // Auto-sync disabled per user request
        try {
            if (cloverService.isConfigured()) {
                const created = await cloverService.createProductInClover(product);
                // If clover returned an id, persist it for future updates/deletes
                const cloverId = created && (created.id || created.itemId || created._id || created.externalId);
                if (cloverId) {
                    product.externalCloverId = String(cloverId);
                    await product.save();
                    console.log('Stored externalCloverId on product:', product.externalCloverId);
                } else {
                    console.log('Clover createItem result (no id):', created);
                }
            }
        } catch (clErr) {
            console.error('Failed to push new product to Clover:', clErr.message || clErr);
        }
        */

        // Emit product created so clients can update lists in realtime
        try {
            const io = getIO();
            if (io) {
                io.emit('productCreated', {
                    product: {
                        _id: product._id.toString(),
                        productId: product.productId,
                        name: product.name,
                        price: product.price,
                        images: product.images,
                        categories: product.categories,
                        flavour: product.flavour,
                        variants: product.variants,
                        stockCount: product.stockCount,
                        inStock: product.inStock,
                        showOnPOS: product.showOnPOS,
                        bestseller: product.bestseller
                    }
                });
            }
        } catch (e) {
            console.error('Failed to emit productCreated socket event:', e);
        }

        // Send success response
        res.json({ success: true, message: "Product added successfully" });
    } catch (error) {
        console.error("Add Product Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Function to list products with pagination
const listProducts = async (req, res) => {
    try {
        const { page, limit, search } = req.query;
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        let query = {};
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query = {
                $or: [
                    { name: searchRegex },
                    { description: searchRegex },
                    { categories: searchRegex },
                    { productId: searchRegex }
                ]
            };
        }

        const products = await Product.find(query)
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limitNumber);

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limitNumber);

        res.status(200).json({
            success: true,
            products,
            currentPage: pageNumber,
            totalPages,
            totalProducts,
            hasMore: pageNumber < totalPages
        });
    } catch (error) {
        console.error("List Products Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Function for remove product
const removeProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID format
        if (!id || id.length !== 24) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        // Find and delete the product
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Delete each image from Cloudinary
        await Promise.all(
            product.images.map(async (img) => {
                if (img.public_id) {
                    await cloudinary.uploader.destroy(img.public_id);
                }
            })
        )
        await product.deleteOne();

        // Remove references to this product from all user carts so deleted products don't remain in carts
        try {
            await Cart.updateMany({}, { $pull: { items: { productId: product._id } } });
        } catch (cartErr) {
            console.error('Failed to remove product references from carts:', cartErr);
        }

        try {
            const io = getIO();
            if (io) {
                io.emit('productRemoved', { productId: product._id.toString() });
            }
        } catch (e) { console.error('Failed to emit productRemoved:', e); }

        // Best-effort: remove from Clover by externalCloverId or SKU/productId if configured
        /*
        // Auto-sync disabled per user request
        try {
            if (cloverService.isConfigured()) {
                const clId = product.externalCloverId || product.productId || undefined;
                if (clId) await cloverService.deleteProductInClover(clId).catch(() => null);
            }
        } catch (err) {
            console.error('Failed to delete product from Clover:', err.message || err);
        }
        */

        res.status(200).json({ success: true, message: "Product removed successfully" });

    } catch (error) {
        console.error("Remove Product Error:", error);
        res.status(500).json({ success: false, message: "Failed to remove product. Please try again later." });
    }
};

// Function for single product info
const singleProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ID format (MongoDB ObjectId length is 24 characters)
        if (!id || id.length !== 24) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({ success: true, product });

    } catch (error) {
        console.error("Single Product Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch product" });
    }
};

// Update product by id (supports replacing specific images)
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id.length !== 24) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });

        const { productId, name, description, price, categories, flavour, variants, stockCount, inStock, showOnPOS, otherFlavours, bestseller, sweetnessLevel, mintLevel } = req.body;

        // Validate core fields (images optional on update)
        const { error, value } = productSchema.validate(
            { productId, name, description, price, categories, flavour, variants, stockCount, inStock, showOnPOS, otherFlavours, bestseller, sweetnessLevel, mintLevel },
            { abortEarly: false }
        );

        if (error) {
            return res.status(400).json({ success: false, message: "Validation failed", errors: error.details.map((err) => err.message) });
        }

        // Parse arrays if strings
        const parsedVariants = value.variants
            ? (typeof value.variants === "string" ? JSON.parse(value.variants) : value.variants)
            : [];

        const parsedCategories = value.categories
            ? (typeof value.categories === 'string' ? JSON.parse(value.categories) : value.categories)
            : [];

        const parsedOtherFlavours = value.otherFlavours
            ? (typeof value.otherFlavours === 'string' ? JSON.parse(value.otherFlavours) : value.otherFlavours)
            : [];

        // Handle uploaded images: replace the corresponding image slot if new file provided
        const image1 = req?.files?.image1?.[0];
        const image2 = req?.files?.image2?.[0];
        const image3 = req?.files?.image3?.[0];
        const image4 = req?.files?.image4?.[0];

        const newFiles = [image1, image2, image3, image4];

        for (let i = 0; i < newFiles.length; i++) {
            const file = newFiles[i];
            if (file) {
                try {
                    const result = await cloudinary.uploader.upload(file.path, { resource_type: "image", folder: "products" });
                    // If slot exists, remove old image from cloudinary
                    if (product.images && product.images[i] && product.images[i].public_id) {
                        try {
                            await cloudinary.uploader.destroy(product.images[i].public_id);
                        } catch (err) {
                            console.error('Failed to destroy old image:', err);
                        }
                    }
                    // Replace or append
                    product.images[i] = {
                        url: result.secure_url.toString(),
                        public_id: result.public_id.toString()
                    };
                } catch (uploadErr) {
                    console.error('Cloudinary upload failed during update for file:', file.path, uploadErr);
                    return res.status(500).json({ success: false, message: `Cloudinary upload error: ${uploadErr.message || 'unknown error'}` });
                }
            }
        }

        // Clean up product.images if some indices are empty, keep existing ones
        product.productId = value.productId;
        product.name = value.name;
        
        // Auto-generate description if empty
        let finalDescription = value.description;
        if (!finalDescription || finalDescription.trim() === '') {
            finalDescription = generateDescription({
                name: value.name,
                flavour: value.flavour,
                categories: parsedCategories,
                variants: parsedVariants,
                sweetnessLevel: value.sweetnessLevel !== undefined ? Number(value.sweetnessLevel) : product.sweetnessLevel,
                mintLevel: value.mintLevel !== undefined ? Number(value.mintLevel) : product.mintLevel,
                bestseller: value.bestseller
            });
        }
        product.description = finalDescription;
        
        product.price = Number(value.price);
        product.categories = parsedCategories;
        product.flavour = value.flavour || "";
        product.variants = parsedVariants;
        // detect previous stock to notify waitlist users when stock moves 0 -> >0
        const prevStock = product.stockCount || 0;
        const newStock = Number(value.stockCount);
        product.stockCount = newStock;
        product.inStock = value.inStock === undefined ? (newStock > 0) : Boolean(value.inStock);
        product.showOnPOS = value.showOnPOS === undefined ? product.showOnPOS : Boolean(value.showOnPOS);
        product.otherFlavours = parsedOtherFlavours;
        product.bestseller = value.bestseller;
        product.sweetnessLevel = value.sweetnessLevel !== undefined ? Number(value.sweetnessLevel) : product.sweetnessLevel;
        product.mintLevel = value.mintLevel !== undefined ? Number(value.mintLevel) : product.mintLevel;

        // If product was previously out of stock and now restocked, notify waitlist
        if (prevStock === 0 && newStock > 0) {
            try {
                // find users who are waiting for this product
                const key = product._id.toString();
                const waitingUsers = await User.find({ [`notifications_waitlist.${key}`]: true });
                for (const u of waitingUsers) {
                    u.notifications = u.notifications || [];
                    // Deduplicate: skip if there is already an unread notification for this product
                    const alreadyUnread = (u.notifications || []).some(n => n.productId && n.productId.toString() === key && !n.read);
                    if (!alreadyUnread) {
                        // push notification subdoc
                        u.notifications.push({ productId: product._id, message: `${product.name} is back in stock` });
                        const newNotif = u.notifications[u.notifications.length - 1];

                        // remove from waitlist map
                        if (u.notifications_waitlist && u.notifications_waitlist.delete) {
                            try { u.notifications_waitlist.delete(key); } catch (e) { /* ignore */ }
                        } else if (u.notifications_waitlist && u.notifications_waitlist[key]) {
                            delete u.notifications_waitlist[key];
                        }

                        await u.save();

                        // emit to that user's socket room (if connected)
                        try {
                            const io = getIO();
                            if (io) {
                                const payload = {
                                    _id: newNotif._id,
                                    productId: product._id,
                                    message: newNotif.message,
                                    read: newNotif.read || false,
                                    createdAt: newNotif.createdAt || new Date(),
                                    product: {
                                        name: product.name,
                                        thumbnail: (product.images && product.images.length) ? product.images[0].url : undefined
                                    }
                                };
                                io.to(`user:${u._id.toString()}`).emit('notification', payload);
                            }
                        } catch (emitErr) {
                            console.error('Failed to emit notification socket event:', emitErr);
                        }
                    } else {
                        // even if already unread, remove waitlist entry so user won't be re-notified
                        if (u.notifications_waitlist && u.notifications_waitlist.delete) {
                            try { u.notifications_waitlist.delete(key); } catch (e) { /* ignore */ }
                        } else if (u.notifications_waitlist && u.notifications_waitlist[key]) {
                            delete u.notifications_waitlist[key];
                        }
                        await u.save();
                    }
                }
            } catch (notifErr) {
                console.error('Failed to notify waitlist users:', notifErr);
            }
        }

        await product.save();

        // Emit product update via Socket.IO so clients can refresh UI live
        // Best-effort: update item on Clover
        /*
        // Auto-sync disabled per user request
        try {
            if (cloverService.isConfigured()) {
                const clId = product.externalCloverId || product.productId || product._id.toString();
                const updated = await cloverService.updateProductInClover(clId, product).catch(() => null);
                // If no external id was present but update returned an id, save it
                const returnedId = updated && (updated.id || updated.itemId || updated._id || updated.externalId);
                if (!product.externalCloverId && returnedId) {
                    product.externalCloverId = String(returnedId);
                    await product.save();
                }
            }
        } catch (clErr) {
            console.error('Failed to update product on Clover:', clErr.message || clErr);
        }
        */
        try {
            const io = getIO();
            if (io) {
                io.emit('productUpdated', {
                    product: {
                        _id: product._id.toString(),
                        productId: product.productId,
                        name: product.name,
                        price: product.price,
                        images: product.images,
                        categories: product.categories,
                        flavour: product.flavour,
                        variants: product.variants,
                        stockCount: product.stockCount,
                        inStock: product.inStock,
                        showOnPOS: product.showOnPOS,
                        bestseller: product.bestseller,
                        sweetnessLevel: product.sweetnessLevel,
                        mintLevel: product.mintLevel,
                        description: product.description
                    }
                });
            }
        } catch (e) {
            console.error('Failed to emit socket productUpdated:', e);
        }

        res.status(200).json({ success: true, message: "Product updated successfully" });
    }
    catch (error) {
        console.error("Update Product Error:", error);
        res.status(500).json({ success: false, message: "Failed to update product" });
    }
};

const downloadTemplate = async (req, res) => {
    try {
        const headers = [
            ["Sr. Number", "Product Name", "Brand Name", "Flavour", "Price ( In CAD $ )", "Puff Count", "Container Capacity in ml", "Nicotine Strength", "Intense or Smooth", "Product Id", "Category", "Image URL 1", "Image URL 2", "Image URL 3", "Image URL 4"]
        ];

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.aoa_to_sheet(headers);
        xlsx.utils.book_append_sheet(wb, ws, "Template");

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=products_template.xlsx');
        res.send(buffer);
    } catch (error) {
        console.error("Download Template Error:", error);
        res.status(500).json({ success: false, message: "Failed to download template" });
    }
};

const importProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        if (data.length === 0) {
            return res.status(400).json({ success: false, message: "Excel sheet is empty" });
        }

        const operations = [];
        let successCount = 0;

        for (const row of data) {
            const productId = row['Product Id'];
            const name = row['Product Name'];
            const price = row['Price ( In CAD $ )'];

            // Skip if mandatory fields missing
            if (!productId || !name || price === undefined) continue;

            // Extra fields for description
            const brand = row['Brand Name'] || '';
            const flavour = row['Flavour'] || '';
            const puffCount = row['Puff Count'] || '';
            const containerCapacity = row['Container Capacity in ml'] || '';
            const nicotine = row['Nicotine Strength'] || '';
            const intenseSmooth = row['Intense or Smooth'] || '';

            // Construct description
            let description = `Brand: ${brand}\nPuff Count: ${puffCount}\nNicotine: ${nicotine}\nType: ${intenseSmooth}`;
            if (row['Sr. Number']) description = `Sr No: ${row['Sr. Number']}\n` + description;

            // Variants
            let variants = [];
            if (containerCapacity) {
                variants.push({
                    size: String(containerCapacity),
                    price: Number(price),
                    quantity: 0
                });
            } else {
                variants.push({
                    size: "Default",
                    price: Number(price),
                    quantity: 0
                });
            }

            // Image URLs
            const imageUrls = [
                row['Image URL 1'],
                row['Image URL 2'],
                row['Image URL 3'],
                row['Image URL 4']
            ].filter(url => url && typeof url === 'string' && url.trim().length > 0);

            const images = imageUrls.map(url => ({
                url: url.trim(),
                public_id: null // External URL, no cloudinary public_id
            }));

            // Categories
            const categoryStr = row['Category'];
            const categories = categoryStr ? String(categoryStr).split(',').map(c => c.trim()) : [];

            operations.push({
                updateOne: {
                    filter: { productId: String(productId) },
                    update: {
                        $set: {
                            name: String(name),
                            price: Number(price),
                            description: description,
                            categories: categories,
                            flavour: String(flavour),
                            variants: variants,
                            // If images are provided in the sheet, update them. 
                            // If not, we might want to keep existing ones? 
                            // Current requirement implies "include image url so it will render", 
                            // so if provided, we should probably set them.
                            // If the user wants to keep existing images, they should leave these columns blank?
                            // Or maybe we only update images if new ones are provided.
                            // For now, if images array has items, we update.
                            ...(images.length > 0 && { images: images })
                        },
                        $setOnInsert: {
                            stockCount: 0,
                            inStock: false,
                            // If no images provided, initialize empty
                            ...(images.length === 0 && { images: [] }),
                            showOnPOS: true,
                            bestseller: false,
                            sweetnessLevel: 5,
                            mintLevel: 0,
                            otherFlavours: []
                        }
                    },
                    upsert: true
                }
            });
            successCount++;
        }

        if (operations.length > 0) {
            await Product.bulkWrite(operations);
        }

        res.json({ success: true, message: `${successCount} products processed successfully` });

    } catch (error) {
        console.error("Import Products Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const exportProducts = async (req, res) => {
    try {
        const products = await Product.find({}).sort({ createdAt: -1 });

        const data = products.map((p, index) => {
            // Flatten categories
            const categoryStr = (p.categories || []).join(', ');

            // Extract description fields if possible, or just dump full description
            // Since we construct description from fields, valid reverse parsing is hard.
            // We'll just put the full description in one of the fields or leave them blank
            // and maybe put everything in 'Product Description'? 
            // The template has specific fields: Brand Name, Puff Count etc. 
            // If we can't parse them back, we might just leave them empty or put the whole desc in one.
            // However, the import logic builds description from these. 
            // For now, let's map common fields and maybe parse simple key-values if they exist in description.

            // Simple parsing attempt for description lines
            const descLines = (p.description || '').split('\n');
            const getVal = (key) => {
                const line = descLines.find(l => l.startsWith(key + ':'));
                return line ? line.split(':')[1].trim() : '';
            };

            const brand = getVal('Brand') || '';
            const puffCount = getVal('Puff Count') || '';
            const nicotine = getVal('Nicotine') || '';
            const type = getVal('Type') || ''; // Intense or Smooth
            const srNo = getVal('Sr No') || (index + 1);

            // Container Capacity from first variant or default
            const containerCapacity = (p.variants && p.variants.length > 0) ? p.variants[0].size : '';

            return {
                "Sr. Number": srNo,
                "Product Name": p.name,
                "Brand Name": brand,
                "Flavour": p.flavour,
                "Price ( In CAD $ )": p.price,
                "Puff Count": puffCount,
                "Container Capacity in ml": containerCapacity,
                "Nicotine Strength": nicotine,
                "Intense or Smooth": type,
                "Product Id": p.productId,
                "Category": categoryStr,
                "Image URL 1": p.images && p.images[0] ? p.images[0].url : '',
                "Image URL 2": p.images && p.images[1] ? p.images[1].url : '',
                "Image URL 3": p.images && p.images[2] ? p.images[2].url : '',
                "Image URL 4": p.images && p.images[3] ? p.images[3].url : ''
            };
        });

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);

        // Adjust column widths? (Optional, skip for now)

        xlsx.utils.book_append_sheet(wb, ws, "Products");

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=products_export.xlsx');
        res.send(buffer);

    } catch (error) {
        console.error("Export Products Error:", error);
        res.status(500).json({ success: false, message: "Failed to export products" });
    }
};

const deleteProducts = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "No product IDs provided" });
        }

        // Find products to delete to clean up images
        const products = await Product.find({ _id: { $in: ids } });

        for (const product of products) {
            // Delete images from Cloudinary
            if (product.images && product.images.length > 0) {
                await Promise.all(
                    product.images.map(async (img) => {
                        if (img.public_id) {
                            await cloudinary.uploader.destroy(img.public_id);
                        }
                    })
                );
            }

            // Remove from carts
            try {
                await Cart.updateMany({}, { $pull: { items: { productId: product._id } } });
            } catch (cartErr) {
                console.error('Failed to remove product references from carts:', cartErr);
            }

            // Best-effort: remove from Clover
            /*
            // Auto-sync disabled per user request
            try {
                if (cloverService.isConfigured()) {
                    const clId = product.externalCloverId || product.productId || undefined;
                    if (clId) await cloverService.deleteProductInClover(clId).catch(() => null);
                }
            } catch (err) {
                console.error('Failed to delete product from Clover:', err.message || err);
            }
            */
        }

        await Product.deleteMany({ _id: { $in: ids } });

        // Emit socket event
        try {
            const io = getIO();
            if (io) {
                // For bulk delete, maybe just emit a refresh signal or multiple productRemoved
                // Let's emit multiple productRemoved for simplicity or a new bulk event
                // Emitting multiple might be spammy but safe for now
                ids.forEach(id => io.emit('productRemoved', { productId: id }));
            }
        } catch (e) { console.error('Failed to emit productRemoved:', e); }

        res.status(200).json({ success: true, message: "Products deleted successfully" });
    } catch (error) {
        console.error("Delete Products Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete products" });
    }
};

const clearDatabase = async (req, res) => {
    try {
        await Product.deleteMany({});
        await Category.deleteMany({});
        // Also clear cart items, because they reference products that no longer exist
        await Cart.updateMany({}, { $set: { items: [], amount: 0 } });

        res.status(200).json({ success: true, message: "Database cleared successfully (Products, Categories & Carts)" });
    } catch (error) {
        console.error("Clear Database Error:", error);
        res.status(500).json({ success: false, message: "Failed to clear database" });
    }
};

export { addProduct, listProducts, removeProduct, singleProduct, updateProduct, deleteProducts, downloadTemplate, importProducts, exportProducts, clearDatabase };