import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";
import cloverService from '../services/cloverService.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';
import Category from '../models/categoryModel.js';
import ModifierGroup from '../models/modifierGroupModel.js';
import ItemGroup from '../models/itemGroupModel.js';
import { getIO } from '../socket.js';
import { createLog } from './logController.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Helper: Build categories as [{cloverId, name}] from a Clover item's categories
function buildCategoryObjects(mainItem) {
    if (mainItem.categories && mainItem.categories.elements) {
        return mainItem.categories.elements
            .filter(c => c && c.name)
            .map(c => ({ cloverId: c.id || '', name: c.name }));
    }
    return [];
}

// Helper: Extract images from a single Clover item
function extractImages(it) {
    if (it.images && Array.isArray(it.images)) {
        return it.images.map(i => ({ url: i.url || i }));
    }
    return [];
}

// ─── Upsert Clover Product ────────────────────────────────────────────────────
// Clover is the single source of truth. productId = Item Group ID (grouped) or Item ID (standalone).
async function upsertCloverProduct(groupData) {
    let mainItem, variants = [], isGroup = false, groupId = null;
    let name, productId, description, categories, images, taxRates, stockCount, inStock;
    let externalCloverId;
    let itemImages = [];

    if (groupData.type === 'single') {
        const item = groupData.item;
        mainItem = item;
        isGroup = false;

        name = item.name || item.title || '';
        itemImages = extractImages(item);

        variants.push({
            size: item.name || 'Default',
            price: (item.price != null) ? (Number(item.price) / 100) : (item.priceFloat || 0),
            cost: (item.cost != null) ? (Number(item.cost) / 100) : 0,
            quantity: (item.itemStock && item.itemStock.quantity != null) ? Number(item.itemStock.quantity) : ((item.quantity != null) ? Number(item.quantity) : 0),
            cloverItemId: item.id,
            sku: item.sku || item.code || '',
            showOnPOS: !item.hidden,
            image: itemImages.length > 0 ? itemImages[0].url : undefined
        });

        // UNIFIED: standalone productId = Clover Item ID
        productId = item.id;
        externalCloverId = item.id;

    } else {
        // Grouped product
        isGroup = true;
        groupId = groupData.groupId;
        const items = groupData.items;
        if (!items || items.length === 0) return { action: 'skipped', reason: 'empty group' };

        mainItem = items[0];

        // Get group name: ItemGroup collection > embedded group name > first item name
        let groupName = null;
        if (groupId && !groupId.startsWith('smart_group_')) {
            const storedGroup = await ItemGroup.findOne({ cloverGroupId: groupId });
            if (storedGroup) groupName = storedGroup.name;
        }

        const groupObj = mainItem.itemGroup;
        name = groupData.overrideName || groupName || ((groupObj && groupObj.name) ? groupObj.name : mainItem.name);

        // UNIFIED: grouped productId = Item Group ID
        productId = groupId;
        externalCloverId = groupId;

        // Collect all images + build variant array
        const imageUrls = new Set();
        const collectedImages = [];

        variants = items.map(it => {
            const itsImages = extractImages(it);
            itsImages.forEach(img => {
                if (img.url && !imageUrls.has(img.url)) {
                    imageUrls.add(img.url);
                    collectedImages.push(img);
                }
            });

            let flavour = "";
            let size = "";

            if (it.attributes && it.attributes.elements) {
                it.attributes.elements.forEach(attr => {
                    const attrName = (attr.name || "").toLowerCase();
                    if (attrName.includes("flavour") || attrName.includes("flavor")) {
                        flavour = (attr.value || "").trim();
                    } else if (attrName.includes("size") || attrName.includes("capacity")) {
                        size = (attr.value || "").trim();
                    }
                });
            }

            if (!flavour) flavour = it.name;
            if (!size) size = it.name;

            return {
                size,
                flavour,
                price: (it.price != null) ? (Number(it.price) / 100) : (it.priceFloat || 0),
                cost: (it.cost != null) ? (Number(it.cost) / 100) : 0,
                quantity: (it.itemStock && it.itemStock.quantity != null) ? Number(it.itemStock.quantity) : ((it.quantity != null) ? Number(it.quantity) : 0),
                cloverItemId: it.id,
                sku: it.sku || it.code || '',
                showOnPOS: !it.hidden,
                image: itsImages.length > 0 ? itsImages[0].url : undefined
            };
        });

        itemImages = collectedImages;

        // Cleanup: Remove orphaned single-item products that are now part of this group
        const itemIds = items.map(it => it.id).filter(Boolean);
        if (itemIds.length > 0) {
            try {
                await Product.deleteMany({
                    externalCloverId: { $in: itemIds },
                    cloverItemGroupId: { $exists: false }
                });
            } catch (cleanupErr) {
                console.error('Error cleaning up orphaned single items for group:', cleanupErr);
            }
        }
    }

    // Build categories as [{cloverId, name}]
    categories = buildCategoryObjects(mainItem);
    description = mainItem.description || mainItem.shortDescription || '';
    images = itemImages;
    taxRates = (mainItem.taxRates && mainItem.taxRates.elements) ? mainItem.taxRates.elements : [];
    stockCount = variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
    inStock = stockCount > 0;

    const prices = variants.map(v => v.price);
    const basePrice = Math.min(...prices);

    // Find existing product — try multiple strategies to handle migration
    let existing = null;
    if (isGroup && groupId) {
        const existingProducts = await Product.find({
            $or: [
                { cloverItemGroupId: groupId },
                { cloverItemGroupId: `clover_group_${groupId}` },
                { productId: groupId },
                { productId: `clover_group_${groupId}` }
            ]
        });

        if (existingProducts.length > 0) {
            existing = existingProducts[0];
            if (existingProducts.length > 1) {
                console.log(`[Sync] Found ${existingProducts.length} duplicates for Group ${groupId}. Merging...`);
                for (let k = 1; k < existingProducts.length; k++) {
                    await Product.findByIdAndDelete(existingProducts[k]._id);
                }
            }
        }
    } else if (externalCloverId) {
        existing = await Product.findOne({
            $or: [
                { externalCloverId: String(externalCloverId) },
                { productId: String(externalCloverId) }
            ]
        });
    }

    // Fallback 1: match by SKU within variants
    if (!existing && variants.length > 0) {
        const skus = variants.map(v => v.sku).filter(Boolean);
        if (skus.length > 0) {
            existing = await Product.findOne({ "variants.sku": { $in: skus } });
        }
    }

    // Fallback 2: case-insensitive exact name match
    if (!existing) {
        // Escape regex characters just in case
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        existing = await Product.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });
    }

    const doc = {
        name,
        brand: (isGroup || groupId) ? name : "",
        description,
        price: Number(basePrice || 0),
        categories,
        images: (images.length > 0) ? images : (existing ? existing.images : []),
        stockCount,
        inStock,
        showOnPOS: true,
        variants,
        taxRates,
        cloverSynced: true, // Synced from Clover = true
        cloverItemGroupId: isGroup ? groupId : undefined
    };

    if (externalCloverId) doc.externalCloverId = String(externalCloverId);
    if (!existing) doc.productId = productId;

    if (existing) {
        // 1. Prioritize local images (vgy.me/enriched) over Clover images.
        // If we have local images, we keep them.
        if (existing.images && existing.images.length > 0) {
            doc.images = existing.images;
        }

        // 2. Preserve existing description if it's richer/longer than Clover's or if Clover's is empty
        if (existing.description && (!description || existing.description.length > description.length)) {
            doc.description = existing.description;
        }

        // 3. Variant Image Preservation: Protect local variant-specific images.
        if (existing.variants && existing.variants.length > 0) {
            doc.variants = variants.map(nv => {
                const ev = existing.variants.find(v => (v.cloverItemId === nv.cloverItemId) || (nv.sku && v.sku === nv.sku));
                if (ev && ev.image && !nv.image) {
                    return { ...nv, image: ev.image };
                }
                return nv;
            });
        }

        // Preserve existing manually-set DB fields (Fields Clover doesn't have)
        doc.bestseller = existing.bestseller;
        doc.sweetnessLevel = existing.sweetnessLevel;
        doc.mintLevel = existing.mintLevel;
        doc.otherFlavours = existing.otherFlavours;

        Object.assign(existing, doc);
        // Ensure productId is unified and it is marked synced
        existing.productId = productId;
        existing.cloverSynced = true;
        try {
            await existing.save();
            // Emit socket update
            const io = getIO();
            if (io) io.emit('productUpdated', { product: existing });
            return { action: 'updated', id: existing._id };
        } catch (saveErr) {
            console.error(`[Sync] Failed to update product ${existing.name}:`, saveErr.message);
            if (saveErr.errors) {
                Object.keys(saveErr.errors).forEach(key => {
                    console.error(` - Field ${key}: ${saveErr.errors[key].message}`);
                });
            }
            return { action: 'error', error: saveErr.message };
        }
    } else {
        const p = new Product(doc);
        try {
            await p.save();
            // Emit socket update
            const io = getIO();
            if (io) io.emit('productUpdated', { product: p });
            return { action: 'created', id: p._id };
        } catch (saveErr) {
            console.error(`[Sync] Failed to create product ${name}:`, saveErr.message);
            if (saveErr.errors) {
                Object.keys(saveErr.errors).forEach(key => {
                    console.error(` - Field ${key}: ${saveErr.errors[key].message}`);
                });
            }
            return { action: 'error', error: saveErr.message };
        }
    }
}

