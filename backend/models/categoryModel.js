import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  categoryId: { type: String, required: true, unique: true },
  cloverId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now }
});

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);
export default Category;
