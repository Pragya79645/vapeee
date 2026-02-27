import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Settings = () => {
  const [loading, setLoading] = useState(false);
  const [navbar, setNavbar] = useState([]);
  const [hero, setHero] = useState({ slides: [] });
  const [products, setProducts] = useState([]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/settings`);
      if (res.data.success) {
        const s = res.data.settings;
        setNavbar(s.navbar || []);
        // ensure hero has slides
        const heroData = s.hero || {};
        if (Array.isArray(heroData.slides) && heroData.slides.length) setHero(heroData);
        else {
          // fallback: convert images to slides if present
          const imgs = heroData.images || [];
          const slides = imgs.map((src, i) => ({ src, title: heroData.title || '', subtitle: heroData.subtitle || '', slot: i === 0 ? 'banner' : 'grid' }));
          while (slides.length < 4) slides.push({ src: '', title: '', subtitle: '', slot: slides.length === 0 ? 'banner' : 'grid' });
          setHero({ slides });
        }
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

  // Slides management (slot: 'banner' | 'grid')
  const addSlide = (slot = 'grid') => setHero({ slides: [...(hero.slides || []), { src: '', title: '', subtitle: '', slot }] });
  const updateSlide = (i, field, value) => {
    const slides = [...(hero.slides || [])]; slides[i][field] = value; setHero({ slides });
  };
  const removeSlide = (i) => setHero({ slides: (hero.slides || []).filter((_, idx) => idx !== i) });
  const slidesBySlot = (slot) => (hero.slides || []).map((s, idx) => ({ ...s, __idx: idx })).filter(s => s.slot === slot);

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
      const payload = { navbar, hero };
      const res = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/settings`, payload, { withCredentials: true });
      if (res.data.success) {
        toast.success('Settings saved');
      } else {
        toast.error(res.data.message || 'Failed to save');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Site Settings</h2>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Navbar Links</h3>
          <button onClick={addNavItem} className="px-3 py-1 border rounded-md text-sm bg-white">+ Add</button>
        </div>
        <div className="space-y-2">
          {navbar.map((item, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input value={item.label} onChange={e => updateNavItem(i, 'label', e.target.value)} placeholder="Label" className="px-3 py-2 border rounded-md flex-1" />
              <input value={item.href} onChange={e => updateNavItem(i, 'href', e.target.value)} placeholder="Href" className="px-3 py-2 border rounded-md w-56" />
              <button onClick={() => removeNavItem(i)} className="px-2 py-1 bg-red-100 text-red-700 rounded-md">Remove</button>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="font-medium mb-2">Hero - Banner Slides</h3>
        <p className="text-sm text-gray-500 mb-3">Banner slides appear in the main hero carousel. Each slide has its own image, title and subtitle.</p>
        <div className="space-y-3">
          {slidesBySlot('banner').map((s) => (
            <div key={s.__idx} className="flex flex-col gap-2 p-3 border rounded-md bg-gray-50 items-start">
              <div className="w-full flex items-center justify-between">
                <select
                  className="px-3 py-1.5 border rounded border-blue-300 bg-blue-50 text-blue-800 text-sm outline-none"
                  onChange={(e) => handleProductPick(s.__idx, e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Auto-fill from a Product...</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name} {p.flavour ? `(${p.flavour})` : ''}</option>
                  ))}
                </select>
                <button onClick={() => removeSlide(s.__idx)} className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-sm">Remove</button>
              </div>

              <div className="flex gap-2 w-full mt-2">
                <input value={s.src} onChange={e => updateSlide(s.__idx, 'src', e.target.value)} placeholder="Image URL" className="px-3 py-2 border rounded-md flex-1" />
                <div className="w-96 flex flex-col gap-2">
                  <input value={s.title} onChange={e => updateSlide(s.__idx, 'title', e.target.value)} placeholder="Title" className="px-3 py-2 border rounded-md w-full" />
                  <input value={s.subtitle} onChange={e => updateSlide(s.__idx, 'subtitle', e.target.value)} placeholder="Subtitle" className="px-3 py-2 border rounded-md w-full" />
                  <input value={s.link} onChange={e => updateSlide(s.__idx, 'link', e.target.value)} placeholder="Page Link (e.g. /product/123)" className="px-3 py-2 border rounded-md w-full" />
                </div>
              </div>
              <div className="w-64">
                <input value={s.title} onChange={e => updateSlide(s.__idx, 'title', e.target.value)} placeholder="Title" className="px-3 py-2 border rounded-md w-full mb-2" />
                <input value={s.subtitle} onChange={e => updateSlide(s.__idx, 'subtitle', e.target.value)} placeholder="Subtitle" className="px-3 py-2 border rounded-md w-full mb-2" />
                <input value={s.link} onChange={e => updateSlide(s.__idx, 'link', e.target.value)} placeholder="Page Link (e.g. /product/123)" className="px-3 py-2 border rounded-md w-full" />
              </div>
            </div>
          ))}
          <div>
            <button onClick={() => addSlide('banner')} className="px-3 py-1 border rounded-md text-sm bg-white">+ Add Banner Slide</button>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h3 className="font-medium mb-2">Hero - Grid Slides</h3>
        <p className="text-sm text-gray-500 mb-3">These images appear as the three grid items below the main banner. Each has its own title/subtitle.</p>
        <div className="space-y-3">
          {slidesBySlot('grid').map((s) => (
            <div key={s.__idx} className="flex flex-col gap-2 p-3 border rounded-md bg-gray-50 items-start">
              <div className="w-full flex items-center justify-between">
                <select
                  className="px-3 py-1.5 border rounded border-blue-300 bg-blue-50 text-blue-800 text-sm outline-none"
                  onChange={(e) => handleProductPick(s.__idx, e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Auto-fill from a Product...</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name} {p.flavour ? `(${p.flavour})` : ''}</option>
                  ))}
                </select>
                <button onClick={() => removeSlide(s.__idx)} className="px-2 py-1 bg-red-100 text-red-700 rounded-md text-sm">Remove</button>
              </div>

              <div className="flex gap-2 w-full mt-2">
                <input value={s.src} onChange={e => updateSlide(s.__idx, 'src', e.target.value)} placeholder="Image URL" className="px-3 py-2 border rounded-md flex-1" />
                <div className="w-96 flex flex-col gap-2">
                  <input value={s.title} onChange={e => updateSlide(s.__idx, 'title', e.target.value)} placeholder="Title" className="px-3 py-2 border rounded-md w-full" />
                  <input value={s.subtitle} onChange={e => updateSlide(s.__idx, 'subtitle', e.target.value)} placeholder="Subtitle" className="px-3 py-2 border rounded-md w-full" />
                  <input value={s.link} onChange={e => updateSlide(s.__idx, 'link', e.target.value)} placeholder="Page Link (e.g. /product/123)" className="px-3 py-2 border rounded-md w-full" />
                </div>
              </div>
              <div className="w-64">
                <input value={s.title} onChange={e => updateSlide(s.__idx, 'title', e.target.value)} placeholder="Title" className="px-3 py-2 border rounded-md w-full mb-2" />
                <input value={s.subtitle} onChange={e => updateSlide(s.__idx, 'subtitle', e.target.value)} placeholder="Subtitle" className="px-3 py-2 border rounded-md w-full" />
              </div>
            </div>
          ))}
          <div>
            <button onClick={() => addSlide('grid')} className="px-3 py-1 border rounded-md text-sm bg-white">+ Add Grid Slide</button>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button onClick={onSave} disabled={loading} className="px-4 py-2 bg-black text-white rounded-md">{loading ? 'Saving...' : 'Save Settings'}</button>
      </div>
    </div>
  );
};

export default Settings;
