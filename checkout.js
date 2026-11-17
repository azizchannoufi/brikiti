import {
    collection,
    addDoc,
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getDb, isFirebaseConfigured } from "./firebase-init.js";
import { getCart, getCartTotal, clearCart } from "./cart.js";
import { notifyTelegramOrder } from "./telegram-notify.js";
import { getStorefrontSettings, addLocalOrder } from "./admin/local-db.js";

const DEFAULT_WA = "21600000000";
const DEFAULT_DELIVERY = { isFree: false, price: 7, freeThreshold: 80 };

export async function loadDeliverySettings() {
    if (!isFirebaseConfigured()) {
        const d = getStorefrontSettings().delivery || {};
        return {
            isFree: !!d.isFree,
            price: Number(d.price) || DEFAULT_DELIVERY.price,
            freeThreshold: Number(d.freeThreshold) || DEFAULT_DELIVERY.freeThreshold
        };
    }
    const db = getDb();
    if (!db) return { ...DEFAULT_DELIVERY };
    try {
        const snap = await getDoc(doc(db, "settings", "delivery"));
        if (!snap.exists()) return { ...DEFAULT_DELIVERY };
        const d = snap.data() || {};
        return {
            isFree: !!d.isFree,
            price: Number(d.price) || 0,
            freeThreshold: Number(d.freeThreshold) || DEFAULT_DELIVERY.freeThreshold
        };
    } catch {
        return { ...DEFAULT_DELIVERY };
    }
}

export async function loadWhatsAppPhone() {
    if (!isFirebaseConfigured()) {
        const phone = String(getStorefrontSettings().whatsapp?.phone || "").replace(/\D/g, "");
        return phone || DEFAULT_WA;
    }
    const db = getDb();
    if (!db) return DEFAULT_WA;
    try {
        const snap = await getDoc(doc(db, "settings", "whatsapp"));
        if (!snap.exists()) return DEFAULT_WA;
        const phone = String(snap.data()?.phone || "").replace(/\D/g, "");
        return phone || DEFAULT_WA;
    } catch {
        return DEFAULT_WA;
    }
}

export function computeDeliveryCost(subtotal, delivery) {
    if (!delivery) return 0;
    if (delivery.isFree) return 0;
    if (delivery.freeThreshold && subtotal >= delivery.freeThreshold) return 0;
    return Number(delivery.price) || 0;
}

function buildProductSummary(cartItems, customDetails) {
    if (customDetails) {
        return `Sur-mesure: ${customDetails.texte || "—"} | couleurs: ${customDetails.couleurs || "—"}`;
    }
    return (cartItems || [])
        .map((i) => `${i.name}${i.color ? ` (${i.color})` : ""} x${i.qty}`)
        .join(", ");
}

function buildWhatsAppText(order) {
    const lines = [
        "🔥 *Nouvelle commande Brikity*",
        "",
        `👤 ${order.nom}`,
        `📞 ${order.telephone}`,
        `📍 ${order.localisation || "—"}`,
        "",
        `🛍️ ${order.produit}`,
        `💵 Total: ${Number(order.totalAmount).toFixed(2)} DT`,
        `🚚 Livraison: ${Number(order.deliveryCost || 0).toFixed(2)} DT`,
        `📎 Source: ${order.source || "panier"}`
    ];
    if (order.message) lines.push(`📝 ${order.message}`);
    if (order.customDetails) {
        lines.push(`🎨 Texte: ${order.customDetails.texte || "—"}`);
        lines.push(`🎨 Couleurs: ${order.customDetails.couleurs || "—"}`);
        if (order.customDetails.notes) lines.push(`📝 Notes: ${order.customDetails.notes}`);
    }
    lines.push("", "Paiement à la livraison ✅");
    return lines.join("\n");
}

/**
 * Persist order (Firestore when configured) then open WhatsApp.
 */
export async function submitOrder({
    nom,
    telephone,
    localisation,
    message = "",
    source = "panier",
    customDetails = null,
    cartItems = null,
    totalAmount = null,
    deliveryCost = null
}) {
    const items = cartItems ?? getCart();
    const delivery = await loadDeliverySettings();

    let subtotal;
    if (items?.length) {
        subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0);
    } else if (customDetails) {
        subtotal = totalAmount != null ? Number(totalAmount) : 25;
    } else {
        subtotal = getCartTotal();
    }

    const ship = deliveryCost != null ? Number(deliveryCost) : computeDeliveryCost(subtotal, delivery);
    // Prefer recomputed total; only trust totalAmount when caller also passed deliveryCost (panier)
    const total = (totalAmount != null && deliveryCost != null)
        ? Number(totalAmount)
        : subtotal + ship;

    if (!nom || nom.trim().length < 2) throw new Error("Nom invalide.");
    if (!telephone || String(telephone).replace(/\D/g, "").length < 8) {
        throw new Error("Téléphone invalide.");
    }

    const orderPayload = {
        nom: nom.trim(),
        telephone: String(telephone).trim(),
        localisation: (localisation || "").trim(),
        message: (message || "").trim(),
        produit: buildProductSummary(items, customDetails),
        quantite: items.reduce((s, i) => s + (i.qty || 1), 0) || 1,
        cartItems: (items || []).map((i) => ({
            id: i.id,
            name: i.name,
            qty: i.qty,
            price: Number(i.price) || 0,
            color: i.color || ""
        })),
        totalAmount: total,
        deliveryCost: ship,
        status: "en_attente",
        source,
        customDetails: customDetails || null,
        createdAt: null
    };

    const db = getDb();
    let orderId = null;

    if (db && isFirebaseConfigured()) {
        const toSave = {
            ...orderPayload,
            createdAt: serverTimestamp()
        };
        const ref = await addDoc(collection(db, "orders"), toSave);
        orderId = ref.id;
        try {
            await notifyTelegramOrder(db, { ...orderPayload, id: orderId });
        } catch (e) {
            console.warn("Telegram notify skipped:", e.message);
        }
    } else {
        const local = addLocalOrder(orderPayload);
        orderId = local.id;
    }

    const phone = await loadWhatsAppPhone();
    const text = encodeURIComponent(buildWhatsAppText(orderPayload));
    const waUrl = `https://wa.me/${phone}?text=${text}`;

    if (source !== "sur_mesure" && items?.length) {
        clearCart();
    }

    return { orderId, waUrl, order: orderPayload };
}
