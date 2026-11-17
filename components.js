class AppHeader extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <div class="nav-overlay" id="nav-overlay" hidden></div>
        <header class="site-header">
            <div class="container header-inner">
                <a class="brand" href="index.html" aria-label="Brikity accueil">
                    <img src="assets/logo-brikity.png" alt="Brikity" class="brand-logo" width="48" height="48" />
                    <span class="brand-name">BRIKITY</span>
                </a>

                <button class="hamburger" id="hamburger-btn" type="button" aria-label="Ouvrir le menu" aria-expanded="false">
                    <span></span><span></span><span></span>
                </button>

                <nav class="main-nav" id="main-nav" aria-label="Navigation principale">
                    <button class="nav-close" id="nav-close-btn" type="button" aria-label="Fermer le menu">✕</button>
                    <ul>
                        <li><a href="collection.html" id="nav-collection">Collection</a></li>
                        <li><a href="sur-mesure.html" id="nav-sur-mesure">Sur-Mesure</a></li>
                        <li><a href="index.html#concept" id="nav-concept">Le Concept</a></li>
                        <li><a href="index.html#faq" id="nav-faq">FAQ</a></li>
                    </ul>
                </nav>

                <a href="panier.html" class="nav-cart" id="nav-panier" aria-label="Panier">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                        <path d="M6 6h15l-1.5 9h-12z"/><path d="M6 6l-1-3H2"/><circle cx="9" cy="20" r="1.2"/><circle cx="18" cy="20" r="1.2"/>
                    </svg>
                </a>
            </div>
        </header>
        `;

        this.#bindNav();
    }

    #bindNav() {
        const btn = this.querySelector("#hamburger-btn");
        const nav = this.querySelector("#main-nav");
        const overlay = this.querySelector("#nav-overlay");
        const close = this.querySelector("#nav-close-btn");

        const open = () => {
            nav?.classList.add("is-open");
            overlay.hidden = false;
            btn?.setAttribute("aria-expanded", "true");
            document.body.classList.add("nav-open");
        };
        const shut = () => {
            nav?.classList.remove("is-open");
            overlay.hidden = true;
            btn?.setAttribute("aria-expanded", "false");
            document.body.classList.remove("nav-open");
        };

        btn?.addEventListener("click", open);
        close?.addEventListener("click", shut);
        overlay?.addEventListener("click", shut);
        nav?.querySelectorAll("a").forEach((a) => a.addEventListener("click", shut));
    }
}

class AppFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer class="site-footer">
            <div class="container footer-grid">
                <div class="footer-brand">
                    <a href="index.html" class="brand">
                        <img src="assets/logo-brikity.png" alt="Brikity" class="brand-logo" width="56" height="56" />
                        <span class="brand-name">BRIKITY</span>
                    </a>
                    <p>Cache-briquets 3D streetwear, Made in Tunisia. Style unique, anti-vol, édition limitée.</p>
                </div>
                <div class="footer-col">
                    <h3>Shop</h3>
                    <ul>
                        <li><a href="collection.html">Collection</a></li>
                        <li><a href="sur-mesure.html">Sur-mesure</a></li>
                        <li><a href="panier.html">Panier</a></li>
                        <li><a href="index.html#faq">FAQ</a></li>
                    </ul>
                </div>
                <div class="footer-col">
                    <h3>Livraison & Paiement</h3>
                    <p>Paiement à la livraison partout en Tunisie.</p>
                    <p class="muted">Made in Tunisia · Impression 3D PLA+</p>
                </div>
                <div class="footer-col">
                    <h3>Social</h3>
                    <ul class="social-links">
                        <li><a href="https://instagram.com/" target="_blank" rel="noopener">Instagram</a></li>
                        <li><a href="https://tiktok.com/" target="_blank" rel="noopener">TikTok</a></li>
                    </ul>
                </div>
            </div>
            <div class="container footer-bottom">
                <p>© 2026 Brikity Tunisia. Tous droits réservés.</p>
                <a href="admin/login.html" class="admin-link">Admin</a>
            </div>
        </footer>
        `;
    }
}

customElements.define("app-header", AppHeader);
customElements.define("app-footer", AppFooter);

document.addEventListener("DOMContentLoaded", async () => {
    const path = window.location.pathname;
    let page = path.split("/").pop() || "index.html";
    if (!page || page === "") page = "index.html";

    const map = {
        "index.html": "nav-concept",
        "collection.html": "nav-collection",
        "produit-detail.html": "nav-collection",
        "sur-mesure.html": "nav-sur-mesure",
        "panier.html": "nav-panier"
    };
    const id = map[page];
    if (id) {
        document.querySelectorAll(".main-nav a").forEach((a) => a.classList.remove("active"));
        document.getElementById(id)?.classList.add("active");
    }

    try {
        const { initCartIcon } = await import("./cart.js");
        initCartIcon();
    } catch (e) {
        console.warn("Cart badge init failed", e);
    }
});
