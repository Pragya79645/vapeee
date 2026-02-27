import React, { useEffect, useState } from "react";
import axios from 'axios';
import { Link } from "react-router";

const FeaturedSpotlight = () => {
    const [featured, setFeatured] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/settings`);
                if (res.data?.success && res.data.settings) {
                    setFeatured(res.data.settings.featured || null);
                }
            } catch (err) {
                console.error("Featured Spotlight settings load failed", err);
            }
        };
        load();
    }, []);

    if (!featured) return null;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8 mb-12">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Featured Spotlight</h2>
                <div className="flex-1 h-[1px] bg-gray-100"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[500px]">
                {/* Large Featured Card */}
                <div className="lg:col-span-8 relative rounded-3xl overflow-hidden group bg-gray-50 flex flex-col md:flex-row shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-full md:w-1/2 p-10 flex flex-col justify-center order-2 md:order-1">
                        <span className="inline-block bg-orange-500 text-white text-[10px] font-black px-3 py-1 rounded-full w-fit mb-4 uppercase tracking-widest">{featured.title || 'New Arrival'}</span>
                        <h3 className="text-4xl font-black text-gray-900 mb-4 leading-none">{featured.product?.title}</h3>
                        <p className="text-gray-600 mb-8 line-clamp-3 leading-relaxed">{featured.product?.subtitle}</p>
                        <Link
                            to={featured.product?.link || '/collection'}
                            className="flex items-center gap-2 text-sm font-black border-b-2 border-black w-fit pb-1 hover:gap-4 transition-all"
                        >
                            Explore Collection <span className="text-orange-500">→</span>
                        </Link>
                    </div>
                    <div className="w-full md:w-1/2 h-64 md:h-full order-1 md:order-2">
                        <img
                            src={featured.product?.src}
                            className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-500"
                            alt={featured.product?.title}
                        />
                    </div>
                </div>

                {/* Side Items */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {(featured.sideItems || []).slice(0, 2).map((item, i) => (
                        <Link
                            key={i}
                            to={item.link || '/collection'}
                            className="flex-1 bg-white border border-gray-100 rounded-3xl p-6 flex gap-4 group hover:border-[#FFB81C] hover:shadow-lg transition-all"
                        >
                            <div className="w-1/3 aspect-square rounded-2xl bg-gray-50 overflow-hidden">
                                <img src={item.src} className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform" />
                            </div>
                            <div className="w-2/3 flex flex-col justify-center">
                                <h4 className="font-bold text-lg text-gray-900 mb-1">{item.title}</h4>
                                <p className="text-gray-500 text-xs mb-3 line-clamp-2">{item.subtitle}</p>
                                <div className="text-[10px] font-black text-orange-600 uppercase flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Shop Now <span>→</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {(!featured.sideItems || featured.sideItems.length < 2) && (
                        <div className="flex-1 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 font-medium">
                            Promotional Slot
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeaturedSpotlight;
