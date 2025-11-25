import React from "react";
import { useShop } from '../context/ShopContex';
import { Link } from "react-router";

const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const ProductItem = ({ id, images, name, price, highlight = '' }) => {
    const { currency } = useShop();

    // Defensive image selection: prefer images[0].url, fall back to empty string
    const imageUrl = images && images.length ? (images[0].url || '') : '';

    // Render name with highlighted query matches (case-insensitive)
    const renderHighlightedName = () => {
        if (!highlight) return name;
        try {
            const q = String(highlight).trim();
            if (!q) return name;
            const escaped = escapeRegExp(q);
            const regex = new RegExp(escaped, 'gi');
            const parts = [];
            let lastIndex = 0;
            let match;
            while ((match = regex.exec(name)) !== null) {
                const start = match.index;
                if (start > lastIndex) {
                    parts.push(name.slice(lastIndex, start));
                }
                parts.push(<span key={start} className='bg-[#FFEBB5] px-0.5 rounded'>{match[0]}</span>);
                lastIndex = regex.lastIndex;
            }
            if (lastIndex < name.length) parts.push(name.slice(lastIndex));
            if (parts.length === 0) return name;
            return parts;
        } catch (e) {
            return name;
        }
    };

    return (
        <Link className="text-gray-700 cursor-pointer" to={`/product/${id}`}>
            <div className="overflow-hidden">
                <img
                    className="hover:scale-110 transition ease-in-out"
                    src={imageUrl}
                    alt={name || 'product'}
                    onError={(e) => { e.currentTarget.src = ''; }}
                />
                <p className="text-sm pt-3 pb-1">{renderHighlightedName()}</p>
                <p className="text-sm font-medium">{currency}{price}</p>
            </div>
        </Link>
    )
};

export default ProductItem;