// ─── Upsert Clover Order ────────────────────────────────────────────────────
async function upsertCloverOrder(order) {
    try {
        const userId = null;
        const phone = order.phone || (order.customer && order.customer.phone) || 'N/A';
        const items = [];
        for (const it of (order.lineItems && order.lineItems.elements ? order.lineItems.elements : (order.items || []))) {
            let mappedProduct = null;
            let cloverItemId = '';

            if (it.item && it.item.id) {
                cloverItemId = it.item.id;
                mappedProduct = await Product.findOne({ "variants.cloverItemId": it.item.id });
                if (!mappedProduct) {
                    mappedProduct = await Product.findOne({ externalCloverId: it.item.id });
                }
            }

            if (!mappedProduct && (it.sku || it.itemCode)) {
                mappedProduct = await Product.findOne({ "variants.sku": (it.sku || it.itemCode) });
                if (!mappedProduct) mappedProduct = await Product.findOne({ productId: (it.sku || it.itemCode) });
            }

            items.push({
                productId: mappedProduct ? mappedProduct._id : undefined,
                cloverItemId: cloverItemId,
                name: it.name || 'Unknown',
                variantSize: it.note || (mappedProduct ?
                    (mappedProduct.variants.find(v => v.cloverItemId === cloverItemId)?.size || 'default')
                    : 'default'),
                status: 'Pending',
                quantity: Number(it.unitQty || it.quantity || 1) || 1,
                price: Number((it.price != null ? it.price : (it.priceFloat || 0))) / 100
            });
        }

        const amount = Number(order.total != null ? order.total : (order.amount || 0)) / 100;
        const address = {
            street: (order.shippingAddress && order.shippingAddress.address1) || 'N/A',
            city: (order.shippingAddress && order.shippingAddress.city) || 'N/A',
            state: (order.shippingAddress && order.shippingAddress.state) || 'N/A',
            zip: (order.shippingAddress && order.shippingAddress.zip) || 'N/A',
            country: (order.shippingAddress && order.shippingAddress.country) || 'N/A'
        };

        let existing = null;
        if (order.id) existing = await Order.findOne({ 'externalCloverId': order.id });

        if (existing) {
            existing.phone = phone;
            existing.items = items;
            existing.amount = amount;
            await existing.save();
            return { action: 'updated', id: existing._id };
        } else {
            const o = new Order({ userId: userId || undefined, phone, items, amount, address, status: 'Pending', paymentMethod: 'CashOnDelivery', payment: false });
            if (order.id) o.externalCloverId = order.id;
            await o.save();
            return { action: 'created', id: o._id };
        }
    } catch (e) {
        console.error('Failed to upsert clover order', e);
        return { action: 'error', error: e.message };
    }
}

