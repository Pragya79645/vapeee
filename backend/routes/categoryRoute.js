import express from 'express';
import { createCategory, listCategories, deleteCategory, deleteCategories } from '../controllers/categoryController.js';
import { verifyAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public listing
router.get('/list', listCategories);

// Admin actions
router.post('/create', verifyAdmin, createCategory);
router.delete('/:id', verifyAdmin, deleteCategory);
router.post('/delete-many', verifyAdmin, deleteCategories);

export default router;
