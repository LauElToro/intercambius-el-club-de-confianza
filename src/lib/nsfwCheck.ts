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
const MAX_CLASSIFY_SIDE = 512;

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = blobUrl;
  });
}

/** Escala la imagen para clasificación estable (evita fallos con fotos muy grandes o chicas). */
function canvasForClassification(img: HTMLImageElement): HTMLCanvasElement {
  const { naturalWidth: w, naturalHeight: h } = img;
  if (w <= 0 || h <= 0) {
    throw new Error("La imagen no tiene dimensiones válidas");
  }

  const scale = Math.min(1, MAX_CLASSIFY_SIDE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar la imagen para verificación");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Clasifica una imagen y devuelve true si se considera contenido inapropiado.
 * @param file - Archivo de imagen (File)
 * @returns true si la imagen se considera NSFW
 */
export async function isImageNsfw(file: File): Promise<boolean> {
  if (!file.type.startsWith("image/")) return false;
  if (file.size === 0) throw new Error("Archivo de imagen vacío");

  const model = await getModel();
  const img = await loadImageFromFile(file);
  const canvas = canvasForClassification(img);
  const predictions = await model.classify(canvas);

  const nsfwScore = predictions
    .filter((p) => NSFW_CLASSES.includes(p.className as (typeof NSFW_CLASSES)[number]))
    .reduce((sum, p) => sum + p.probability, 0);

  return nsfwScore >= NSFW_THRESHOLD;
}