// ─── Upsert Clover Category ────────────────────────────────────────────────
async function upsertCloverCategory(cat) {
    if (!cat) return { action: 'error', error: 'Invalid category' };
    const externalId = cat.id || cat.categoryId || undefined;
    const name = cat.name || cat.title || 'Unnamed';

    let existing = null;
    if (externalId) existing = await Category.findOne({ cloverId: String(externalId) });
    if (!existing && externalId) existing = await Category.findOne({ categoryId: String(externalId) });
    if (!existing) existing = await Category.findOne({ name });

    if (existing) {
        existing.name = name;
        existing.cloverId = externalId ? String(externalId) : existing.cloverId;
        existing.categoryId = externalId ? String(externalId) : existing.categoryId;
        await existing.save();
        return { action: 'updated', id: existing._id };
    } else {
        const c = new Category({
            name,
            categoryId: externalId ? String(externalId) : `local_${Date.now()}`,
            cloverId: externalId ? String(externalId) : undefined
        });
        await c.save();
        return { action: 'created', id: c._id };
    }
}

// ─── Upsert Clover Modifier Group ──────────────────────────────────────────
async function upsertCloverModifierGroup(mg) {
    if (!mg) return { action: 'error', error: 'Invalid modifier group' };
    const cloverGroupId = mg.id;
    const name = mg.name || 'Unnamed Group';

    const modifiers = (mg.modifiers && mg.modifiers.elements) ? mg.modifiers.elements.map(m => ({
        id: m.id,
        name: m.name,
        price: (m.price != null) ? (m.price / 100) : 0
    })) : [];

    let existing = await ModifierGroup.findOne({ cloverGroupId });
    if (existing) {
        existing.name = name;
        existing.modifiers = modifiers;
        await existing.save();
        return { action: 'updated', id: existing._id };
    } else {
        const newMg = new ModifierGroup({ cloverGroupId, name, modifiers });
        await newMg.save();
        return { action: 'created', id: newMg._id };
    }
}

