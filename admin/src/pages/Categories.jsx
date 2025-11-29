import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);

  const fetchCategories = async () => {
    try {
      const backend = import.meta.env.VITE_BACKEND_URL || '';
      const url = `${backend}/api/category/list`;
      console.log('Fetching categories from:', url);
      const res = await axios.get(url, { withCredentials: true });
      if (res.data.success) {
        setCategories(res.data.categories);
        setSelectedCategories([]); // Reset selection on refresh
      }
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

  const deleteSelected = async () => {
    if (selectedCategories.length === 0) return;

    const tId = toast.info(
      (
        <div className="flex flex-col text-sm">
          <div className="mb-3">Delete <strong>{selectedCategories.length}</strong> categories? This action cannot be undone.</div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => toast.dismiss(tId)}
              className="px-3 py-1 border rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(tId);
                try {
                  const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/category/delete-many`, { ids: selectedCategories }, { withCredentials: true });
                  if (res.data.success) {
                    toast.success(res.data.message);
                    fetchCategories();
                  } else {
                    toast.error(res.data.message);
                  }
                } catch (err) {
                  console.error(err);
                  toast.error('Failed to delete categories');
                }
              }}
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

  const toggleCategory = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    (cat.categoryId && cat.categoryId.toString().includes(search))
  );

  const toggleAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map(c => c._id));
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-xl">Categories</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded w-full sm:w-64"
          />
          {selectedCategories.length > 0 && (
            <button
              onClick={deleteSelected}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 whitespace-nowrap"
            >
              Delete ({selectedCategories.length})
            </button>
          )}
        </div>
      </div>

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

      <div className="bg-white border border-gray-100 rounded-md shadow-sm overflow-hidden">
        {filteredCategories.length > 0 && (
          <div className="p-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50">
            <input
              type="checkbox"
              checked={filteredCategories.length > 0 && selectedCategories.length === filteredCategories.length}
              onChange={toggleAll}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-500">Select All</span>
          </div>
        )}
        <div className="grid gap-0 divide-y divide-gray-100">
          {filteredCategories.map(cat => (
            <div key={cat._id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div>
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat._id)}
                    onChange={() => toggleCategory(cat._id)}
                    className="w-4 h-4"
                    aria-label={`select ${cat.name}`}
                  />
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
          {filteredCategories.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No categories found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;
