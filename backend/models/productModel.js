import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
    size: { type: String, required: true }, // e.g., "10ml", "20ml", "30ml"
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 0 }
});

const productSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true },
    // External ID from Clover (if synced)
    externalCloverId: { type: String, index: true, sparse: true },
    name: { type: String, required: true },
    // Support multiple categories per product
    categories: { type: [String], default: [] },
    flavour: { type: String, default: "" },
    variants: [variantSchema],
    description: { type: String, required: false },
    // Inventory
    inStock: { type: Boolean, default: true },
    stockCount: { type: Number, required: true, default: 0 }, // Number of units available
    images: [
        {
            url: { type: String, required: true },
            public_id: { type: String }
        }
    ],
    price: { type: Number, required: true }, // Base price
    showOnPOS: { type: Boolean, default: true }, // Visibility on Clover POS
    otherFlavours: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    bestseller: { type: Boolean, default: false }
}, { timestamps: true }); // Auto createdAt and updatedAt

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
