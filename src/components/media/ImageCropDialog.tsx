import { useCallback, useEffect, useMemo, useState } from 'react';
import Cropper, { type Area, type MediaSize } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import {
  blobToFile,
  computeCropZoomLimits,
  getCroppedImageBlob,
  type CropZoomLimits,
} from '@/lib/cropImage';

const DEFAULT_ZOOM_LIMITS: CropZoomLimits = {
  fitZoom: 1,
  minZoom: 1,
  maxZoom: 3,
};

type Props = {
  open: boolean;
  file: File | null;
  onOpenChange: (open: boolean) => void;
  onCropped: (file: File) => void;
  aspect?: number;
  title?: string;
  /** Imágenes que faltan después de la actual en la cola. */
  remainingInQueue?: number;
  /** Total de imágenes en el lote de recorte (incluye la actual). */
  batchTotal?: number;
};

function zoomLabel(zoom: number, fitZoom: number): string {
  const pct = Math.round((zoom / fitZoom) * 100);
  if (Math.abs(pct - 100) <= 2) return 'Encuadre completo';
  if (pct < 100) return `Alejado · ${pct}%`;
  return `Acercado · ${pct}%`;
}

export function ImageCropDialog({
  open,
  file,
  onOpenChange,
  onCropped,
  aspect = 4 / 3,
  title = 'Encuadrar imagen',
  remainingInQueue = 0,
  batchTotal = 0,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [zoomLimits, setZoomLimits] = useState<CropZoomLimits>(DEFAULT_ZOOM_LIMITS);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!open || !file) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setZoomLimits(DEFAULT_ZOOM_LIMITS);
    setCroppedAreaPixels(null);
  }, [open, file]);

  const queueLabel = useMemo(() => {
    if (batchTotal <= 1) return null;
    const current = batchTotal - remainingInQueue;
    return `Foto ${current} de ${batchTotal}`;
  }, [batchTotal, remainingInQueue]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleMediaLoaded = useCallback(
    (mediaSize: MediaSize) => {
      const limits = computeCropZoomLimits(
        mediaSize.naturalWidth,
        mediaSize.naturalHeight,
        aspect,
      );
      setZoomLimits(limits);
      setZoom(limits.fitZoom);
      setCrop({ x: 0, y: 0 });
    },
    [aspect],
  );

  const applyZoom = (value: number) => {
    setZoom(Math.min(zoomLimits.maxZoom, Math.max(zoomLimits.minZoom, value)));
  };

  const resetToFit = () => {
    setZoom(zoomLimits.fitZoom);
    setCrop({ x: 0, y: 0 });
  };

  const showFullImage = () => {
    setZoom(zoomLimits.minZoom);
    setCrop({ x: 0, y: 0 });
  };

  const handleConfirm = async () => {
    if (!file || !previewUrl || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImageBlob(previewUrl, croppedAreaPixels);
      onCropped(blobToFile(blob, file.name));
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
  };

  const canZoomOut = zoomLimits.minZoom < zoomLimits.fitZoom - 0.01;
  const sliderStep = (zoomLimits.maxZoom - zoomLimits.minZoom) / 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-4 sm:max-w-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <DialogTitle>{title}</DialogTitle>
            {queueLabel && (
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {queueLabel}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Arrastrá para mover · Pinchá o usá la rueda para zoom · Proporción 4:3 para la publicación
          </p>
        </DialogHeader>

        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border bg-black/90 shadow-inner">
          {previewUrl && (
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              objectFit="cover"
              minZoom={zoomLimits.minZoom}
              maxZoom={zoomLimits.maxZoom}
              restrictPosition={zoom >= zoomLimits.fitZoom * 0.98}
              showGrid
              zoomWithScroll
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              onMediaLoaded={handleMediaLoaded}
              classes={{
                cropAreaClassName: '!border-2 !border-primary/80 !rounded-md',
              }}
            />
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{zoomLabel(zoom, zoomLimits.fitZoom)}</span>
            <div className="flex gap-1">
              {canZoomOut && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={showFullImage}
                  disabled={Math.abs(zoom - zoomLimits.minZoom) < 0.02}
                >
                  <Maximize2 className="mr-1 h-3.5 w-3.5" />
                  Ver completa
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={resetToFit}
                disabled={
                  Math.abs(zoom - zoomLimits.fitZoom) < 0.02 &&
                  Math.abs(crop.x) < 1 &&
                  Math.abs(crop.y) < 1
                }
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Restablecer
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 px-1">
            <button
              type="button"
              aria-label="Alejar"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              disabled={zoom <= zoomLimits.minZoom + 0.01}
              onClick={() => applyZoom(zoom - sliderStep * 5)}
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <Slider
              min={zoomLimits.minZoom}
              max={zoomLimits.maxZoom}
              step={Math.max(0.01, sliderStep)}
              value={[zoom]}
              onValueChange={(v) => applyZoom(v[0] ?? zoomLimits.fitZoom)}
              className="flex-1"
            />
            <button
              type="button"
              aria-label="Acercar"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              disabled={zoom >= zoomLimits.maxZoom - 0.01}
              onClick={() => applyZoom(zoom + sliderStep * 5)}
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={processing}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="gold"
            onClick={() => void handleConfirm()}
            disabled={processing || !file || !croppedAreaPixels}
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : remainingInQueue > 0 ? (
              'Usar y continuar'
            ) : (
              'Usar imagen'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
