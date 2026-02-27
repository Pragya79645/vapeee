import React, { useEffect, useState } from "react";
import axios from 'axios';
import Title from "./Title";
import { useShop } from '../context/ShopContex';
import ProductItem from "./ProductItem";

const BestSeller = () => {
    const { products } = useShop();
    const [bestSeller, setBestSeller] = useState([]);
    const [meta, setMeta] = useState({ title: 'BEST', title2: 'SELLERS', subtitle: "Discover Knight St. Vape's most popular products! Shop top-rated best sellers." });

    useEffect(() => {
        const fetchMeta = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/settings`);
                if (res.data?.success && res.data.settings?.bestSellers) {
                    const bs = res.data.settings.bestSellers;
                    if (bs.title) {
                        const parts = bs.title.split(' ');
                        setMeta({
                            title: parts[0],
                            title2: parts.slice(1).join(' '),
                            subtitle: bs.subtitle
                        });
                    }
                }
            } catch (e) { }
        };
        fetchMeta();
    }, []);

    useEffect(() => {
        const bestProducts = products.filter((item) => (item.bestseller));
        setBestSeller(bestProducts.slice(0, 5))
    }, [products])

    return (
        <div className="my-10">
            <div className="text-center text-3xl py-8">
                <Title text1={meta.title} text2={meta.title2}></Title>
                <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
                    {meta.subtitle}
                </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
                {
                    bestSeller.map((item, index) => {
                        // Image Fallback Logic
                        const fallbackVariant = item.variants?.find(v => v.image);
                        const displayImages = (item.images && item.images.length > 0)
                            ? item.images
                            : (fallbackVariant ? [{ url: fallbackVariant.image }] : []);

                        if (!displayImages || displayImages.length === 0) return null; // Skip if no image

                        return (
                            <ProductItem key={index} id={item._id} images={displayImages} name={item.name} price={item.price} />
                        )
                    })
                }
            </div>
        </div>
    );
};

export default BestSeller;