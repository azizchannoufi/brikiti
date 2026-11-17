/** Seed catalog used when Firebase is empty or not configured. */
export const DEMO_PRODUCTS = [
    {
        id: "demo-sidi-bou",
        name: "Édition Sidi Bou",
        description: "Bleu médina & blanc — vibe Sidi Bou Saïd, grip street et finition mate.",
        price: 15,
        oldPrice: null,
        category: "drop",
        colors: ["#0066FF", "#F8F9FA", "#FFD000"],
        badge: "bestseller",
        imageUrl: "assets/logo-brikity.png",
        images: [],
        stock: 50,
        isActive: true
    },
    {
        id: "demo-cyber-harissa",
        name: "Cyber Harissa",
        description: "Orange harissa électrique, look cyber-street 100% Tunisie.",
        price: 18,
        oldPrice: 22,
        category: "drop",
        colors: ["#FF4D00", "#121212", "#FFD000"],
        badge: "nouveau",
        imageUrl: "assets/logo-brikity.png",
        images: [],
        stock: 40,
        isActive: true
    },
    {
        id: "demo-carthage-armor",
        name: "Carthage Armor",
        description: "Armure urbaine — contours géométriques et résistance PLA+.",
        price: 17,
        oldPrice: null,
        category: "armor",
        colors: ["#262626", "#FFD000", "#0066FF"],
        badge: null,
        imageUrl: "assets/logo-brikity.png",
        images: [],
        stock: 35,
        isActive: true
    },
    {
        id: "demo-street-grip",
        name: "Street Grip",
        description: "Texture grip anti-glisse pour le quotidien. Made in Tunisia.",
        price: 15,
        oldPrice: null,
        category: "street",
        colors: ["#FFD000", "#0066FF", "#FF4D00"],
        badge: "nouveau",
        imageUrl: "assets/logo-brikity.png",
        images: [],
        stock: 45,
        isActive: true
    }
];

export const DEMO_CATEGORIES = [
    { id: "drop", title: "Le Drop", order: 1 },
    { id: "armor", title: "Armor", order: 2 },
    { id: "street", title: "Street", order: 3 },
    { id: "custom", title: "Sur-mesure", order: 4 }
];
