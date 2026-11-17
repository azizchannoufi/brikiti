const CART_KEY = "brikity_cart";

export function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: { cart } }));
}

export function addToCart(product) {
    const cart = getCart();
    const colorKey = product.color || "";
    const existing = cart.find((item) => item.id === product.id && (item.color || "") === colorKey);
    if (existing) {
        existing.qty += product.qty || 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image || product.imageUrl || "",
            category: product.category || "",
            color: colorKey,
            qty: product.qty || 1
        });
    }
    saveCart(cart);
    showCartToast(product.name);
}

export function removeFromCart(productId, color = "") {
    const cart = getCart().filter((item) => !(item.id === productId && (item.color || "") === color));
    saveCart(cart);
}

export function updateQty(productId, qty, color = "") {
    const cart = getCart();
    const item = cart.find((i) => i.id === productId && (i.color || "") === color);
    if (!item) return;
    if (qty <= 0) {
        removeFromCart(productId, color);
        return;
    }
    item.qty = qty;
    saveCart(cart);
}

export function clearCart() {
    saveCart([]);
}

export function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.qty, 0);
}

export function getCartTotal() {
    return getCart().reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        return sum + price * item.qty;
    }, 0);
}

function showCartToast(productName) {
    const old = document.getElementById("brikity-cart-toast");
    if (old) old.remove();

    const toast = document.createElement("div");
    toast.id = "brikity-cart-toast";
    toast.className = "cart-toast";
    toast.innerHTML = `
        <span><strong>${escapeHtml(productName)}</strong> ajouté au panier</span>
        <a href="panier.html">Voir →</a>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("is-hiding");
        setTimeout(() => toast.remove(), 350);
    }, 2800);
}

function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export function initCartIcon() {
    const link = document.getElementById("nav-panier");
    if (!link || document.getElementById("cart-badge")) return;

    const badge = document.createElement("span");
    badge.id = "cart-badge";
    badge.className = "cart-badge";
    badge.hidden = true;
    badge.textContent = "0";
    link.appendChild(badge);

    updateCartBadge();
    window.addEventListener("cart:updated", () => updateCartBadge());
}

export function updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    if (!badge) return;
    const count = getCartCount();
    if (count > 0) {
        badge.textContent = count > 99 ? "99+" : String(count);
        badge.hidden = false;
    } else {
        badge.hidden = true;
    }
}
