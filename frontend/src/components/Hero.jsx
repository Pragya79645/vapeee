import React, { useEffect, useState, useRef } from "react";
import axios from 'axios';
import { Link, useNavigate } from "react-router";

const Hero = () => {
    const navigate = useNavigate();
    const [bannerSlides, setBannerSlides] = useState(null);
    const [featured, setFeatured] = useState(null);
    const [gridSlides, setGridSlides] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/settings`);
                if (res.data?.success && res.data.settings) {
                    const s = res.data.settings;

                    // Banner Slides
                    const hero = s.hero || {};
                    const slides = Array.isArray(hero.slides) ? hero.slides : [];
                    const banners = slides.filter(s => s.slot === 'banner');
                    setBannerSlides(banners.length ? banners : null);

                    // Featured Section
                    setFeatured(s.featured || null);

                    // Grid Section (from the new 'grid' field or hero fallback)
                    const gridItems = s.grid?.items?.length ? s.grid.items : slides.filter(s => s.slot === 'grid');
                    setGridSlides(gridItems);

                    if (banners.length) return;
                }
            } catch (err) {
                console.error("Hero settings load failed", err);
            }
            // fallback logic omitted for brevity if settings fail, but keeping simple defaults
            setBannerSlides([
                { src: 'https://res.cloudinary.com/dhhs7twmp/image/upload/v1767550898/vapee/products/Allo%20Ultra%2025k/alloultra25k_juicymango_1767550896083_3jb7oh.png', title: 'Allo Ultra 25k', subtitle: 'Juicy Mango - Smart Disposable', link: '/product/695aaac08d9bcf65193c3e2d' }
            ]);
        };
        load();
    }, []);

    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef(null);

    const next = () => setCurrent((c) => (c + 1) % (bannerSlides ? bannerSlides.length : 1));
    const prev = () => setCurrent((c) => (c - 1 + (bannerSlides ? bannerSlides.length : 1)) % (bannerSlides ? bannerSlides.length : 1));

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            if (!isPaused && bannerSlides && bannerSlides.length > 1) next();
        }, 4000);
        return () => clearInterval(timerRef.current);
    }, [isPaused, bannerSlides]);

    if (!bannerSlides) return null;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
            {/* Main Hero Banner (slideshow) */}
            <div
                className="relative w-full h-[400px] rounded-2xl overflow-hidden mb-8 group shadow-lg"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <img
                    className="w-full h-full object-contain transition-transform duration-700"
                    src={bannerSlides[current].src}
                    alt={bannerSlides[current].title || `Banner ${current + 1}`}
                />

                <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/20 to-transparent flex items-center">
                    <div className="text-white px-8 md:px-16 max-w-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-1 bg-[#FFB81C]"></div>
                            <p className="font-bold text-xs md:text-sm tracking-[0.2em] uppercase text-[#FFB81C]">Limited Edition</p>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight drop-shadow-md">
                            {bannerSlides[current].title}
                            <br />
                            <span className="text-xl md:text-2xl font-medium text-gray-200">{bannerSlides[current].subtitle}</span>
                        </h1>
                        <Link
                            to={bannerSlides[current].link || '/collection'}
                            className="inline-flex items-center gap-3 bg-[#FFB81C] text-black px-8 py-4 rounded-xl font-bold hover:bg-white hover:scale-105 transition-all duration-300 shadow-xl"
                        >
                            Shop Now
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {bannerSlides.length > 1 && (
                    <div className="absolute bottom-6 right-8 flex gap-3 z-20">
                        {bannerSlides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-1.5 transition-all duration-300 rounded-full ${i === current ? 'w-8 bg-[#FFB81C]' : 'w-4 bg-white/30 hover:bg-white/50'}`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Hero;