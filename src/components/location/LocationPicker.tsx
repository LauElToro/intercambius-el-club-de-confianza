import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MapPin, Navigation } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UnifiedMapView } from '@/components/map/UnifiedMapView';
import { LocationSearchField } from '@/components/location/LocationSearchField';
import { geoService } from '@/services/geo.service';
import { resolveUbicacionToCoords } from '@/lib/ubicaciones';
import { DEFAULT_MAP_CENTER } from '@/lib/geo';

interface LocationPickerProps {
  value: string;
  onChange: (location: string, lat?: number, lng?: number, radius?: number) => void;
  radius?: number;
  onRadiusChange?: (radius: number) => void;
  label?: string;
  required?: boolean;
}

async function resolveAddressFromCoords(lat: number, lng: number): Promise<string> {
  const fromApi = await geoService.reverseGeocode(lat, lng);
  if (fromApi?.address) return fromApi.address;
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

function LocationPickerDialogBody({
  value,
  onChange,
  radius,
  onRadiusChange,
  onClose,
}: {
  value: string;
  onChange: LocationPickerProps['onChange'];
  radius: number;
  onRadiusChange?: (radius: number) => void;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!value || selectedLocation) return;

    const resolved = resolveUbicacionToCoords(value);
    if (resolved) {
      setSelectedLocation({ lat: resolved.lat, lng: resolved.lng, address: resolved.ubicacion });
      setSearchQuery(resolved.ubicacion);
      return;
    }

    void geoService.geocodeAddress(value).then((geocoded) => {
      if (geocoded) {
        setSelectedLocation({ lat: geocoded.lat, lng: geocoded.lng, address: geocoded.address });
        setSearchQuery(geocoded.address);
      }
    });
  }, [value, selectedLocation]);

  const mapCenter = selectedLocation ?? DEFAULT_MAP_CENTER;

  const applyCoords = useCallback(
    async (lat: number, lng: number, addressHint?: string) => {
      const address = addressHint || (await resolveAddressFromCoords(lat, lng));
      setSelectedLocation({ lat, lng, address });
      setSearchQuery(address);
      onChange(address, lat, lng, radius);
      setLocationError(null);
    },
    [onChange, radius],
  );

  const tryGetLocation = (highAccuracy: boolean) => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización');
      return;
    }
    if (!window.isSecureContext) {
      setLocationError('La geolocalización requiere HTTPS.');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await applyCoords(latitude, longitude);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        const messages: Record<number, string> = {
          [error.PERMISSION_DENIED]:
            'Permiso denegado. Probá recargar la página o elegí en el mapa.',
          [error.POSITION_UNAVAILABLE]: 'Ubicación no disponible. Elegí en el mapa o buscá una dirección.',
          [error.TIMEOUT]: 'Tiempo agotado. Probá de nuevo.',
        };
        setLocationError(messages[error.code] ?? 'No se pudo obtener tu ubicación');
      },
      { enableHighAccuracy: highAccuracy, timeout: 15000, maximumAge: 60000 },
    );
  };

  const handleRadiusChange = (newRadius: number[]) => {
    const radiusValue = newRadius[0];
    onRadiusChange?.(radiusValue);
    if (selectedLocation) {
      onChange(selectedLocation.address, selectedLocation.lat, selectedLocation.lng, radiusValue);
    }
  };

  return (
    <div className="space-y-4 min-w-0">
      <Button
        type="button"
        onClick={() => tryGetLocation(true)}
        disabled={isGettingLocation}
        variant="outline"
        className="w-full"
      >
        <Navigation className={`w-4 h-4 mr-2 ${isGettingLocation ? 'animate-spin' : ''}`} />
        {isGettingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual (GPS)'}
      </Button>

      {locationError && (
        <Alert variant="destructive">
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      <LocationSearchField
        value={searchQuery}
        onValueChange={setSearchQuery}
        onLocationSelect={({ lat, lng, address }) => void applyCoords(lat, lng, address)}
        onError={setLocationError}
        placeholder="Buscar dirección, barrio o ciudad..."
      />

      <div className="space-y-2">
        <Label>Radio de búsqueda: {radius} km</Label>
        <Slider value={[radius]} onValueChange={handleRadiusChange} min={1} max={100} step={1} />
      </div>

      <UnifiedMapView
        center={mapCenter}
        radiusKm={radius}
        height={280}
        draggableCenter
        onCenterChange={(lat, lng) => void applyCoords(lat, lng)}
      />

      {selectedLocation && (
        <p className="text-sm text-muted-foreground break-words">
          <MapPin className="w-4 h-4 inline mr-1 shrink-0" />
          {selectedLocation.address}
          <span className="text-xs ml-2">
            ({selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)})
          </span>
        </p>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={onClose}
          className="flex-1"
          disabled={!selectedLocation && !value}
        >
          Confirmar
        </Button>
      </div>
    </div>
  );
}

export const LocationPicker = ({
  value,
  onChange,
  radius = 20,
  onRadiusChange,
  label = 'Ubicación',
  required = false,
}: LocationPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor="location">{label} {required && '*'}</Label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="location"
            value={value}
            readOnly
            placeholder="Seleccioná ubicación en el mapa..."
            required={required}
            className="pl-10 bg-surface border-border focus:border-gold"
          />
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); }}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon" aria-label="Abrir mapa">
              <MapPin className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Seleccionar ubicación</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Buscá cualquier dirección, tocá el mapa o arrastrá el pin. Necesitamos coordenadas para calcular distancias.
              </p>
            </DialogHeader>
            <LocationPickerDialogBody
              value={value}
              onChange={onChange}
              radius={radius}
              onRadiusChange={onRadiusChange}
              onClose={() => setIsOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {radius > 0 && (
        <p className="text-xs text-muted-foreground">Radio de búsqueda: {radius} km</p>
      )}
    </div>
  );
};
