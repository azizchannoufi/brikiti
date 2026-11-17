# Firebase setup — Brikity

Le site fonctionne en **mode démo** (produits seed) tant que `admin/firebase-config.js` contient `REPLACE_ME`. Suis ces étapes pour brancher un vrai projet.

## 1. Créer le projet

1. [Firebase Console](https://console.firebase.google.com) → Add project
2. Authentication → Sign-in method → **Email/Password** → Enable
3. Crée un utilisateur admin (Authentication → Users → Add user)
4. Firestore Database → Create (mode production), région recommandée `europe-west3`
5. Storage → Get started
6. Project settings → Your apps → Web → copie la config

## 2. Coller la config

Dans [`admin/firebase-config.js`](admin/firebase-config.js) :

```js
export const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

## 3. Allowlist admin

Dans Firestore, crée le document :

- Collection : `admins`
- Document ID : **UID** de l’utilisateur Auth (copié depuis Authentication → Users)
- Champs : `email` (string), `role` : `"admin"`

Sans ce document, le login échoue avec `not_admin`.

## 4. Déployer les règles

```bash
firebase login
firebase use <ton-project-id>
firebase deploy --only firestore:rules,storage:rules
```

Fichiers : [`firestore.rules`](firestore.rules), [`storage.rules`](storage.rules).

## 5. Réglages boutique

Connecte-toi sur `/admin/login.html` puis **Réglages** :

- WhatsApp : numéro `216XXXXXXXX`
- Livraison : prix + seuil gratuit
- Telegram (optionnel) : token + chat ID + bouton Tester

Ajoute des produits dans **Produits** (upload image compressée → Storage).

## 6. Collections utilisées

| Collection / doc | Rôle |
|------------------|------|
| `products` | Catalogue |
| `categories` | Filtres |
| `orders` | Commandes (création publique `en_attente`) |
| `settings/delivery` | Frais de port |
| `settings/whatsapp` | Numéro checkout |
| `settings/telegram` | Secrets admin-only |
| `settings/banner` | Bannière optionnelle |
| `admins/{uid}` | Allowlist (écriture Console uniquement) |

## 7. Hosting (optionnel)

```bash
firebase deploy --only hosting
```

Ou sers le dossier en local :

```bash
npx live-server
```

## Telegram & sécurité

Le token Telegram n’est **pas** lisible côté site public (règles). Le bouton **Tester** marche dans l’admin. Pour alerter à chaque commande sans exposer le token, ajoute plus tard une Cloud Function sur `orders` create (plan Blaze).
