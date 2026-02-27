import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [navbar, setNavbar] = useState([]);
  const [hero, setHero] = useState({ slides: [] });
  const [products, setProducts] = useState([]);
  const [slideFiles, setSlideFiles] = useState({}); // idx -> File object

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/settings`);
      if (res.data.success) {
        const s = res.data.settings;
        setNavbar(s.navbar || []);
        setHero(s.hero || { slides: [] });
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/list?limit=500`);
      if (res.data.success) {
        setProducts(res.data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchProducts();
  }, []);

  const addNavItem = () => setNavbar([...navbar, { label: '', href: '' }]);
  const updateNavItem = (i, field, value) => {
    const copy = [...navbar]; copy[i][field] = value; setNavbar(copy);
  };
  const removeNavItem = (i) => setNavbar(navbar.filter((_, idx) => idx !== i));

  const addSlide = (slot = 'grid') => setHero({ slides: [...(hero.slides || []), { src: '', title: '', subtitle: '', link: '', slot }] });
  const updateSlide = (i, field, value) => {
    const slides = [...(hero.slides || [])]; slides[i][field] = value; setHero({ slides });
  };
  const removeSlide = (i) => {
    setHero({ slides: (hero.slides || []).filter((_, idx) => idx !== i) });
    const newFiles = { ...slideFiles };
    delete newFiles[i];
    setSlideFiles(newFiles);
  };
  const slidesBySlot = (slot) => (hero.slides || []).map((s, idx) => ({ ...s, __idx: idx })).filter(s => s.slot === slot);

  const handleSlideFileChange = (i, file) => {
    if (!file) return;
    setSlideFiles(prev => ({ ...prev, [i]: file }));
  };

  const handleProductPick = (i, productId) => {
    const prod = products.find(p => p._id === productId);
    if (!prod) return;
    const thumb = (prod.images && prod.images[0] && (prod.images[0].secure_url || prod.images[0].url)) || prod.image || '';

    const newSlides = [...(hero.slides || [])];
    newSlides[i] = {
      ...newSlides[i],
      src: thumb || newSlides[i].src,
      title: prod.name || newSlides[i].title,
      subtitle: prod.flavour || newSlides[i].subtitle,
      link: `/product/${prod._id}`
    };
    setHero({ slides: newSlides });
  };

  const onSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('navbar', JSON.stringify(navbar));
      formData.append('hero', JSON.stringify(hero));

      Object.keys(slideFiles).forEach(idx => {
        formData.append(`hero_slide_${idx}`, slideFiles[idx]);
      });

      const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/settings`, formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success('Settings saved');
        setSlideFiles({});
        fetchSettings();
      } else {
        toast.error(res.data.message || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Site Settings</h1>
          <p className="text-gray-500 text-sm">Configure your navbar, hero banners, and promotional grid.</p>
        </div>
        <button
          onClick={onSave}
          disabled={loading}
          className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Saving...</>
          ) : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Navbar & Config */}
        <div className="lg:col-span-1 space-y-8">
          <section className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Navbar Menu</h3>
              <button onClick={addNavItem} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {navbar.map((item, i) => (
                <div key={i} className="group flex flex-col gap-2 p-3 border rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors relative">
                  <button
                    onClick={() => removeNavItem(i)}
                    className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-red-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <input
                    value={item.label}
                    onChange={e => updateNavItem(i, 'label', e.target.value)}
                    placeholder="Label (e.g. Shop)"
                    className="px-3 py-1.5 border rounded-md text-sm outline-none focus:ring-1 focus:ring-black"
                  />
                  <input
                    value={item.href}
                    onChange={e => updateNavItem(i, 'href', e.target.value)}
                    placeholder="Link (e.g. /collection)"
                    className="px-3 py-1.5 border rounded-md text-sm outline-none focus:ring-1 focus:ring-black font-mono text-gray-500"
                  />
                </div>
              ))}
              {navbar.length === 0 && <p className="text-center py-4 text-gray-400 text-xs italic">No menu items</p>}
            </div>
          </section>
        </div>

        {/* Right Side: Hero & Grid */}
        <div className="lg:col-span-2 space-y-8">
          {/* Hero Banners */}
          <section className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-800">Banner Carousel</h3>
                <p className="text-xs text-gray-500">Main slides displayed at the top of the homepage.</p>
              </div>
              <button
                onClick={() => addSlide('banner')}
                className="px-3 py-1.5 text-sm font-medium border rounded-lg hover:bg-gray-50 transition-colors"
              >
                + Add Slide
              </button>
            </div>

            <div className="space-y-6">
              {slidesBySlot('banner').map((s) => (
                <div key={s.__idx} className="flex flex-col gap-4 p-5 border rounded-xl bg-gray-50/30">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <select
                        className="w-full px-3 py-2 border rounded-lg bg-white text-sm outline-none focus:ring-1 focus:ring-blue-500 text-blue-700 font-medium"
                        onChange={(e) => handleProductPick(s.__idx, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>✨ Auto-fill from Product...</option>
                        {products.map(p => (
                          <option key={p._id} value={p._id}>{p.name} {p.flavour ? `(${p.flavour})` : ''}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={() => removeSlide(s.__idx)} className="text-red-500 hover:text-red-700 text-sm font-medium">Remove</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Image Section */}
                    <div className="space-y-3">
                      <div className="relative aspect-video rounded-lg border bg-white overflow-hidden group">
                        {slideFiles[s.__idx] ? (
                          <img src={URL.createObjectURL(slideFiles[s.__idx])} className="w-full h-full object-cover" alt="preview" />
                        ) : s.src ? (
                          <img src={s.src} className="w-full h-full object-cover" alt="banner" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                          <span className="text-white text-xs font-medium bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">Replace Image</span>
                          <input type="file" hidden accept="image/*" onChange={e => handleSlideFileChange(s.__idx, e.target.files[0])} />
                        </label>
                      </div>
                      <input
                        value={s.src}
                        onChange={e => updateSlide(s.__idx, 'src', e.target.value)}
                        placeholder="Or paste direct image URL..."
                        className="w-full px-3 py-2 border rounded-md text-xs font-mono text-gray-500 bg-white"
                      />
                    </div>

                    {/* Text Section */}
                    <div className="space-y-3">
                      <input value={s.title} onChange={e => updateSlide(s.__idx, 'title', e.target.value)} placeholder="Main Title" className="w-full px-3 py-2 border rounded-md text-sm font-semibold" />
                      <input value={s.subtitle} onChange={e => updateSlide(s.__idx, 'subtitle', e.target.value)} placeholder="Sub-headline" className="w-full px-3 py-2 border rounded-md text-sm text-gray-600" />
                      <input value={s.link} onChange={e => updateSlide(s.__idx, 'link', e.target.value)} placeholder="Click Link (e.g. /product/id)" className="w-full px-3 py-2 border rounded-md text-sm text-blue-600 font-mono" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Grid Section */}
          <section className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-800">Promo Grid Items</h3>
                <p className="text-xs text-gray-500">The 3-column grid usually shown below the hero.</p>
              </div>
              <button
                onClick={() => addSlide('grid')}
                className="px-3 py-1.5 text-sm font-medium border rounded-lg hover:bg-gray-50 transition-colors"
              >
                + Add Grid Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {slidesBySlot('grid').map((s) => (
                <div key={s.__idx} className="flex flex-col gap-3 p-4 border rounded-xl bg-gray-50/50 relative group">
                  <button onClick={() => removeSlide(s.__idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>

                  <div className="relative aspect-square rounded-lg border bg-white overflow-hidden group-hover:border-gray-300">
                    {slideFiles[s.__idx] ? (
                      <img src={URL.createObjectURL(slideFiles[s.__idx])} className="w-full h-full object-cover" alt="preview" />
                    ) : s.src ? (
                      <img src={s.src} className="w-full h-full object-cover" alt="grid" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <span className="text-white text-[10px] font-medium bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">Upload</span>
                      <input type="file" hidden accept="image/*" onChange={e => handleSlideFileChange(s.__idx, e.target.files[0])} />
                    </label>
                  </div>

                  <input value={s.title} onChange={e => updateSlide(s.__idx, 'title', e.target.value)} placeholder="Title" className="w-full px-2 py-1 border-b bg-transparent text-sm font-medium outline-none border-transparent focus:border-black" />
                  <input value={s.subtitle} onChange={e => updateSlide(s.__idx, 'subtitle', e.target.value)} placeholder="Subtitle" className="w-full px-2 py-1 border-b bg-transparent text-xs text-gray-500 outline-none border-transparent focus:border-black" />
                  <input value={s.link} onChange={e => updateSlide(s.__idx, 'link', e.target.value)} placeholder="Link" className="w-full px-2 py-1 border-b bg-transparent text-[10px] text-blue-500 outline-none border-transparent focus:border-black truncate" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
