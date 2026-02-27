import mongoose from "mongoose";

const actionLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    userType: { type: String, enum: ['Admin', 'Customer', 'System'], required: true },
    actionType: { type: String, required: true }, // e.g. 'PRODUCT_ADD', 'ORDER_PLACE', 'CLOVER_SYNC'
    entityId: { type: String }, // Can be Product ID, Order ID, etc.
    entityName: { type: String }, // e.g. "YoCan iCan"
    details: { type: mongoose.Schema.Types.Mixed }, // JSON for detailed changes
    date: { type: Date, default: Date.now }
});

const ActionLog = mongoose.models.ActionLog || mongoose.model("ActionLog", actionLogSchema);
export default ActionLog;
