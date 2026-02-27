import Category from '../models/categoryModel.js';
import Product from '../models/productModel.js';
import cloverService from '../services/cloverService.js';

// Helper to generate a simple unique categoryId for local-only categories
const generateCategoryId = () => {
  return 'local_' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 8).toUpperCase();
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Category name is required' });

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ success: false, message: 'Category already exists' });

    let cloverId = null;
    let cloverSyncStatus = 'not_synced';

    // Try to create category in Clover
    try {
      if (cloverService.isConfigured()) {
        const cloverCategories = await cloverService.getCategories();
        // Check if category already exists in Clover by name
        const existingClover = (cloverCategories || []).find(c => c.name && c.name.toLowerCase() === name.trim().toLowerCase());

        if (existingClover) {
          cloverId = existingClover.id;
          cloverSyncStatus = 'synced';
          console.log(`[Category] Found existing Clover category "${name}" with ID: ${cloverId}`);
        } else {
          // Clover doesn't have a direct "create category" endpoint in the standard API,
          // but categories can be created by assigning items to them.
          // For now, we'll create locally and it will be synced when items are assigned.
          console.log(`[Category] Category "${name}" created locally. Will sync to Clover when items are assigned.`);
          cloverSyncStatus = 'local_only';
        }
      }
    } catch (cloverErr) {
      console.error('[Category] Failed to check Clover categories:', cloverErr.message);
      cloverSyncStatus = 'sync_failed';
    }

    const categoryId = cloverId || generateCategoryId();
    const category = new Category({
      name: name.trim(),
      categoryId,
      cloverId: cloverId || undefined
    });
    await category.save();

    res.status(201).json({ success: true, category, cloverSyncStatus });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 }).lean();

    // Count products per category — categories are now [{cloverId, name}] objects
    const counts = await Product.aggregate([
      { $unwind: { path: '$categories', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$categories.name', count: { $sum: 1 } } }
    ]);

    const countMap = counts.reduce((acc, cur) => { acc[cur._id] = cur.count; return acc; }, {});

    const result = categories.map(c => ({
      _id: c._id,
      name: c.name,
      categoryId: c.categoryId,
      cloverId: c.cloverId || null,
      cloverLinked: !!c.cloverId,
      items: countMap[c.name] || 0
    }));

    res.status(200).json({ success: true, categories: result });
  } catch (err) {
    console.error('List categories error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    // Note: Clover categories can't be deleted via API in most cases,
    // but we remove the local reference
    if (category.cloverId) {
      console.log(`[Category] Deleting local category "${category.name}" (Clover ID: ${category.cloverId}). Note: Clover category remains.`);
    }

    await category.deleteOne();
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteCategories = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No category IDs provided' });
    }

    await Category.deleteMany({ _id: { $in: ids } });
    res.status(200).json({ success: true, message: 'Categories deleted' });
  } catch (err) {
    console.error('Delete categories error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export { createCategory, listCategories, deleteCategory, deleteCategories };
