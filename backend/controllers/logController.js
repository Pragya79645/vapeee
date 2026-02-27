import ActionLog from '../models/actionLogModel.js';

// Get list of logs (paginated) for Admin Dashboard
const getLogs = async (req, res) => {
    try {
        const { page = 1, limit = 50, userType, actionType } = req.query;
        let query = {};

        if (userType) query.userType = userType;
        if (actionType) query.actionType = actionType;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const logs = await ActionLog.find(query)
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('userId', 'name email')
            .populate('adminId', 'email');

        const total = await ActionLog.countDocuments(query);

        res.status(200).json({
            success: true,
            logs,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ success: false, message: "Failed to fetch logs" });
    }
};

// Internal Helper to create a log
const createLog = async ({ userId, adminId, userType, actionType, entityId, entityName, details }) => {
    try {
        const log = new ActionLog({
            userId,
            adminId,
            userType,
            actionType,
            entityId,
            entityName,
            details
        });
        await log.save();
    } catch (error) {
        console.error("Failed to create action log:", error.message);
    }
};

export { getLogs, createLog };
