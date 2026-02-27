import React from 'react';

const HowToUse = () => {
    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">Admin Guide & How-To</h1>

            {/* General Concepts */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-blue-700">1. Clover: The Single Source of Truth</h2>
                <p className="text-gray-600 mb-2">
                    Our system uses <strong>Clover</strong> as the master database for products, categories, and inventory.
                    This means:
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>When you add or edit a product here, it automatically pushes those changes to Clover.</li>
                    <li>If a customer views a product, adds it to their cart, or checks out, we instantly ask Clover for the latest stock to prevent overselling.</li>
                    <li>
                        To sync updates made <strong>directly inside Clover</strong> (e.g. changing prices on the POS),
                        click the <strong>"Sync from Clover"</strong> button in the left sidebar.
                    </li>
                </ul>
            </section>

            {/* Categories */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-blue-700">2. Managing Categories</h2>
                <p className="text-gray-600 mb-2">
                    A <span className="inline-block w-2 h-2 bg-green-500 rounded-full mx-1"></span>
                    <strong>green dot</strong> next to a category means it is successfully linked to a Clover Category ID.
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>When you create a new category, the system tries to find a matching one by name in Clover.</li>
                    <li>If you delete a category here, it only removes it from the website, not from Clover.</li>
                </ul>
            </section>

            {/* Products */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-blue-700">3. Adding & Editing Products</h2>
                <p className="text-gray-600 mb-2">
                    When editing a product, you will see a badge at the top:
                </p>
                <div className="flex gap-4 mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span> Clover Synced
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                        <span className="w-2 h-2 bg-yellow-400 rounded-full"></span> Not Synced
                    </span>
                </div>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li><strong>Variants:</strong> Make sure each variant has a Size/Name, Flavour, Price, and Stock. When you save, each variant becomes a Clover item linked under an Item Group.</li>
                    <li><strong>Images:</strong> The first image is used as the main thumbnail. Images are hosted on <strong>vgy.me</strong>.</li>
                    <li>Fields with a red <span className="text-red-500">*</span> are mandatory.</li>
                </ul>
            </section>

            {/* Imports */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-blue-700">4. Excel Imports</h2>
                <p className="text-gray-600 mb-2">
                    You can mass-import products using the <strong>Import from Excel</strong> button on the List page.
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li><strong>Important:</strong> Products imported via Excel are <em>NOT</em> automatically sent to Clover. They will get a yellow "Not Synced" badge.</li>
                    <li>To sync an imported product to Clover, you must edit it and click <strong>Update</strong>.</li>
                    <li>Always use the "Download Template" button to ensure your Excel columns match exactly.</li>
                </ul>
            </section>

            {/* Orders */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-blue-700">5. Orders & Inventory</h2>
                <p className="text-gray-600 mb-2">
                    Stock is strictly managed to ensure accuracy between the physical store and the website.
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>When an online order is placed (both COD and Clover checkout), the website explicitly tells Clover to decrement the stock by the exact quantity ordered.</li>
                    <li>If a customer is checking out, but someone just bought the last item in-store, the website will halt the online checkout and show an "Out of Stock" error.</li>
                    <li>Orders where a customer started checkout but didn't finish their payment will show as <strong>Failed</strong> and will not deduct stock.</li>
                </ul>
            </section>

            {/* Settings */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-blue-700">6. Customizing the Homepage (Settings)</h2>
                <p className="text-gray-600 mb-2">
                    The <strong>Settings</strong> page lets you change the Top Navbar Links and the Hero Banners.
                </p>
                <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li><strong>vgy.me Integration:</strong> All image uploads (products and banners) now use vgy.me for fast, reliable hosting.</li>
                    <li><strong>Banner & Grid Slides:</strong> You can now upload your own photos directly from your computer instead of just using URLs.</li>
                    <li><strong>Carousel & Promo Grid:</strong> Manage the main scrolling banners and the feature blocks below them separately.</li>
                    <li><strong>Smart Pick:</strong> Use the "Auto-fill from Product" menu to instantly sync a slide's image, title, and link with a product from your store!</li>
                </ul>
            </section>
        </div>
    );
};

export default HowToUse;
