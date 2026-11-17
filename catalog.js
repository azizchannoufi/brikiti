import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDb, isFirebaseConfigured } from "./firebase-init.js";
import { cachedFetch } from "./data-cache.js";
import { resolveImages, resolveImageUrl } from "./image-resolve.js";
import { DEMO_PRODUCTS, DEMO_CATEGORIES } from "./demo-products.js";
import { addToCart } from "./cart.js";
import {
    getStorefrontProducts,
    getStorefrontCategories,
    getProduct as getLocalProduct
} from "./admin/local-db.js";

export async function loadProducts() {
    if (!isFirebaseConfigured()) {
        const local = getStorefrontProducts();
        return local.length ? local : DEMO_PRODUCTS.map((p) => ({ ...p }));
    }

    const db = getDb();
    if (!db) {
        return getStorefrontProducts();
    }

    try {
        const rows = await cachedFetch("products", async () => {
            const snap = await getDocs(collection(db, "products"));
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        });
        const active = (rows || []).filter((p) => p.isActive !== false);
        if (!active.length) return getStorefrontProducts();
        return resolveImages(active);
    } catch (e) {
        console.warn("loadProducts fallback:", e.message);
        return getStorefrontProducts();
    }
}

export async function loadCategories() {
    if (!isFirebaseConfigured()) {
        const local = getStorefrontCategories();
        return local.length ? local : DEMO_CATEGORIES.map((c) => ({ ...c }));
    }

    const db = getDb();
    if (!db) return getStorefrontCategories();

    try {
        const rows = await cachedFetch("categories", async () => {
            const snap = await getDocs(collection(db, "categories"));
            return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        });
        if (!rows?.length) return getStorefrontCategories();
        return rows.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (e) {
        console.warn("loadCategories fallback:", e.message);
        return getStorefrontCategories();
    }
}

function normalizeProductImage(p) {
    if (!p) return null;
    let imageUrl = p.imageUrl || "assets/logo-brikity.png";
    if (imageUrl.startsWith("../assets/")) imageUrl = imageUrl.replace("../", "");
    return { ...p, imageUrl };
}

export async function loadProductById(id) {
    if (!id) return null;

    if (!isFirebaseConfigured()) {
        return normalizeProductImage(getLocalProduct(id))
            || DEMO_PRODUCTS.find((p) => p.id === id)
            || null;
    }

    if (String(id).startsWith("demo-") || String(id).startsWith("prod_")) {
        const local = normalizeProductImage(getLocalProduct(id));
        if (local) return local;
    }

    const db = getDb();
    if (!db) {
        return normalizeProductImage(getLocalProduct(id))
            || DEMO_PRODUCTS.find((p) => p.id === id)
            || null;
    }

    try {
        const snap = await getDoc(doc(db, "products", id));
        if (!snap.exists()) {
            return normalizeProductImage(getLocalProduct(id))
                || DEMO_PRODUCTS.find((p) => p.id === id)
                || null;
        }
        const data = { id: snap.id, ...snap.data() };
        data.imageUrl = await resolveImageUrl(data);
        return data;
    } catch (e) {
        console.warn("loadProductById fallback:", e.message);
        return normalizeProductImage(getLocalProduct(id))
            || DEMO_PRODUCTS.find((p) => p.id === id)
            || null;
    }
}

export function badgeLabel(badge) {
    if (badge === "bestseller") return "Best-seller";
    if (badge === "nouveau") return "Nouveau";
    return "";
}

export function badgeClass(badge) {
    if (badge === "bestseller") return "badge badge-yellow";
    if (badge === "nouveau") return "badge badge-blue";
    return "badge";
}

export function formatPrice(price) {
    const n = Number(price);
    if (Number.isNaN(n)) return "— DT";
    return `${n % 1 === 0 ? n : n.toFixed(2)} DT`;
}

export function renderProductCard(product) {
    const img = product.imageUrl || product.image || "assets/logo-brikity.png";
    const badge = product.badge ? `<span class="${badgeClass(product.badge)}">${badgeLabel(product.badge)}</span>` : "";
    const colors = Array.isArray(product.colors) ? product.colors : [];
    const dots = colors.map((c) => `<span class="color-dot" style="background:${c}" title="${c}"></span>`).join("");

    return `
    <article class="product-card" data-id="${product.id}">
      <a class="product-card-media" href="produit-detail.html?id=${encodeURIComponent(product.id)}">
        ${badge}
        <img src="${img}" alt="${escapeAttr(product.name)}" loading="lazy" />
      </a>
      <div class="product-card-body">
        <h3><a href="produit-detail.html?id=${encodeURIComponent(product.id)}">${escapeHtml(product.name)}</a></h3>
        <p class="product-price">${formatPrice(product.price)}</p>
        <div class="color-dots">${dots}</div>
        <button type="button" class="btn btn-sm btn-add" data-add="${escapeAttr(product.id)}">Ajouter +</button>
      </div>
    </article>`;
}

export function bindAddButtons(container, products) {
    if (!container) return;
    container.querySelectorAll("[data-add]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-add");
            const product = products.find((p) => p.id === id);
            if (!product) return;
            addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.imageUrl || product.image,
                category: product.category || "",
                color: Array.isArray(product.colors) && product.colors[0] ? product.colors[0] : ""
            });
        });
    });
}

function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, "&quot;");
}
