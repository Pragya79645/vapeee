import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';
import upload from '../middleware/multer.js';

const router = express.Router();

// Public: fetch site settings
router.get('/', getSettings);

// Admin: update site settings (supports file uploads for banners)
router.put('/', verifyAdmin, upload.any(), updateSettings);

export default router;
