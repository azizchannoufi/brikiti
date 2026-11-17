import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { FIREBASE_CONFIG, isFirebaseConfigured } from "./firebase-config.js";
import { isDemoLoggedIn, logoutDemo, getDemoSession } from "./local-db.js";

function getAppInstance() {
    if (!isFirebaseConfigured()) {
        throw new Error("Firebase non configuré");
    }
    return getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
}

/**
 * Gate admin pages. Uses demo session when Firebase is not configured.
 * onReady({ user, auth, db, app, demo })
 */
export function requireAdmin(onReady) {
    // ── Demo / local mode ─────────────────────────────────
    if (!isFirebaseConfigured()) {
        if (!isDemoLoggedIn()) {
            window.location.href = "login.html";
            return null;
        }
        const session = getDemoSession();
        const user = { email: session.email, uid: "demo-admin" };
        const auth = {
            demo: true,
            signOut: async () => { logoutDemo(); window.location.href = "login.html"; }
        };
        if (typeof onReady === "function") {
            onReady({ user, auth, db: null, app: null, demo: true });
        }
        return { app: null, auth, db: null, demo: true };
    }

    // ── Firebase mode ─────────────────────────────────────
    let app;
    try {
        app = getAppInstance();
    } catch (e) {
        document.body.innerHTML = `<div style="padding:2rem;font-family:sans-serif;background:#121212;color:#f8f9fa;min-height:100vh">
            <h1>Firebase non configuré</h1>
            <p>${e.message}</p>
            <a href="login.html" style="color:#ffd000">Retour login</a>
        </div>`;
        return null;
    }

    const auth = getAuth(app);
    const db = getFirestore(app);

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "login.html";
            return;
        }
        try {
            const snap = await getDoc(doc(db, "admins", user.uid));
            if (!snap.exists()) {
                await signOut(auth);
                window.location.href = "login.html?error=not_admin";
                return;
            }
            if (typeof onReady === "function") onReady({ user, auth, db, app, demo: false });
        } catch (err) {
            console.error("Admin check failed:", err);
            try { await signOut(auth); } catch (_) { /* */ }
            window.location.href = "login.html?error=not_admin";
        }
    });

    return { app, auth, db, demo: false };
}

export async function assertIsAdmin(auth, db, user) {
    if (!user) return false;
    const snap = await getDoc(doc(db, "admins", user.uid));
    if (!snap.exists()) {
        await signOut(auth);
        return false;
    }
    return true;
}

export function renderAdminShell(active, { demo = false } = {}) {
    return `
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
            <img src="../assets/logo-brikity.png" alt="" width="36" height="36" />
            <div>
                <strong>BRIKITY</strong>
                <span>Admin${demo ? " · démo" : ""}</span>
            </div>
        </div>
        <nav class="sidebar-nav">
            <a class="nav-item ${active === "index" ? "active" : ""}" href="index.html">Dashboard</a>
            <a class="nav-item ${active === "inventory" ? "active" : ""}" href="inventory.html">Produits</a>
            <a class="nav-item ${active === "categories" ? "active" : ""}" href="categories.html">Catégories</a>
            <a class="nav-item ${active === "orders" ? "active" : ""}" href="orders.html">Commandes</a>
            <a class="nav-item ${active === "settings" ? "active" : ""}" href="settings.html">Réglages</a>
        </nav>
        <div class="sidebar-footer">
            <a href="../index.html" class="nav-item">← Site</a>
            <button type="button" class="nav-item btn-logout" id="btn-logout">Déconnexion</button>
        </div>
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    `;
}

export function bindAdminChrome(auth) {
    document.getElementById("btn-logout")?.addEventListener("click", async () => {
        if (auth?.demo && typeof auth.signOut === "function") {
            await auth.signOut();
            return;
        }
        try {
            await signOut(auth);
        } catch {
            logoutDemo();
            window.location.href = "login.html";
        }
        window.location.href = "login.html";
    });
    const btn = document.getElementById("mobile-menu-btn");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const open = () => { sidebar?.classList.add("open"); overlay?.classList.add("open"); };
    const close = () => { sidebar?.classList.remove("open"); overlay?.classList.remove("open"); };
    btn?.addEventListener("click", open);
    overlay?.addEventListener("click", close);
}
