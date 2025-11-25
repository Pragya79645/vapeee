import { v2 as cloudinary } from 'cloudinary';
import Product from '../models/productModel.js';
import { productSchema } from "../validation/productValidation.js";

// Function to add product
const addProduct = async (req, res) => {
    try {
        const { productId, name, description, price, categories, flavour, variants, stockCount, inStock, showOnPOS, otherFlavours, bestseller } = req.body;

        // Validate input using Joi
        const { error, value } = productSchema.validate(
            { productId, name, description, price, categories, flavour, variants, stockCount, inStock, showOnPOS, otherFlavours, bestseller },
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

        const product = new Product({
            productId: value.productId,
            name: value.name,
            description: value.description,
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
        });

        await product.save();

        res.status(201).json({ success: true, message: "Product added successfully" });

    } catch (error) {
        console.error("Add product error:", error.message);
        res.status(500).json({ success: false, message: "Server error: " + error.message });
    }
};

// Function for Products list using _id keyset pagination
const listProducts = async (req, res) => {
    try {
        const { lastId, limit } = req.query;
        const queryLimit = parseInt(limit) || 10;

        const query = lastId
            ? { _id: { $lt: lastId } }  // Fetch older than last seen ID
            : {};

        const products = await Product.find(query)
            .sort({ _id: -1 }) // Newest first by ObjectId
            .limit(queryLimit)
            .select("productId name price images categories flavour variants stockCount inStock showOnPOS bestseller");

        if (!products || products.length === 0) {
            return res.status(200).json({
                success: true,
                products: [],
                hasMore: false,
            });
        }

        const nextCursor = products[products.length - 1]._id;

        res.status(200).json({
            success: true,
            products,
            hasMore: true,
            nextCursor, // Use this as ?lastId in next fetch
        });

    } catch (error) {
        console.error("List Products Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch products. Please try again later.",
        });
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


export { addProduct, listProducts, removeProduct, singleProduct };