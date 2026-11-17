import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

export async function loadTelegramSettings(db) {
    if (!db) return null;
    try {
        const snap = await getDoc(doc(db, "settings", "telegram"));
        if (!snap.exists()) return null;
        const cfg = snap.data() || {};
        return {
            enabled: !!cfg.enabled,
            botToken: String(cfg.botToken || "").trim(),
            chatId: String(cfg.chatId || "").trim()
        };
    } catch {
        // Public clients cannot read telegram settings (admin-only rules)
        return null;
    }
}

export async function sendTelegramMessage(botToken, chatId, text) {
    const token = String(botToken || "").trim();
    const chat = String(chatId || "").trim();
    if (!token || !chat) {
        return { ok: false, error: "Token ou Chat ID manquant." };
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = new URLSearchParams({
        chat_id: chat,
        text: String(text || ""),
        parse_mode: "HTML",
        disable_web_page_preview: "true"
    });

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
            const description = data.description || `HTTP ${res.status}`;
            return { ok: false, error: description, description };
        }
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err?.message || "Erreur réseau / CORS" };
    }
}

function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function formatOrderMessage(order) {
    const lines = [
        "🔥 <b>Nouvelle commande Brikity</b>",
        "",
        `👤 <b>Client:</b> ${escapeHtml(order.nom)}`,
        `📞 <b>Tél:</b> ${escapeHtml(order.telephone)}`,
        `📍 <b>Adresse:</b> ${escapeHtml(order.localisation || "—")}`
    ];
    if (order.message) lines.push(`📝 <b>Note:</b> ${escapeHtml(order.message)}`);
    lines.push("");
    lines.push(`🛍️ <b>Articles:</b> ${escapeHtml(order.produit || "")}`);
    const total = Number(order.totalAmount);
    if (!Number.isNaN(total) && total > 0) {
        lines.push(`💵 <b>Total:</b> ${total.toFixed(2)} DT`);
    }
    if (order.source) lines.push(`📎 Source: ${escapeHtml(order.source)}`);
    return lines.join("\n");
}

/**
 * Best-effort notify. Skips silently when settings are admin-only (public site).
 * Admin "Tester" button uses sendTelegramMessage with form values directly.
 */
export async function notifyTelegramOrder(db, order) {
    const cfg = await loadTelegramSettings(db);
    if (!cfg || !cfg.enabled || !cfg.botToken || !cfg.chatId) {
        return { ok: false, skipped: true, error: "Telegram non configuré ou non lisible côté public" };
    }
    return sendTelegramMessage(cfg.botToken, cfg.chatId, formatOrderMessage(order));
}
