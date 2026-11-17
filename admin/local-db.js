import { DEMO_PRODUCTS, DEMO_CATEGORIES } from "../demo-products.js";

const SESSION_KEY = "brikity_admin_session";
const PRODUCTS_KEY = "brikity_local_products";
const CATEGORIES_KEY = "brikity_local_categories";
const ORDERS_KEY = "brikity_local_orders";
const SETTINGS_KEY = "brikity_local_settings";

/** Accès démo sans Firebase — change-les si besoin. */
export const DEMO_ADMIN = {
    email: "admin@brikity.tn",
    password: "brikity2026"
};

function read(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
}

function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function ensureSeed() {
    if (!localStorage.getItem(PRODUCTS_KEY)) {
        write(PRODUCTS_KEY, DEMO_PRODUCTS.map((p) => ({
            ...p,
            imageUrl: p.imageUrl?.startsWith("assets/") ? `../${p.imageUrl}` : p.imageUrl
        })));
    }
    if (!localStorage.getItem(CATEGORIES_KEY)) {
        write(CATEGORIES_KEY, DEMO_CATEGORIES.map((c) => ({ ...c })));
    }
    if (!localStorage.getItem(ORDERS_KEY)) {
        write(ORDERS_KEY, []);
    }
    if (!localStorage.getItem(SETTINGS_KEY)) {
        write(SETTINGS_KEY, {
            delivery: { isFree: false, price: 7, freeThreshold: 80 },
            whatsapp: { phone: "21600000000" },
            telegram: { enabled: false, botToken: "", chatId: "" },
            banner: { isActive: false, text: "" }
        });
    }
}

export function getDemoSession() {
    try {
        return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch {
        return null;
    }
}

export function isDemoLoggedIn() {
    const s = getDemoSession();
    return !!(s && s.ok && s.email);
}

export function loginDemo(email, password) {
    const e = String(email || "").trim().toLowerCase();
    const p = String(password || "");
    if (e === DEMO_ADMIN.email && p === DEMO_ADMIN.password) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
            ok: true,
            email: DEMO_ADMIN.email,
            mode: "demo",
            at: Date.now()
        }));
        ensureSeed();
        return { ok: true };
    }
    return { ok: false, error: "Email ou mot de passe incorrect." };
}

export function logoutDemo() {
    sessionStorage.removeItem(SESSION_KEY);
}

// ── Products ──────────────────────────────────────────────

export function listProducts() {
    ensureSeed();
    return read(PRODUCTS_KEY, []);
}

export function getProduct(id) {
    return listProducts().find((p) => p.id === id) || null;
}

export function upsertProduct(data, id = null) {
    const list = listProducts();
    if (id) {
        const i = list.findIndex((p) => p.id === id);
        if (i >= 0) {
            list[i] = { ...list[i], ...data, id, updatedAt: new Date().toISOString() };
            write(PRODUCTS_KEY, list);
            return list[i];
        }
    }
    const row = {
        ...data,
        id: id || uid("prod"),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    list.unshift(row);
    write(PRODUCTS_KEY, list);
    return row;
}

export function removeProduct(id) {
    write(PRODUCTS_KEY, listProducts().filter((p) => p.id !== id));
}

// ── Categories ────────────────────────────────────────────

export function listCategories() {
    ensureSeed();
    return read(CATEGORIES_KEY, []).sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function upsertCategory(data, id = null) {
    const list = listCategories();
    if (id) {
        const i = list.findIndex((c) => c.id === id);
        if (i >= 0) {
            list[i] = { ...list[i], ...data, id };
            write(CATEGORIES_KEY, list);
            return list[i];
        }
    }
    const row = { ...data, id: id || uid("cat") };
    list.push(row);
    write(CATEGORIES_KEY, list);
    return row;
}

export function removeCategory(id) {
    write(CATEGORIES_KEY, listCategories().filter((c) => c.id !== id));
}

// ── Orders ────────────────────────────────────────────────

export function listOrders() {
    ensureSeed();
    return read(ORDERS_KEY, []).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}

export function upsertOrderStatus(id, status) {
    const list = listOrders();
    const i = list.findIndex((o) => o.id === id);
    if (i < 0) return null;
    list[i] = { ...list[i], status };
    write(ORDERS_KEY, list);
    return list[i];
}

export function removeOrder(id) {
    write(ORDERS_KEY, listOrders().filter((o) => o.id !== id));
}

export function addLocalOrder(order) {
    ensureSeed();
    const list = listOrders();
    const row = { ...order, id: uid("ord"), createdAt: new Date().toISOString() };
    list.unshift(row);
    write(ORDERS_KEY, list);
    return row;
}

// ── Settings ──────────────────────────────────────────────

export function getSettings() {
    ensureSeed();
    return read(SETTINGS_KEY, {});
}

export function saveSetting(key, value) {
    const all = getSettings();
    all[key] = { ...all[key], ...value, updatedAt: new Date().toISOString() };
    write(SETTINGS_KEY, all);
    return all[key];
}

/** Products for the public storefront (fix image paths). */
export function getStorefrontProducts() {
    ensureSeed();
    return listProducts()
        .filter((p) => p.isActive !== false)
        .map((p) => {
            let imageUrl = p.imageUrl || "assets/logo-brikity.png";
            if (imageUrl.startsWith("../assets/")) imageUrl = imageUrl.replace("../", "");
            if (imageUrl.startsWith("data:")) { /* keep */ }
            return { ...p, imageUrl };
        });
}

export function getStorefrontCategories() {
    return listCategories();
}

export function getStorefrontSettings() {
    return getSettings();
}

/** Read image file as data URL for local demo uploads. */
export function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Lecture image impossible"));
        reader.readAsDataURL(file);
    });
}
