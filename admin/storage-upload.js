import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const MAX_WIDTH = 1000;
const JPEG_QUALITY = 0.72;
const MAX_BYTES = 5 * 1024 * 1024;

export function compressImage(file, maxWidth = MAX_WIDTH, quality = JPEG_QUALITY) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith("image/")) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Impossible de lire le fichier image."));
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error("Image invalide."));
            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("Échec de la compression."));
                            return;
                        }
                        const name = (file.name || "image").replace(/\.[^.]+$/, "") + ".jpg";
                        resolve(new File([blob], name, { type: "image/jpeg", lastModified: Date.now() }));
                    },
                    "image/jpeg",
                    quality
                );
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

function safeFileName(name) {
    return String(name || "image.jpg")
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 80);
}

export async function uploadImage(storage, file, folder = "products") {
    if (!file) throw new Error("Aucun fichier sélectionné.");
    if (file.size > MAX_BYTES * 3) {
        throw new Error("Fichier trop volumineux (max ~15 Mo avant compression).");
    }

    const compressed = await compressImage(file);
    if (compressed.size > MAX_BYTES) {
        throw new Error("Image trop lourde après compression (max 5 Mo).");
    }

    const path = `${folder}/${Date.now()}_${safeFileName(compressed.name)}`;
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, compressed, {
        contentType: compressed.type || "image/jpeg",
        cacheControl: "public,max-age=31536000"
    });
    const url = await getDownloadURL(storageRef);
    return { url, path };
}
