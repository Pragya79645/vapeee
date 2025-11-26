import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const backend = import.meta.env.VITE_BACKEND_URL || '';
      const url = `${backend}/api/category/list`;
      console.log('Fetching categories from:', url);
      const res = await axios.get(url, { withCredentials: true });
      if (res.data.success) setCategories(res.data.categories);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch categories');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Category name is required');
    setLoading(true);
    try {
      const backend = import.meta.env.VITE_BACKEND_URL || '';
      const url = `${backend}/api/category/create`;
      console.log('Creating category POST ->', url, 'payload:', { name });
      const res = await axios.post(url, { name }, { withCredentials: true });
      if (res.data.success) {
        toast.success('Category created');
        setName('');
        fetchCategories();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    try {
      const res = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/category/${id}`, { withCredentials: true });
      if (res.data.success) {
        toast.success('Category deleted');
        fetchCategories();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete category');
    }
  };

  const onDelete = (id, name) => {
    const tId = toast.info(
      (
        <div className="flex flex-col text-sm">
          <div className="mb-3">Delete <strong>{name}</strong>? This action cannot be undone.</div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => toast.dismiss(tId)}
              className="px-3 py-1 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => { toast.dismiss(tId); await deleteCategory(id); }}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { autoClose: false, closeOnClick: false }
    );
  };

  return (
    <div>
      <h2 className="text-xl mb-4">Categories</h2>

      <form onSubmit={onCreate} className="bg-white p-4 rounded-md shadow-sm mb-4 flex flex-col sm:flex-row gap-3 items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category Name"
          className="px-3 py-2 border rounded w-full sm:flex-1"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-black text-white rounded-md"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>

      <div className="grid gap-3">
        {categories.map(cat => (
          <div key={cat._id} className="flex items-center justify-between bg-white border border-gray-100 rounded-md p-3 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:block">
                <input type="checkbox" aria-label={`select ${cat.name}`} />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-base truncate">{cat.name}</p>
                <p className="text-xs text-gray-400 truncate">ID: <span className="text-gray-600">{cat.categoryId}</span></p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Items</p>
                <p className="font-medium">{cat.items ?? 0}</p>
              </div>

              <div>
                <button
                  onClick={() => onDelete(cat._id, cat.name)}
                  className="text-red-600 inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-red-100 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
