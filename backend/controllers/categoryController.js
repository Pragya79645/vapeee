import Category from '../models/categoryModel.js';
import Product from '../models/productModel.js';

// Helper to generate a simple unique categoryId
const generateCategoryId = () => {
  return Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 8).toUpperCase();
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Category name is required' });

    const existing = await Category.findOne({ name: name.trim() });
    if (existing) return res.status(400).json({ success: false, message: 'Category already exists' });

    const category = new Category({ name: name.trim(), categoryId: generateCategoryId() });
    await category.save();

    res.status(201).json({ success: true, category });
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const listCategories = async (req, res) => {
  try {
    // Get all categories
    const categories = await Category.find().sort({ name: 1 }).lean();

    // For each category count products that include this category name in their `categories` array
    const counts = await Product.aggregate([
      { $unwind: { path: '$categories', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$categories', count: { $sum: 1 } } }
    ]);

    const countMap = counts.reduce((acc, cur) => { acc[cur._id] = cur.count; return acc; }, {});

    const result = categories.map(c => ({
      _id: c._id,
      name: c.name,
      categoryId: c.categoryId,
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

    // Optionally, you may want to prevent deletion if items exist. For now, allow deletion.
    await category.deleteOne();
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export { createCategory, listCategories, deleteCategory };
