import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { blobToFile, getCroppedImageBlob } from '@/lib/cropImage';

type Props = {
  open: boolean;
  file: File | null;
  onOpenChange: (open: boolean) => void;
  onCropped: (file: File) => void;
  aspect?: number;
  title?: string;
};

export function ImageCropDialog({
  open,
  file,
  onOpenChange,
  onCropped,
  aspect = 4 / 3,
  title = 'Encuadrar imagen',
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const previewUrl = file ? URL.createObjectURL(file) : null;

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!file || !previewUrl || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImageBlob(previewUrl, croppedAreaPixels);
      onCropped(blobToFile(blob, file.name));
      onOpenChange(false);
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && previewUrl) URL.revokeObjectURL(previewUrl);
    if (!next) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative h-72 w-full min-h-[45vh] sm:h-80 overflow-hidden rounded-lg bg-muted">
          {previewUrl && (
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              minZoom={0.5}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>
        <div className="flex items-center gap-3 px-1">
          <ZoomOut className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Slider
            min={0.5}
            max={3}
            step={0.05}
            value={[zoom]}
            onValueChange={(v) => setZoom(v[0] ?? 1)}
          />
          <ZoomIn className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={processing}>
            Cancelar
          </Button>
          <Button type="button" variant="gold" onClick={() => void handleConfirm()} disabled={processing || !file}>
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              'Usar imagen'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