// ─── Upsert Clover Item Group ────────────────────────────────────────────────
async function upsertCloverItemGroup(ig) {
    if (!ig) return { action: 'error', error: 'Invalid item group' };
    const cloverGroupId = ig.id;
    const name = ig.name || 'Unnamed Group';
    const attributes = (ig.attributes && ig.attributes.elements) ? ig.attributes.elements.map(a => a.name) : [];

    let existing = await ItemGroup.findOne({ cloverGroupId });
    if (existing) {
        existing.name = name;
        existing.attributes = attributes;
        await existing.save();
        return { action: 'updated', id: existing._id };
    } else {
        const newIg = new ItemGroup({ cloverGroupId, name, attributes });
        await newIg.save();
        return { action: 'created', id: newIg._id };
    }
}

// ─── Sync Local Categories to Clover ──────────────────────────────────────
async function syncLocalCategoriesToClover(cloverItemId, localCategories) {
    if (!cloverItemId) return;
    try {
        // localCategories is now [{cloverId, name}]
        const targetCategoryIds = localCategories
            .map(c => c.cloverId)
            .filter(Boolean);

        const cloverItem = await cloverService.getItem(cloverItemId);
        const currentCategoryIds = (cloverItem.categories && cloverItem.categories.elements)
            ? cloverItem.categories.elements.map(c => c.id)
            : [];

        const toAdd = targetCategoryIds.filter(id => !currentCategoryIds.includes(id));
        const toRemove = currentCategoryIds.filter(id => !targetCategoryIds.includes(id));

        for (const catId of toAdd) {
            await cloverService.addItemToCategory(cloverItemId, catId);
        }
        for (const catId of toRemove) {
            await cloverService.removeItemFromCategory(cloverItemId, catId);
        }
    } catch (e) {
        console.error(`Failed to sync categories for item ${cloverItemId}:`, e);
    }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        const isMatchedPassword = await bcrypt.compare(password, admin.password);
        if (!isMatchedPassword) {
            return res.status(401).json({ success: false, message: "Invalid credentials." });
        }

        const token = jwt.sign(
            { email, role: "admin" },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({ success: true, message: "Logged in successfully.", token });
    } catch (err) {
        console.error("Admin Login Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const getAdminData = (req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome, admin!",
        admin: req.user,
    });
};

