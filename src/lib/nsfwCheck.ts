/**
 * Clasificación NSFW con nsfwjs para moderar imágenes subidas.
 * @see https://nsfwjs.com/
 */

import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-cpu";
import * as tf from "@tensorflow/tfjs";
import * as nsfwjs from "nsfwjs";

let modelPromise: Promise<nsfwjs.NSFWJS> | null = null;
let tfInitPromise: Promise<void> | null = null;

async function ensureTensorFlow(): Promise<void> {
  if (!tfInitPromise) {
    tfInitPromise = (async () => {
      try {
        await tf.setBackend("webgl");
        await tf.ready();
        if (tf.getBackend() === "webgl") return;
      } catch {
        // WebGL no disponible: fallback a CPU.
      }
      await tf.setBackend("cpu");
      await tf.ready();
    })();
  }
  await tfInitPromise;
}

function resetModelCache(): void {
  modelPromise = null;
}

async function loadModel(): Promise<nsfwjs.NSFWJS> {
  await ensureTensorFlow();
  return nsfwjs.load("MobileNetV2");
}

function getModel(): Promise<nsfwjs.NSFWJS> {
  if (!modelPromise) {
    modelPromise = loadModel().catch((err) => {
      resetModelCache();
      throw err;
    });
  }
  return modelPromise;
}

/** Precarga el modelo en segundo plano (p. ej. al abrir el recorte). */
export function preloadNsfwModel(): void {
  void getModel().catch(() => {
    // Best-effort: el retry ocurre al confirmar la imagen.
  });
}

/** Clases consideradas inapropiadas */
const NSFW_CLASSES = ["Porn", "Hentai", "Sexy"] as const;
const NSFW_THRESHOLD = 0.8;
const MAX_CLASSIFY_SIDE = 512;

type LoadedImage = {
  img: HTMLImageElement;
  revoke: () => void;
};

function loadImageFromFile(file: File): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        img,
        revoke: () => URL.revokeObjectURL(blobUrl),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("No se pudo cargar la imagen"));
    };
    img.src = blobUrl;
  });
}

/** Escala la imagen para clasificación estable (evita fallos con fotos muy grandes). */
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

function scorePredictions(
  predictions: Array<{ className: string; probability: number }>,
): boolean {
  const nsfwScore = predictions
    .filter((p) => NSFW_CLASSES.includes(p.className as (typeof NSFW_CLASSES)[number]))
    .reduce((sum, p) => sum + p.probability, 0);

  return nsfwScore >= NSFW_THRESHOLD;
}

async function classifyLoadedImage(
  model: nsfwjs.NSFWJS,
  img: HTMLImageElement,
): Promise<boolean> {
  const { naturalWidth: w, naturalHeight: h } = img;
  if (w <= 0 || h <= 0) {
    throw new Error("La imagen no tiene dimensiones válidas");
  }

  const target =
    Math.max(w, h) > MAX_CLASSIFY_SIDE ? canvasForClassification(img) : img;
  const predictions = await model.classify(target);
  return scorePredictions(predictions);
}

async function classifyFile(file: File): Promise<boolean> {
  if (!file.type.startsWith("image/")) return false;
  if (file.size === 0) throw new Error("Archivo de imagen vacío");

  const model = await getModel();
  const { img, revoke } = await loadImageFromFile(file);

  try {
    return await classifyLoadedImage(model, img);
  } finally {
    revoke();
  }
}

/**
 * Clasifica una imagen y devuelve true si se considera contenido inapropiado.
 * Reintenta una vez ante fallos técnicos; si persiste, permite la imagen (fail-open).
 */
export async function isImageNsfw(file: File): Promise<boolean> {
  try {
    return await classifyFile(file);
  } catch (firstErr) {
    resetModelCache();
    try {
      return await classifyFile(file);
    } catch (retryErr) {
      console.warn("[nsfwCheck] Verificación fallida, se permite la imagen:", firstErr, retryErr);
      return false;
    }
  }
}
