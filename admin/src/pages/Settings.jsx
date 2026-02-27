import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [navbar, setNavbar] = useState([]);
  const [hero, setHero] = useState({ slides: [] });
  const [featured, setFeatured] = useState({ title: '', product: { src: '', title: '', subtitle: '', link: '' }, sideItems: [] });
  const [bestSellers, setBestSellers] = useState({ title: '', subtitle: '' });
  const [grid, setGrid] = useState({ items: [] });
  const [products, setProducts] = useState([]);
  const [slideFiles, setSlideFiles] = useState({}); // fieldname -> File object

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/settings`);
      if (res.data.success) {
        const s = res.data.settings;
        setNavbar(s.navbar || []);
        setHero(s.hero || { slides: [] });
        setFeatured(s.featured || { title: 'New Arrival', product: { src: '', title: '', subtitle: '', link: '' }, sideItems: [] });
        setBestSellers(s.bestSellers || { title: 'BEST SELLERS', subtitle: '' });
        setGrid(s.grid || { items: [] });
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/product/list?limit=1000`);
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
    delete newFiles[`hero_slide_${i}`];
    setSlideFiles(newFiles);
  };

  const handleSlideFileChange = (fieldname, file) => {
    if (!file) return;
    setSlideFiles(prev => ({ ...prev, [fieldname]: file }));
  };

  const handleProductPick = (target, idx, productId, subTarget = null) => {
    const prod = products.find(p => p._id === productId);
    if (!prod) return;
    const thumb = (prod.images && prod.images[0] && (prod.images[0].url || prod.images[0].secure_url)) || prod.image || '';

    const data = {
      src: thumb,
      title: prod.name,
      subtitle: prod.flavour,
      link: `/product/${prod._id}`,
      productId: prod._id // Helper for variant picker
    };

    if (target === 'hero') {
      const newSlides = [...hero.slides];
      newSlides[idx] = { ...newSlides[idx], ...data };
      setHero({ slides: newSlides });
    } else if (target === 'featured_product') {
      setFeatured({ ...featured, product: { ...featured.product, ...data } });
    } else if (target === 'side_item') {
      const sides = [...featured.sideItems];
      sides[idx] = { ...sides[idx], ...data };
      setFeatured({ ...featured, sideItems: sides });
    } else if (target === 'grid') {
      const items = [...grid.items];
      items[idx] = { ...items[idx], ...data };
      setGrid({ items });
    }
  };

  const handleVariantPick = (target, idx, productId, variantIdx) => {
    const prod = products.find(p => p._id === productId);
    if (!prod) return;
    const variant = prod.variants?.[variantIdx];
    if (!variant) return;

    const data = {
      src: variant.image || (prod.images && prod.images[0]?.url) || '',
      title: prod.name,
      subtitle: variant.flavour || variant.size || prod.flavour,
      link: `/product/${prod._id}?variant=${variantIdx}`
    };

    if (target === 'hero') {
      const newSlides = [...hero.slides];
      newSlides[idx] = { ...newSlides[idx], ...data };
      setHero({ slides: newSlides });
    } else if (target === 'featured_product') {
      setFeatured({ ...featured, product: { ...featured.product, ...data } });
    } else if (target === 'side_item') {
      const sides = [...featured.sideItems];
      sides[idx] = { ...sides[idx], ...data };
      setFeatured({ ...featured, sideItems: sides });
    } else if (target === 'grid') {
      const items = [...grid.items];
      items[idx] = { ...items[idx], ...data };
      setGrid({ items });
    }
  };

  const onSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('navbar', JSON.stringify(navbar));
      formData.append('hero', JSON.stringify(hero));
      formData.append('featured', JSON.stringify(featured));
      formData.append('bestSellers', JSON.stringify(bestSellers));
      formData.append('grid', JSON.stringify(grid));

      Object.keys(slideFiles).forEach(key => {
        formData.append(key, slideFiles[key]);
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

  const ProductSelection = ({ target, idx, current }) => {
    const currentProdId = current?.link?.split('/product/')?.[1]?.split('?')?.[0];
    const currentProd = products.find(p => p._id === currentProdId);

    return (
      <div className="flex flex-col gap-2">
        <select
          className="w-full px-3 py-2 border rounded-lg bg-white text-sm outline-none focus:ring-1 focus:ring-blue-500 text-blue-700 font-medium"
          onChange={(e) => handleProductPick(target, idx, e.target.value)}
          value={currentProdId || ""}
        >
          <option value="" disabled>✨ Auto-fill from Product...</option>
          {products.map(p => (
            <option key={p._id} value={p._id}>{p.name} {p.flavour ? `(${p.flavour})` : ''}</option>
          ))}
        </select>

        {currentProd?.variants?.length > 0 && (
          <select
            className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-xs outline-none focus:ring-1 focus:ring-purple-500 text-purple-700"
            onChange={(e) => handleVariantPick(target, idx, currentProdId, e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>📦 Pick Variant...</option>
            {currentProd.variants.map((v, vIdx) => (
              <option key={vIdx} value={vIdx}>{v.flavour || v.size} {v.price ? `($${v.price})` : ''}</option>
            ))}
          </select>
        )}
      </div>
    );
  };

  const ImageInput = ({ fieldname, currentSrc, label = "Replace Image", aspect = "aspect-video" }) => (
    <div className={`relative ${aspect} rounded-lg border bg-white overflow-hidden group`}>
      {slideFiles[fieldname] ? (
        <img src={URL.createObjectURL(slideFiles[fieldname])} className="w-full h-full object-cover" alt="preview" />
      ) : currentSrc ? (
        <img src={currentSrc} className="w-full h-full object-cover" alt="current" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
        <span className="text-white text-xs font-medium bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">{label}</span>
        <input type="file" hidden accept="image/*" onChange={e => handleSlideFileChange(fieldname, e.target.files[0])} />
      </label>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4">
      <div className="flex items-center justify-between mb-8 border-b pb-4 sticky top-0 bg-gray-50/80 backdrop-blur-md z-30 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Site Settings</h1>
          <p className="text-gray-500 text-sm">Configure your navbar and landing page components.</p>
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

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Side: Navbar & Config */}
        <div className="xl:col-span-3 space-y-8">
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
                    className="px-3 py-1.5 border rounded-md text-sm outline-none focus:ring-1 focus:ring-black font-mono text-gray-400"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4">Best Sellers Section</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Title</label>
                <input
                  value={bestSellers.title}
                  onChange={e => setBestSellers({ ...bestSellers, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Subtitle</label>
                <textarea
                  value={bestSellers.subtitle}
                  onChange={e => setBestSellers({ ...bestSellers, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-sm text-gray-600 h-20"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Side: Hero & Landing Components */}
        <div className="xl:col-span-9 space-y-8">
          {/* Main Hero Slideshow */}
          <section className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">Banner Carousel</h3>
                <p className="text-xs text-gray-500 border-l-2 border-blue-500 pl-2">Top landing page slideshow. Best for high-res horizontal banners.</p>
              </div>
              <button onClick={() => addSlide('banner')} className="px-4 py-2 text-sm font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                + Add Slide
              </button>
            </div>

            <div className="space-y-6">
              {(hero.slides || []).filter(s => s.slot === 'banner').map((s, idx) => {
                const globalIdx = (hero.slides || []).indexOf(s);
                return (
                  <div key={globalIdx} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 border rounded-2xl bg-gray-50/30 relative">
                    <button onClick={() => removeSlide(globalIdx)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 z-10 p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>

                    <div className="md:col-span-4">
                      <ImageInput fieldname={`hero_slide_${globalIdx}`} currentSrc={s.src} />
                      <input
                        value={s.src}
                        onChange={e => updateSlide(globalIdx, 'src', e.target.value)}
                        placeholder="Image URL..."
                        className="w-full mt-2 px-3 py-1.5 border rounded-lg text-[10px] font-mono text-gray-400 bg-white truncate"
                      />
                    </div>

                    <div className="md:col-span-8 flex flex-col gap-3">
                      <ProductSelection target="hero" idx={globalIdx} current={s} />

                      <div className="grid grid-cols-2 gap-3">
                        <input value={s.title} onChange={e => updateSlide(globalIdx, 'title', e.target.value)} placeholder="Title" className="px-3 py-2 border rounded-lg font-bold" />
                        <input value={s.subtitle} onChange={e => updateSlide(globalIdx, 'subtitle', e.target.value)} placeholder="Subtitle" className="px-3 py-2 border rounded-lg" />
                      </div>
                      <input value={s.link} onChange={e => updateSlide(globalIdx, 'link', e.target.value)} placeholder="Link (/product/...)" className="px-3 py-2 border rounded-lg font-mono text-blue-600 text-sm" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Featured Large Section */}
          <section className="bg-white p-6 rounded-xl border shadow-sm border-l-4 border-l-orange-400">
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 text-lg">Featured Spotlight</h3>
              <p className="text-xs text-gray-500">The primary large call-to-action section on the landing page.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-orange-50/30 p-8 rounded-3xl border border-orange-100">
              <div className="space-y-4">
                <input
                  value={featured.title}
                  onChange={e => setFeatured({ ...featured, title: e.target.value })}
                  className="bg-orange-500 text-white px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest outline-none border-none mb-2 w-fit"
                />
                <div className="space-y-4">
                  <ProductSelection target="featured_product" current={featured.product} />
                  <input
                    value={featured.product.title}
                    onChange={e => setFeatured({ ...featured, product: { ...featured.product, title: e.target.value } })}
                    className="text-4xl font-bold block w-full bg-transparent outline-none"
                  />
                  <textarea
                    value={featured.product.subtitle}
                    onChange={e => setFeatured({ ...featured, product: { ...featured.product, subtitle: e.target.value } })}
                    className="text-gray-600 block w-full bg-transparent outline-none h-24 resize-none leading-relaxed"
                  />
                  <div className="flex items-center gap-2 text-sm font-bold border-b-2 border-black w-fit pb-1 cursor-default">
                    Explore Collection →
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <ImageInput fieldname="featured_image" currentSrc={featured.product.src} aspect="aspect-square" label="Featured Image" />
                <input
                  value={featured.product.src}
                  onChange={e => setFeatured({ ...featured, product: { ...featured.product, src: e.target.value } })}
                  placeholder="Featured Image URL..."
                  className="w-full px-3 py-1.5 border rounded-lg text-[10px] font-mono text-gray-400 bg-white"
                />
              </div>
            </div>

            {/* Side items (the 2 narrow ones) */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[0, 1].map(i => {
                const s = featured.sideItems[i] || { src: '', title: '', subtitle: '', link: '' };
                return (
                  <div key={i} className="flex gap-4 p-4 border rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-1/3">
                      <ImageInput fieldname={`side_image_${i}`} currentSrc={s.src} aspect="aspect-square" />
                    </div>
                    <div className="w-2/3 flex flex-col gap-2">
                      <ProductSelection target="side_item" idx={i} current={s} />
                      <input value={s.title} onChange={e => {
                        const items = [...featured.sideItems];
                        items[i] = { ...s, title: e.target.value };
                        setFeatured({ ...featured, sideItems: items });
                      }} placeholder="Title" className="font-bold text-sm" />
                      <input value={s.subtitle} onChange={e => {
                        const items = [...featured.sideItems];
                        items[i] = { ...s, subtitle: e.target.value };
                        setFeatured({ ...featured, sideItems: items });
                      }} placeholder="Subtitle" className="text-gray-500 text-xs" />
                      <div className="text-[10px] font-bold text-orange-500 uppercase">Shop Now →</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Grid Section */}
          <section className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">Promo Grid Items</h3>
                <p className="text-xs text-gray-500">The grid typically shown at the bottom. Great for category highlights.</p>
              </div>
              <button
                onClick={() => setGrid({ items: [...grid.items, { src: '', title: '', subtitle: '', link: '' }] })}
                className="px-4 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-50 transition-colors"
              >
                + Add Grid Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(grid.items || []).map((s, i) => (
                <div key={i} className="flex flex-col gap-3 p-4 border rounded-2xl bg-gray-50/50 relative group">
                  <button onClick={() => {
                    const items = grid.items.filter((_, idx) => idx !== i);
                    setGrid({ items });
                  }} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>

                  <div className="relative aspect-square rounded-xl border bg-white overflow-hidden group-hover:border-gray-300">
                    <ImageInput fieldname={`grid_image_${i}`} currentSrc={s.src} aspect="aspect-square" label="Upload" />
                  </div>

                  <ProductSelection target="grid" idx={i} current={s} />

                  <input value={s.title} onChange={e => {
                    const items = [...grid.items]; items[i].title = e.target.value; setGrid({ items });
                  }} placeholder="Title" className="w-full px-2 py-1 border-b bg-transparent text-sm font-bold outline-none border-transparent focus:border-black" />
                  <input value={s.subtitle} onChange={e => {
                    const items = [...grid.items]; items[i].subtitle = e.target.value; setGrid({ items });
                  }} placeholder="Subtitle" className="w-full px-2 py-1 border-b bg-transparent text-xs text-gray-500 outline-none border-transparent focus:border-black" />
                  <input value={s.link} onChange={e => {
                    const items = [...grid.items]; items[i].link = e.target.value; setGrid({ items });
                  }} placeholder="Link" className="w-full px-2 py-1 border-b bg-transparent text-[10px] text-blue-500 outline-none border-transparent focus:border-black truncate" />
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