const adminLogout = (req, res) => {
    res.clearCookie("admin_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

// ─── POST /api/admin/sync/clover ────────────────────────────────────────────
// Single canonical sync pathway. Modes: 'pull' | 'push' | 'both'
const syncClover = async (req, res) => {
    try {
        if (!cloverService.isConfigured()) {
            return res.status(400).json({ success: false, message: 'Clover not configured. Set CLOVER_API_TOKEN and CLOVER_MERCHANT_ID in .env' });
        }

        const report = {
            items: { created: 0, updated: 0, errors: 0 },
            orders: { created: 0, updated: 0, errors: 0 },
            categories: { created: 0, updated: 0, errors: 0 },
            modifierGroups: { created: 0, updated: 0, errors: 0 },
            itemGroups: { created: 0, updated: 0, errors: 0 }
        };
        const mode = (req.body && req.body.mode) || (req.query && req.query.mode) || 'pull';
        const invokedBy = (req.user && req.user.email) || 'unknown';
        console.log(`[admin] ${invokedBy} initiated Clover sync. mode=${mode}`);

        const emitProgress = (msg, payload = {}) => {
            try {
                const io = getIO();
                if (io) io.emit('syncProgress', { message: msg, ...payload, report });
            } catch (e) { }
        };

        emitProgress('Starting sync process...');

        // ── PULL PHASE ──
        if (mode !== 'push') {
            // 1. Fetch Categories
            try {
                const categories = await cloverService.getCategories();
                if (Array.isArray(categories)) {
                    for (const c of categories) {
                        try {
                            const r = await upsertCloverCategory(c);
                            if (r.action === 'created') report.categories.created++;
                            else if (r.action === 'updated') report.categories.updated++;
                            if ((report.categories.created + report.categories.updated) > 0 && (report.categories.created + report.categories.updated) % 10 === 0) emitProgress(`Categories: ${report.categories.created + report.categories.updated} synced`);
                        } catch (e) {
                            console.error('Category upsert error:', e);
                            report.categories.errors++;
                        }
                    }
                }
            } catch (e) {
                console.error('Clover fetch categories error:', e.message || e);
            }

            // 2. Fetch Modifier Groups
            try {
                const modGroups = await cloverService.getModifierGroups();
                if (Array.isArray(modGroups)) {
                    for (const mg of modGroups) {
                        try {
                            const r = await upsertCloverModifierGroup(mg);
                            if (r.action === 'created') report.modifierGroups.created++;
                            else if (r.action === 'updated') report.modifierGroups.updated++;
                            if ((report.modifierGroups.created + report.modifierGroups.updated) > 0 && (report.modifierGroups.created + report.modifierGroups.updated) % 10 === 0) emitProgress(`Modifier Groups: ${report.modifierGroups.created + report.modifierGroups.updated} synced`);
                        } catch (e) {
                            console.error('ModifierGroup upsert error:', e);
                            report.modifierGroups.errors++;
                        }
                    }
                }
            } catch (e) {
                console.error('Clover fetch modifier groups error:', e.message || e);
            }

            // 3. Fetch Item Groups
            try {
                const itemGroups = await cloverService.getItemGroups();
                if (Array.isArray(itemGroups)) {
                    for (const ig of itemGroups) {
                        try {
                            const r = await upsertCloverItemGroup(ig);
                            if (r.action === 'created') report.itemGroups.created++;
                            else if (r.action === 'updated') report.itemGroups.updated++;
                            if ((report.itemGroups.created + report.itemGroups.updated) > 0 && (report.itemGroups.created + report.itemGroups.updated) % 10 === 0) emitProgress(`Item Groups: ${report.itemGroups.created + report.itemGroups.updated} synced`);
                        } catch (e) {
                            console.error('ItemGroup upsert error:', e);
                            report.itemGroups.errors++;
                        }
                    }
                }
            } catch (e) {
                console.error('Clover fetch item groups error:', e.message || e);
            }

            // 4. Fetch all Items and group them
            try {
                emitProgress('Fetching products from Clover... (This may take a minute)');
                const items = await cloverService.getProducts();
                if (Array.isArray(items)) {
                    emitProgress(`Organizing ${items.length} items...`);
                    const groups = {};
                    const standalone = [];
                    const finalStandalone = [];

                    for (const item of items) {
                        if (item.itemGroup && item.itemGroup.id) {
                            if (!groups[item.itemGroup.id]) groups[item.itemGroup.id] = [];
                            groups[item.itemGroup.id].push(item);
                        } else {
                            standalone.push(item);
                        }
                    }

                    // Smart grouping: index existing group names
                    const groupNameMap = new Map();
                    const groupIdToNameMap = new Map();

                    for (const gid in groups) {
                        const gitems = groups[gid];
                        if (gitems.length > 0) {
                            let prefix = gitems[0].name.trim().toLowerCase();
                            for (let k = 1; k < gitems.length; k++) {
                                const current = gitems[k].name.trim().toLowerCase();
                                let l = 0;
                                while (l < prefix.length && l < current.length && prefix[l] === current[l]) l++;
                                prefix = prefix.substring(0, l);
                            }

                            let matchKey = gitems[0].name.trim().toLowerCase();
                            if (prefix.length >= 3) matchKey = prefix.trim();
                            groupNameMap.set(matchKey, gid);

                            let displayPrefix = gitems[0].name.trim();
                            for (let k = 1; k < gitems.length; k++) {
                                const current = gitems[k].name.trim();
                                let l = 0;
                                while (l < displayPrefix.length && l < current.length && displayPrefix[l] === current[l]) l++;
                                displayPrefix = displayPrefix.substring(0, l);
                            }
                            if (displayPrefix.length < 3) displayPrefix = gitems[0].name.trim();
                            groupIdToNameMap.set(gid, displayPrefix.trim());
                        }
                    }

                    // Merge standalone into existing groups
                    const unmatchedStandalone = [];
                    for (const item of standalone) {
                        let merged = false;
                        const itemName = item.name.trim().toLowerCase();

                        let bestMatchId = null;
                        let bestMatchLen = 0;

                        for (const [gName, gId] of groupNameMap.entries()) {
                            if (itemName === gName || itemName.startsWith(gName + ' ') || itemName.startsWith(gName + '-')) {
                                if (gName.length > bestMatchLen) {
                                    bestMatchLen = gName.length;
                                    bestMatchId = gId;
                                }
                            }
                        }

                        if (bestMatchId) {
                            groups[bestMatchId].push(item);
                            merged = true;
                        }

                        if (!merged) unmatchedStandalone.push(item);
                    }

                    // Cluster remaining standalone items
                    unmatchedStandalone.sort((a, b) => a.name.localeCompare(b.name));
                    let i = 0;
                    while (i < unmatchedStandalone.length) {
                        const parent = unmatchedStandalone[i];
                        const parentNameLower = parent.name.trim().toLowerCase();
                        const cluster = [parent];

                        let j = i + 1;
                        while (j < unmatchedStandalone.length) {
                            const candidate = unmatchedStandalone[j];
                            const candidateName = candidate.name.trim().toLowerCase();
                            if (candidateName.startsWith(parentNameLower + ' ') || candidateName.startsWith(parentNameLower + '-')) {
                                cluster.push(candidate);
                                j++;
                            } else {
                                break;
                            }
                        }

                        if (cluster.length > 1) {
                            const newGroupId = `smart_group_${parent.id}`;
                            groups[newGroupId] = cluster;
                            groupIdToNameMap.set(newGroupId, parent.name.trim());
                            i = j;
                        } else {
                            finalStandalone.push(parent);
                            i++;
                        }
                    }

                    // Process singles
                    for (const s of finalStandalone) {
                        try {
                            const r = await upsertCloverProduct({ type: 'single', item: s });
                            if (r.action === 'created') report.items.created++;
                            else if (r.action === 'updated') report.items.updated++;
                            if ((report.items.created + report.items.updated) % 15 === 0) emitProgress(`Products: ${report.items.created + report.items.updated} syncing...`);
                        } catch (e) { console.error('Single item upsert error:', e); report.items.errors++; }
                    }

                    // Process groups
                    for (const gId in groups) {
                        try {
                            const overrideName = groupIdToNameMap.get(gId);
                            const r = await upsertCloverProduct({ type: 'group', groupId: gId, items: groups[gId], overrideName });
                            if (r.action === 'created') report.items.created++;
                            else if (r.action === 'updated') report.items.updated++;
                            if ((report.items.created + report.items.updated) % 15 === 0) emitProgress(`Products: ${report.items.created + report.items.updated} syncing...`);
                        } catch (e) { console.error('Group upsert error:', e); report.items.errors++; }
                    }
                }
            } catch (e) {
                console.error('Clover fetch items error:', e.message || e);
                report.items.errors++;
            }

            // 5. Fetch orders
            try {
                const orders = await cloverService.getOrders();
                if (Array.isArray(orders)) {
                    for (const o of orders) {
                        try {
                            const r = await upsertCloverOrder(o);
                            if (r.action === 'created') report.orders.created++;
                            else if (r.action === 'updated') report.orders.updated++;
                            else if (r.action === 'error') report.orders.errors++;
                            if ((report.orders.created + report.orders.updated) > 0 && (report.orders.created + report.orders.updated) % 10 === 0) emitProgress(`Orders: ${report.orders.created + report.orders.updated} synced`);
                        } catch (e) {
                            console.error('Order upsert error:', e);
                            report.orders.errors++;
                        }
                    }
                }
            } catch (e) {
                console.error('Clover fetch orders error:', e.message || e);
            }
        }

        // ── PUSH PHASE ──
        if (mode !== 'pull') {
            // Push is auto-handled by productController on save. This is kept for manual full push.
            console.log('[admin] Push mode: auto-sync on save is now the primary mechanism.');
        }

        emitProgress('Sync finished successfully!', { done: true });

        // Log the final report summary
        await createLog({
            adminId: req.user?._id,
            userType: 'Admin',
            actionType: 'CLOVER_SYNC',
            entityId: 'SYSTEM',
            entityName: 'Clover Synchronization',
            details: report
        });

        return res.status(200).json({ success: true, message: 'Clover sync finished', report });
    } catch (err) {
        console.error('Sync Clover failed:', err);
        return res.status(500).json({ success: false, message: 'Sync failed', error: err.message });
    }
};

const getModifierGroups = async (req, res) => {
    try {
        const groups = await ModifierGroup.find({});
        res.status(200).json({ success: true, modifierGroups: groups });
    } catch (err) {
        console.error("Error fetching modifier groups:", err);
        res.status(500).json({ success: false, message: "Failed to fetch modifier groups" });
    }
};

const getItemGroups = async (req, res) => {
    try {
        const groups = await ItemGroup.find({});
        res.status(200).json({ success: true, itemGroups: groups });
    } catch (err) {
        console.error("Error fetching item groups:", err);
        res.status(500).json({ success: false, message: "Failed to fetch item groups" });
    }
};

export { adminLogin, getAdminData, adminLogout, syncClover, getModifierGroups, getItemGroups };