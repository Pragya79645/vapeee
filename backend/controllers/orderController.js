import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";

// Place order using COD Method
const placeOrderCOD = async (req, res) => {
    try {
        const userId = req.user._id;
        const { phone, items, amount, address } = req.body;

        // Basic validation
        if (!phone || !items || !Array.isArray(items) || items.length === 0 || !amount) {
            return res.status(400).json({ error: "All fields are required." });
        }
        const { street, city, state, zip, country } = address;
        if (!street || !city || !state || !zip || !country) {
            return res.status(400).json({ error: "Complete address is required." });
        }

        // Validate each product exists and requested size/variant is available
        for (let item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ error: `Product not found: ${item.name}` });
            }
            // Figure out requested size from either `variantSize` or legacy `size` field
            const requestedSize = item.variantSize || item.size || 'default';

            // Prefer validating against `variants` (new schema). Fall back to `sizes` if present.
            const variantSizes = Array.isArray(product.variants) && product.variants.length
                ? product.variants.map(v => v.size)
                : (Array.isArray(product.sizes) ? product.sizes : []);

            if (variantSizes.length > 0 && !variantSizes.includes(requestedSize)) {
                return res.status(400).json({ error: `Size ${requestedSize} not available for product ${item.name}` });
            }

            // Attach snapshot of product image URL to the order item so order reflects the image at booking time
            try {
                item.image = (product.images && product.images.length) ? product.images[0].url : '';
            } catch (err) {
                item.image = '';
            }
            // If no variantSizes are provided on product, accept any size (or 'default')
        }

        // Create new order
        const newOrder = new Order({
            userId,
            phone,
            items,
            amount,
            address,
            status: "Pending",
            paymentMethod: "CashOnDelivery",
            payment: false
        });

        await newOrder.save();
        await User.findByIdAndUpdate(userId, { cartData: {} }, { new: true });

        return res.status(201).json({ success: true, message: "Order placed successfully with Cash on Delivery." });
    } catch (err) {
        console.error("Error placing COD order:", err);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

// Place order using Stripe Method
const placeOrderStripe = async (req, res) => {

}

// All orders data for Admin Panel
const allOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate("userId", "name email")
            .populate("items.productId", "images variants name");

        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching all orders:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// User Order Data
const userOrders = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find orders by user ID, sorted by most recent first
        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate("items.productId", "images variants");

        return res.status(200).json({ success: true, orders });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


// Update order status
const orderStatus = async (req, res) => {
    try {
        const { orderId, status, itemId } = req.body;

        // Validate input
        if (!orderId || !status) {
            return res.status(400).json({ success: false, message: "Order ID and status are required." });
        }

        const allowedStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value." });
        }

        // If itemId provided, update only that item's status
        if (itemId) {
            // Use positional operator to update nested item
            const updatedOrder = await Order.findOneAndUpdate(
                { _id: orderId, 'items._id': itemId },
                { $set: { 'items.$.status': status } },
                { new: true }
            ).populate("userId", "name email");

            if (!updatedOrder) {
                return res.status(404).json({ success: false, message: "Order or item not found." });
            }

            return res.status(200).json({ success: true, message: "Order item status updated successfully.", order: updatedOrder });
        }

        // Otherwise update whole order-level status
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        ).populate("userId", "name email");

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        return res.status(200).json({ success: true, message: "Order status updated successfully.", order: updatedOrder });

    } catch (error) {
        console.error("Error updating order status:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};


export { placeOrderCOD, placeOrderStripe, allOrders, userOrders, orderStatus };