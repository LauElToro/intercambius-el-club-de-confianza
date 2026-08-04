export type Area = { x: number; y: number; width: number; height: number };

export type CropZoomLimits = {
  /** Zoom que llena el encuadre (objectFit cover). */
  fitZoom: number;
  /** Zoom mínimo para ver la imagen completa dentro del recorte. */
  minZoom: number;
  maxZoom: number;
};

/** Calcula límites de zoom según proporción imagen vs. área de recorte (4:3, etc.). */
export function computeCropZoomLimits(
  naturalWidth: number,
  naturalHeight: number,
  aspect: number,
): CropZoomLimits {
  const mediaAspect = naturalWidth / naturalHeight;
  const cropAspect = aspect;
  const fitZoom = 1;

  const minZoom =
    mediaAspect > cropAspect
      ? cropAspect / mediaAspect
      : mediaAspect / cropAspect;

  return {
    fitZoom,
    minZoom: Math.max(0.15, Math.min(minZoom * 0.98, fitZoom)),
    maxZoom: Math.max(3, fitZoom * 3),
  };
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', () => reject(new Error('No se pudo cargar la imagen')));
    if (!url.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = url;
  });
}

function clampCrop(area: Area, imageWidth: number, imageHeight: number): Area {
  const x = Math.max(0, Math.min(Math.round(area.x), imageWidth - 1));
  const y = Math.max(0, Math.min(Math.round(area.y), imageHeight - 1));
  const width = Math.max(1, Math.min(Math.round(area.width), imageWidth - x));
  const height = Math.max(1, Math.min(Math.round(area.height), imageHeight - y));
  return { x, y, width, height };
}

/** Recorta según área de react-easy-crop y devuelve Blob JPEG. */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const crop = clampCrop(pixelCrop, image.naturalWidth, image.naturalHeight);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear el canvas');

  if (rotation === 0) {
    canvas.width = crop.width;
    canvas.height = crop.height;
    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      0,
      0,
      crop.width,
      crop.height,
    );
  } else {
    const maxSize = Math.max(image.naturalWidth, image.naturalHeight);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);
    ctx.drawImage(
      image,
      (safeArea - image.naturalWidth) / 2,
      (safeArea - image.naturalHeight) / 2,
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.putImageData(
      data,
      Math.round(0 - safeArea / 2 + image.naturalWidth / 2 - crop.x),
      Math.round(0 - safeArea / 2 + image.naturalHeight / 2 - crop.y),
    );
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.size === 0) {
          reject(new Error('No se pudo generar la imagen recortada'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.92,
    );
  });
}

export function blobToFile(blob: Blob, originalName: string): File {
  const base = originalName.replace(/\.[^.]+$/, '') || 'imagen';
  return new File([blob], `${base}-recorte.jpg`, { type: 'image/jpeg' });
}
