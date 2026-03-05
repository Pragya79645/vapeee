import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";
import { getIO } from "../socket.js";
import { syncLocalProductStock } from "./productController.js";

// Utility function for input validation
const validateCartInput = ({ itemId, variantSize, quantity = null }) => {
    if (!itemId || typeof itemId !== 'string') return "'itemId' is invalid or missing";
    if (!variantSize || typeof variantSize !== 'string') return "'variantSize' is invalid or missing";
    if (quantity !== null) {
        if (typeof quantity !== 'number' || quantity < 0 || !Number.isInteger(quantity)) {
            return "'quantity' must be a non-negative integer";
        }
    }
    return null;
};

// Retry wrapper for handling version conflicts
const retryOnVersionError = async (operation, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            const isVersionError = error.name === 'VersionError' || 
                                   error.message?.includes('No matching document found for id') ||
                                   error.message?.includes('version');
            
            if (isVersionError && attempt < maxRetries) {
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 50 * attempt));
                continue;
            }
            throw error;
        }
    }
};

// Add product to cart
const addToCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { itemId, variantSize, quantity = 1 } = req.body;

        const error = validateCartInput({ itemId, variantSize, quantity });
        if (error) return res.status(400).json({ success: false, message: error });

        // Fetch product to get details
        const product = await Product.findById(itemId);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Real-time stock sync
        const changed = await syncLocalProductStock(product);
        if (changed) {
            await product.save();
        }

        // Find the variant price
        let variantPrice = product.price;
        if (product.variants && product.variants.length > 0) {
            const variant = product.variants.find(v => v.size === variantSize);
            if (variant) {
                variantPrice = variant.price;
            }
        }

        // Wrap cart operation in retry logic
        await retryOnVersionError(async () => {
            // Find or create cart
            let cart = await Cart.findOne({ userId });

            if (!cart) {
                cart = new Cart({
                    userId,
                    items: []
                });
            }

            // Check if item with same variant already exists
            const existingItemIndex = cart.items.findIndex(
                item => item.productId.toString() === itemId && item.variantSize === variantSize
            );

            // Ensure we don't exceed available stock
            const existingQty = existingItemIndex > -1 ? cart.items[existingItemIndex].quantity : 0;
            const requestedTotal = existingQty + quantity;
            if (requestedTotal > (product.stockCount || 0)) {
                throw new Error(`Only ${(product.stockCount || 0) - existingQty} more units available for this product`);
            }

            if (existingItemIndex > -1) {
                // Update quantity
                cart.items[existingItemIndex].quantity = requestedTotal;
            } else {
                // Add new item
                cart.items.push({
                    productId: itemId,
                    name: product.name,
                    variantSize,
                    quantity,
                    price: variantPrice,
                    image: product.images[0]?.url || ""
                });
            }

            await cart.save();
        });

        res.status(200).json({ success: true, message: "Added to cart" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update cart (set quantity or remove)
const updateCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { itemId, variantSize, quantity } = req.body;

        const error = validateCartInput({ itemId, variantSize, quantity });
        if (error) return res.status(400).json({ success: false, message: error });

        // Wrap cart operation in retry logic
        await retryOnVersionError(async () => {
            const cart = await Cart.findOne({ userId });
            if (!cart) {
                throw new Error("Cart not found");
            }

            if (quantity === 0) {
                // Remove item from cart
                cart.items = cart.items.filter(
                    item => !(item.productId.toString() === itemId && item.variantSize === variantSize)
                );
            } else {
                // Update quantity
                const itemIndex = cart.items.findIndex(
                    item => item.productId.toString() === itemId && item.variantSize === variantSize
                );

                if (itemIndex > -1) {
                    // Check requested quantity against product stock
                    const prod = await Product.findById(itemId);
                    if (!prod) throw new Error('Product not found');

                    // Real-time stock sync
                    const changed = await syncLocalProductStock(prod);
                    if (changed) {
                        await prod.save();
                    }

                    if (quantity > (prod.stockCount || 0)) {
                        throw new Error(`Only ${prod.stockCount || 0} units available for this product`);
                    }
                    cart.items[itemIndex].quantity = quantity;
                } else {
                    throw new Error("Item not found in cart");
                }
            }

            await cart.save();
        });

        try {
            // populate items for client update
            const populated = await Cart.findOne({ userId }).populate('items.productId', 'name images price variants');
            const io = getIO();
            if (io) {
                io.to(`user:${userId}`).emit('cartUpdated', populated);
            }
        } catch (e) {
            console.error('Failed to emit cartUpdated', e);
        }

        res.status(200).json({ success: true, message: "Cart updated" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// Get user cart
const getUserCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ userId }).populate('items.productId', 'name images');

        if (!cart) {
            return res.status(200).json({ success: true, cartData: { items: [] } });
        }

        res.status(200).json({ success: true, cartData: cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { addToCart, updateCart, getUserCart };
