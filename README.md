# Brikity

E-commerce streetwear tunisien — cache-briquets 3D (cache-briquets / lighter cases).

Site statique **HTML / CSS / ES modules** + **Firebase** (Firestore, Auth admin, Storage), panier `localStorage`, checkout **WhatsApp** + paiement à la livraison.

## Lancer en local

```bash
npx live-server
```

Ouvre `http://127.0.0.1:8080` (ou le port affiché).

Sans Firebase configuré, la boutique et l’admin tournent en **mode démo local** (`localStorage`).

### Accès admin démo (sans Firebase)

- URL : `/admin/login.html`
- Email : `admin@brikity.tn`
- Mot de passe : `brikity2026`

## Structure

| Chemin | Rôle |
|--------|------|
| `index.html` | Landing (hero, marquee, drop, sur-mesure, concept, FAQ) |
| `collection.html` | Catalogue + filtres |
| `produit-detail.html` | Fiche produit |
| `sur-mesure.html` | Commande custom |
| `panier.html` | Panier + checkout |
| `style.css` / `components.js` | Design system + header/footer |
| `cart.js` / `catalog.js` / `checkout.js` | Panier, catalogue, commandes |
| `assets/logo-brikity.png` | Logo graffiti |
| `admin/` | Back-office (login, dashboard, produits, catégories, commandes, réglages) |

## Firebase

Voir **[FIREBASE_SETUP.md](FIREBASE_SETUP.md)** — remplace les `REPLACE_ME` dans `admin/firebase-config.js`, crée `admins/{uid}`, déploie les règles.

## Brand

- Fond `#121212` · Surface `#262626` · Texte `#F8F9FA`
- Accents : bleu `#0066FF` · orange CTA `#FF4D00` · jaune `#FFD000`
- Typo : Syne + Plus Jakarta Sans · textes FR · prix en DT

## Admin

1. Configure Firebase + allowlist
2. `/admin/login.html`
3. Ajoute produits / catégories
4. Réglages WhatsApp + livraison

© 2026 Brikity Tunisia
