import mongoose from 'mongoose';

const NavItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  href: { type: String, required: true }
}, { _id: false });

const SlideSchema = new mongoose.Schema({
  src: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  link: { type: String, default: '' },
  slot: { type: String, enum: ['banner', 'grid'], default: 'banner' }
}, { _id: false });

const SettingsSchema = new mongoose.Schema({
  navbar: { type: [NavItemSchema], default: [] },
  hero: {
    slides: { type: [SlideSchema], default: [] } // Banner slides
  },
  featured: {
    title: { type: String, default: 'New Arrival' },
    product: SlideSchema, // Reuse SlideSchema for image, title, subtitle, link
    sideItems: { type: [SlideSchema], default: [] } // 2 side items
  },
  bestSellers: {
    title: { type: String, default: 'BEST SELLERS' },
    subtitle: { type: String, default: "Discover Knight St. Vape's most popular products! Shop top-rated best sellers." }
  },
  grid: {
    items: { type: [SlideSchema], default: [] } // The 3-6 items below
  }
}, { timestamps: true });

const Settings = mongoose.model('Settings', SettingsSchema);
export default Settings;
