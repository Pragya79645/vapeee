import React, { useState, useEffect } from "react";
import { assets } from "../assets/admin_assets/assets";
import axios from "axios";
import { toast } from 'react-toastify';

const CATEGORIES = ["Vape", "E-cigarette", "Pods", "Accessories", "E-liquid"];
const MAX_IMAGE_SIZE_MB = 2;

const Add = () => {
    const [images, setImages] = useState([null, null, null, null]);
    const [productId, setProductId] = useState("");
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [categoriesList, setCategoriesList] = useState(CATEGORIES);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [flavour, setFlavour] = useState("");
    const [variants, setVariants] = useState([{ size: "", price: "", quantity: "" }]);
    const [stockCount, setStockCount] = useState(0);
    const [inStock, setInStock] = useState(true);
    const [showOnPOS, setShowOnPOS] = useState(true);
    const [bestseller, setBestseller] = useState(false);
    const [loading, setLoading] = useState(false);

    const isValidImage = (file) =>
        file && file.type.startsWith("image/") && file.size <= MAX_IMAGE_SIZE_MB * 1024 * 1024;

    const handleImageChange = (index, file) => {
        if (!isValidImage(file)) {
            toast.error(`Invalid file: Must be image and < ${MAX_IMAGE_SIZE_MB}MB`);
            return;
        }
        setImages((prev) => {
            const newImages = [...prev];
            newImages[index] = file;
            return newImages;
        });
    };

    const addVariant = () => {
        setVariants([...variants, { size: "", price: "", quantity: "" }]);
    };

    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const updateVariant = (index, field, value) => {
        const newVariants = [...variants];
        newVariants[index][field] = value;
        setVariants(newVariants);
    };

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("productId", productId);
            formData.append("name", name);
            formData.append("description", description);
            formData.append("price", price);
            // send categories as JSON string
            formData.append("categories", JSON.stringify(selectedCategories));
            formData.append("flavour", flavour);
            formData.append("stockCount", stockCount);
            formData.append("inStock", inStock);
            formData.append("showOnPOS", showOnPOS);
            formData.append("bestseller", bestseller);
            
            // Filter out empty variants before sending
            const validVariants = variants.filter(v => v.size && v.price && v.quantity);
            if (validVariants.length > 0) {
                formData.append("variants", JSON.stringify(validVariants));
            }

            images.forEach((img, index) => {
                if (img) formData.append(`image${index + 1}`, img);
            });

            const res = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/product/add`,
                formData,
                {
                    withCredentials: true,
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );
            if (res.data.success) {
                toast.success(res.data.message);
                // Reset form
                setImages([null, null, null, null]);
                setProductId("");
                setName("");
                setDescription("");
                setPrice("");
                setSelectedCategories([]);
                setFlavour("");
                setVariants([{ size: "", price: "", quantity: "" }]);
                setStockCount(0);
                setInStock(true);
                setShowOnPOS(true);
                setBestseller(false);
            } else{
                toast.error(res.data.message);
            }

        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    // fetch categories from backend so new categories appear in dropdown
    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/category/list`);
            if (res.data?.success && Array.isArray(res.data.categories)) {
                setCategoriesList(res.data.categories);
            }
        } catch (err) {
            console.error('Failed to load categories', err);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    return (
        <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-3">
            <div>
                <p className="mb-2">Upload Images</p>
                <div className="flex gap-2">
                    {images.map((img, index) => (
                        <label key={index} htmlFor={`image${index}`}>
                            <img
                                className="w-20 h-20 object-cover border"
                                src={img ? URL.createObjectURL(img) : assets.upload_area}
                                alt={`Image ${index + 1}`}
                            />
                            <input
                                type="file"
                                id={`image${index}`}
                                hidden
                                accept="image/*"
                                onChange={(e) => handleImageChange(index, e.target.files[0])}
                            />
                        </label>
                    ))}
                </div>
            </div>

            <div className="w-full">
                <p className="mb-2">Product ID</p>
                <input
                    type="text"
                    className="w-full max-w-[500px] px-3 py-2 border"
                    placeholder="e.g., VAPE-001"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    required
                />
            </div>

            <div className="w-full">
                <p className="mb-2">Product Name</p>
                <input
                    type="text"
                    className="w-full max-w-[500px] px-3 py-2 border"
                    placeholder="Type here"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>

            <div className="w-full">
                <p className="mb-2">Product Description</p>
                <textarea
                    className="w-full max-w-[500px] px-3 py-2 border"
                    placeholder="Write content here"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={4}
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {/* Left: categories (span 2 columns on desktop) */}
                <div className="sm:col-span-2">
                    <p className="mb-2">Product Categories</p>

                    {/* Selected category chips */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        {selectedCategories.length === 0 && (
                            <span className="text-sm text-gray-400">No categories selected</span>
                        )}
                        {selectedCategories.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setSelectedCategories(prev => prev.filter(x => x !== c))}
                                className="category-chip"
                            >
                                {c} <span className="ml-2 text-xs">✕</span>
                            </button>
                        ))}
                    </div>

                    {/* Checkbox list for better differentiation */}
                    <div className="category-list border rounded p-2 h-32 overflow-auto bg-white">
                        {categoriesList.map((cat) => {
                            const name = cat.name || cat;
                            const checked = selectedCategories.includes(name);
                            return (
                                <label
                                    key={name}
                                    className={`category-item flex items-center justify-between px-3 py-2 mb-1 rounded ${checked ? 'category-item-checked' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => {
                                                if (checked) setSelectedCategories(prev => prev.filter(x => x !== name));
                                                else setSelectedCategories(prev => [...prev, name]);
                                            }}
                                        />
                                        <span className="text-sm">{name}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">{checked ? 'Selected' : ''}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Right: stacked inputs */}
                <div className="flex flex-col gap-4">
                    <div>
                        <p className="mb-2">Flavour (Optional)</p>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border"
                            placeholder="e.g., Mango, Mint"
                            value={flavour}
                            onChange={(e) => setFlavour(e.target.value)}
                        />
                    </div>

                    <div>
                        <p className="mb-2">Base Price</p>
                        <input
                            type="number"
                            className="w-full px-3 py-2 sm:w-[120px] border"
                            placeholder="25"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <p className="mb-2">Stock Count</p>
                        <input
                            type="number"
                            className="w-full px-3 py-2 sm:w-[120px] border"
                            placeholder="100"
                            value={stockCount}
                            onChange={(e) => setStockCount(Number(e.target.value))}
                            required
                        />
                    </div>

                    <div>
                        <p className="mb-2">In Stock</p>
                        <div>
                            <input
                                type="checkbox"
                                id="inStock"
                                checked={inStock}
                                onChange={() => setInStock(prev => !prev)}
                            />
                            <label htmlFor="inStock" className="ml-2">In Stock</label>
                        </div>
                    </div>

                    <div>
                        <p className="mb-2">Show on POS</p>
                        <div>
                            <input
                                type="checkbox"
                                id="showOnPOS"
                                checked={showOnPOS}
                                onChange={() => setShowOnPOS(prev => !prev)}
                            />
                            <label htmlFor="showOnPOS" className="ml-2">Show on POS</label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Variants Section */}
            <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                    <p>Product Variants (Optional)</p>
                    <button
                        type="button"
                        onClick={addVariant}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                    >
                        + Add Variant
                    </button>
                </div>
                <div className="space-y-2">
                    {variants.map((variant, index) => (
                        <div key={index} className="flex gap-2 items-center">
                            <input
                                type="text"
                                className="px-3 py-2 border flex-1"
                                placeholder="Size (e.g., 10ml, 20ml)"
                                value={variant.size}
                                onChange={(e) => updateVariant(index, "size", e.target.value)}
                            />
                            <input
                                type="number"
                                className="px-3 py-2 border w-32"
                                placeholder="Price"
                                value={variant.price}
                                onChange={(e) => updateVariant(index, "price", e.target.value)}
                            />
                            <input
                                type="number"
                                className="px-3 py-2 border w-32"
                                placeholder="Quantity"
                                value={variant.quantity}
                                onChange={(e) => updateVariant(index, "quantity", e.target.value)}
                            />
                            {variants.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeVariant(index)}
                                    className="px-3 py-2 bg-red-500 text-white rounded"
                                >
                                    X
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 mt-2">
                <input
                    type="checkbox"
                    id="bestseller"
                    checked={bestseller}
                    onChange={() => setBestseller((prev) => !prev)}
                />
                <label htmlFor="bestseller" className="cursor-pointer">
                    Add to bestseller
                </label>
            </div>
            <button
                type="submit"
                className="w-28 py-3 mt-4 bg-black text-white"
                disabled={loading}
            >
                {loading ? "ADDING..." : "ADD"}
            </button>
        </form>
    );
};

export default Add;