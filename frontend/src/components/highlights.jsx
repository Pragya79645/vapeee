import React from "react";
import { ArrowRight, MapPin, Star } from "lucide-react";

const Highlights = () => {
    // You can import your images and replace these placeholder paths
    const IMAGES = {
        banner1: "/Grape.jpg",
        banner2: "/Flavourys.png",
        banner3: "/Flavour.png",
        collection1: "/Banana.png",
        collection2: "/Bease.png",
        collection3: "/Ice.jpg",
        exterior: "/Triple.jpg",
    };

    return (
        <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
                {/* Main Featured Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
                    {/* Primary Hero */}
                    <div className="lg:col-span-8 relative overflow-hidden bg-white h-[500px] rounded-lg group">
                        <img
                            src={IMAGES.banner1}
                            alt="VEEV One"
                            className="absolute inset-0 w-full h-full object-contain opacity-70 transition-all duration-700 group-hover:opacity-80 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-end p-8 md:p-12">
                            <div className="max-w-lg">
                                <span className="inline-block bg-[#FFB81C] text-black text-xs font-bold px-3 py-1 mb-4 uppercase tracking-widest">
                                    New Arrival
                                </span>
                                <h2 className="text-2xl md:text-4xl font-bold text-black mb-3 tracking-tight">
                                    Lorem Ipsum
                                </h2>
                                <p className="text-black/90 mb-6 text-base">
                                    Lorem ipsum dolor sit <br />amet consectetur adipiscing <br/>elit sed do eiusmod
                                </p>
                                <button className="bg-white text-black hover:bg-[#FFB81C] hover:text-black font-semibold px-6 py-3 rounded-md transition-all duration-300 flex items-center gap-2 group/btn">
                                    Explore Collection
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Featured */}
                    <div className="lg:col-span-4 grid grid-rows-2 gap-4">
                        <div className="relative overflow-hidden bg-gray-100 h-full min-h-[240px] rounded-lg group">
                            <img
                                src={IMAGES.banner2}
                                alt="VEEV Now Ultra"
                                className="absolute inset-0 w-full h-full object-contain opacity-60 transition-all duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                <span className="inline-block bg-[#FFB81C] text-black text-xs font-bold px-2.5 py-1 uppercase w-fit">
                                    Ultra
                                </span>
                                <div>
                                    <h3 className="text-lg font-bold text-black mb-1">Lorem Dolor</h3>
                                    <p className="text-black/80 text-xs">Premium Quality</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 h-full min-h-[240px] rounded-lg group">
                            <img
                                src={IMAGES.banner3}
                                alt="Geek Bar"
                                className="absolute inset-0 w-full h-full object-contain transition-all duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 p-6 flex items-end">
                                <div>
                                    <h3 className="text-lg font-bold text-black">Sit Amet</h3>
                                    <p className="text-black/80 text-xs">Consectetur Adipiscing</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Collection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    {[
                        { img: IMAGES.collection1, title: "Lorem Ipsum", subtitle: "Dolor Sit Amet" },
                        { img: IMAGES.collection2, title: "Consectetur", subtitle: "Adipiscing Elit" },
                        { img: IMAGES.collection3, title: "Sed Dolor", subtitle: "Amet Consectetur" }
                    ].map((item, idx) => (
                        <div key={idx} className="relative overflow-hidden bg-white border border-gray-200 h-72 rounded-lg group cursor-pointer">
                            <img
                                src={item.img}
                                alt={item.title}
                                className="absolute inset-0 w-full h-full object-contain transition-all duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                <h4 className="text-black font-bold text-lg mb-1">{item.title}</h4>
                                <p className="text-black/80 text-xs mb-3">{item.subtitle}</p>
                                <div className="flex items-center gap-2 text-[#FFB81C] text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    Shop Now <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Store Location Section */}
                <div className="bg-gray-50 border border-gray-200 overflow-hidden rounded-lg">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* Image Side */}
                        <div className="relative h-80 lg:h-auto">
                            <img
                                src={IMAGES.exterior}
                                alt="Store Location"
                                className="absolute inset-0 w-full h-full object-contain"
                            />
                        </div>

                        {/* Content Side */}
                        <div className="p-8 md:p-12 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-4">
                                <Star className="w-5 h-5 fill-[#FFB81C] text-[#FFB81C]" />
                                <Star className="w-5 h-5 fill-[#FFB81C] text-[#FFB81C]" />
                                <Star className="w-5 h-5 fill-[#FFB81C] text-[#FFB81C]" />
                                <Star className="w-5 h-5 fill-[#FFB81C] text-[#FFB81C]" />
                                <Star className="w-5 h-5 fill-[#FFB81C] text-[#FFB81C]" />
                                <span className="text-sm text-gray-600 ml-2">(500+ reviews)</span>
                            </div>

                            <h3 className="text-2xl md:text-3xl font-bold text-black mb-3">
                                Lorem Ipsum Dolor
                            </h3>
                            
                            <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                            </p>

                            <div className="flex items-start gap-3 mb-6">
                                <MapPin className="w-5 h-5 text-[#FFB81C] shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-black">Lorem Ipsum, Dolor Sit Amet</p>
                                    <p className="text-gray-600 text-sm">Open Daily: 9AM - 10PM</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button className="bg-black text-white hover:bg-gray-900 font-semibold px-6 py-3 rounded-md transition-colors duration-300">
                                    Get Directions
                                </button>
                                <button className="border border-black text-black hover:bg-black hover:text-white font-semibold px-6 py-3 rounded-md transition-colors duration-300">
                                    Call Store
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Highlights;