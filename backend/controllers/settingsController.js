import Settings from '../models/settingsModel.js';
import { uploadToVgyMe } from '../utils/vgyMe.js';

// Return the single settings document (create defaults if none exists)
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // create sensible defaults: 1 banner + 3 grid slides
      settings = await Settings.create({
        navbar: [
          { label: 'Home', href: '/' },
          { label: 'Collection', href: '/collection' },
          { label: 'About', href: '/about' },
          { label: 'Contact', href: '/contact' }
        ],
        hero: {
          slides: [
            { src: '', title: 'Welcome', subtitle: 'Featured collection', slot: 'banner' },
            { src: '', title: '', subtitle: '', slot: 'grid' },
            { src: '', title: '', subtitle: '', slot: 'grid' },
            { src: '', title: '', subtitle: '', slot: 'grid' }
          ]
        }
      });
    } else {
      // Migration: if older settings stored hero.images/title/subtitle, convert to slides
      if (settings.hero && (!settings.hero.slides || settings.hero.slides.length === 0)) {
        const imgs = (settings.hero.images || []);
        const title = settings.hero.title || '';
        const subtitle = settings.hero.subtitle || '';
        const slides = imgs.map((src, i) => ({ src, title, subtitle, slot: i === 0 ? 'banner' : 'grid' }));
        // ensure at least one banner + three grid placeholders
        while (slides.length < 4) slides.push({ src: '', title: '', subtitle: '', slot: slides.length === 0 ? 'banner' : 'grid' });
        settings.hero.slides = slides;
        await settings.save();
      }
    }
    return res.json({ success: true, settings });
  } catch (err) {
    console.error('getSettings error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update settings fields (admin only)
export const updateSettings = async (req, res) => {
  try {
    const payload = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    // Handle Navbar
    if (payload.navbar) {
      settings.navbar = typeof payload.navbar === 'string' ? JSON.parse(payload.navbar) : payload.navbar;
    }

    // Handle Hero Slides (JSON string if from FormData)
    if (payload.hero) {
      const h = typeof payload.hero === 'string' ? JSON.parse(payload.hero) : payload.hero;
      if (Array.isArray(h.slides)) {
        settings.hero.slides = h.slides.map(s => ({
          src: s.src || '',
          title: s.title || '',
          subtitle: s.subtitle || '',
          link: s.link || '',
          slot: s.slot === 'grid' ? 'grid' : 'banner'
        }));
      }
    }

    // Handle Banner File Uploads
    const files = req.files || [];
    if (files.length > 0) {
      for (const file of files) {
        if (file.fieldname.startsWith('hero_slide_')) {
          const idx = parseInt(file.fieldname.replace('hero_slide_', ''));
          if (!isNaN(idx) && settings.hero.slides[idx]) {
            try {
              const result = await uploadToVgyMe(file.path);
              settings.hero.slides[idx].src = result.url;
            } catch (uploadErr) {
              console.error(`vgy.me upload failed for hero slide ${idx}:`, uploadErr);
            }
          }
        }
      }
    }

    await settings.save();
    return res.json({ success: true, message: 'Settings updated', settings });
  } catch (err) {
    console.error('updateSettings error', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
