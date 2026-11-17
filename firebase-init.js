import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { FIREBASE_CONFIG, isFirebaseConfigured } from "./admin/firebase-config.js";
import { initImageStorage } from "./image-resolve.js";

let app = null;
let db = null;
let ready = false;

/**
 * Init Firebase once. Returns null db when placeholders are still in place.
 */
export function getFirebase() {
    if (ready) return { app, db };

    try {
        if (isFirebaseConfigured()) {
            app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
            db = getFirestore(app);
            initImageStorage(app);
        }
    } catch (e) {
        console.warn("Firebase not initialized:", e.message);
    }

    ready = true;
    return { app, db };
}

export function getDb() {
    return getFirebase().db;
}

export { isFirebaseConfigured };
