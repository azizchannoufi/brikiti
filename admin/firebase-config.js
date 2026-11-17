// =============================================
// FIREBASE CONFIGURATION — PLACEHOLDERS
// =============================================
// Remplacez REPLACE_ME par vos credentials Firebase :
// https://console.firebase.google.com → Projet → Paramètres → Applications web
// Voir FIREBASE_SETUP.md pour le guide complet.

export const FIREBASE_CONFIG = {
    apiKey: "REPLACE_ME",
    authDomain: "REPLACE_ME.firebaseapp.com",
    projectId: "REPLACE_ME",
    storageBucket: "REPLACE_ME.appspot.com",
    messagingSenderId: "REPLACE_ME",
    appId: "REPLACE_ME"
};

/** True when real credentials are present (not placeholders). */
export function isFirebaseConfigured() {
    return Boolean(
        FIREBASE_CONFIG.apiKey &&
        FIREBASE_CONFIG.apiKey !== "REPLACE_ME" &&
        FIREBASE_CONFIG.projectId &&
        FIREBASE_CONFIG.projectId !== "REPLACE_ME"
    );
}
