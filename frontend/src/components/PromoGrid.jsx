import React, { useEffect, useState } from "react";
import axios from 'axios';
import { Link } from "react-router";

const PromoGrid = () => {
    const [gridSlides, setGridSlides] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/settings`);
                if (res.data?.success && res.data.settings) {
                    const s = res.data.settings;
                    // Grid Section (from the new 'grid' field or hero fallback)
                    const gridItems = s.grid?.items?.length ? s.grid.items : (s.hero?.slides?.filter(s => s.slot === 'grid') || []);
                    setGridSlides(gridItems);
                }
            } catch (err) {
                console.error("Promo Grid settings load failed", err);
            }
        };
        load();
    }, []);

    if (gridSlides.length === 0) return null;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 mb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {gridSlides.map((b, idx) => (
                    <Link
                        key={idx}
                        to={b.link || '/collection'}
                        className="relative h-[280px] rounded-2xl overflow-hidden group cursor-pointer block border border-gray-100 bg-white hover:shadow-xl transition-all"
                    >
                        <img className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" src={b.src} alt={b.title || `Grid ${idx + 1}`} />
                        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent p-6 text-white translate-y-2 group-hover:translate-y-0 transition-transform">
                            <h3 className="text-xl font-black mb-1">{b.title}</h3>
                            <p className="text-xs mb-3 opacity-80 line-clamp-1">{b.subtitle}</p>
                            <div className="flex items-center gap-2 text-[10px] font-black text-[#FFB81C] uppercase tracking-wider">
                                <span>Quick View</span>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default PromoGrid;
