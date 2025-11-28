import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    cartData: { type: Object, default: {} },
    // Map of productId -> true for products user asked to be notified about
    notifications_waitlist: { type: Map, of: Boolean, default: {} },
    // Notifications sent to user
    notifications: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        message: { type: String },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }],
}, { minimize: false, timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
