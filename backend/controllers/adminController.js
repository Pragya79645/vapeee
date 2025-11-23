import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find admin in database
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        // Compare passwords
        const isMatchedPassword = await bcrypt.compare(password, admin.password);
        if (!isMatchedPassword) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        const token = jwt.sign(
            { email, role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Send via HTTP-only cookie
        res.cookie("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(200).json({ success: true, message: "Logged in successfully." });
    } catch (err) {
        console.error("Admin Login Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getAdminData = (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome, admin!",
        admin: req.user,
    });
};

const adminLogout = (req, res) => {
    res.clearCookie("admin_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

export { adminLogin, getAdminData, adminLogout };