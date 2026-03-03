/**
 * Clasificación NSFW con nsfwjs para moderar imágenes subidas.
 * @see https://nsfwjs.com/
 */

import * as nsfwjs from "nsfwjs";

let modelPromise: Promise<nsfwjs.NSFWJS> | null = null;

/** Carga el modelo una sola vez (lazy). Usa MobileNetV2 por ser más liviano (~2.6MB). */
function getModel(): Promise<nsfwjs.NSFWJS> {
  if (!modelPromise) {
    modelPromise = nsfwjs.load("MobileNetV2");
  }
  return modelPromise;
}

/** Clases consideradas inapropiadas */
const NSFW_CLASSES = ["Porn", "Hentai", "Sexy"] as const;
const NSFW_THRESHOLD = 0.8;

/**
 * Clasifica una imagen y devuelve true si se considera contenido inapropiado.
 * @param file - Archivo de imagen (File)
 * @returns true si la imagen se considera NSFW
 */
export async function isImageNsfw(file: File): Promise<boolean> {
  if (!file.type.startsWith("image/")) return false;

  const model = await getModel();
  const img = new Image();
  img.crossOrigin = "anonymous";

  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const predictions = await model.classify(img);
        URL.revokeObjectURL(blobUrl);

        const nsfwScore = predictions
          .filter((p) => NSFW_CLASSES.includes(p.className as (typeof NSFW_CLASSES)[number]))
          .reduce((sum, p) => sum + p.probability, 0);

        resolve(nsfwScore >= NSFW_THRESHOLD);
      } catch (err) {
        URL.revokeObjectURL(blobUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = blobUrl;
  });
}
