import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MapPin, Search, Navigation, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UnifiedMapView } from '@/components/map/UnifiedMapView';
import { PlacesAutocompleteInput } from '@/components/location/PlacesAutocompleteInput';
import { useGoogleMapsLoader, hasGoogleMaps } from '@/hooks/use-google-maps';
import { geoService } from '@/services/geo.service';
import { COMMON_LOCATION_PRESETS, resolveUbicacionToCoords } from '@/lib/ubicaciones';
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
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (value && !selectedLocation) {
      const resolved = resolveUbicacionToCoords(value);
      if (resolved) {
        setSelectedLocation({ lat: resolved.lat, lng: resolved.lng, address: resolved.ubicacion });
      }
    }
  }, [value, selectedLocation]);

  const mapCenter = selectedLocation ?? DEFAULT_MAP_CENTER;

  const applyCoords = useCallback(
    async (lat: number, lng: number, addressHint?: string) => {
      const address = addressHint || (await resolveAddressFromCoords(lat, lng));
      setSelectedLocation({ lat, lng, address });
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
          [error.POSITION_UNAVAILABLE]: 'Ubicación no disponible. Elegí en el mapa o buscá una ciudad.',
          [error.TIMEOUT]: 'Tiempo agotado. Probá de nuevo.',
        };
        setLocationError(messages[error.code] ?? 'No se pudo obtener tu ubicación');
      },
      { enableHighAccuracy: highAccuracy, timeout: 15000, maximumAge: 60000 },
    );
  };

  const handleLocationSelect = (location: (typeof COMMON_LOCATION_PRESETS)[number]) => {
    setSelectedLocation({ lat: location.lat, lng: location.lng, address: location.name });
    onChange(location.name, location.lat, location.lng, radius);
    setSearchQuery('');
    setLocationError(null);
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;

    setIsSearching(true);
    setLocationError(null);

    const preset = COMMON_LOCATION_PRESETS.find(
      (loc) =>
        loc.name.toLowerCase().includes(q.toLowerCase()) ||
        q.toLowerCase().includes(loc.name.toLowerCase().split(' - ')[0]),
    );
    if (preset) {
      handleLocationSelect(preset);
      setIsSearching(false);
      return;
    }

    const geocoded = await geoService.geocodeAddress(q);
    if (geocoded) {
      await applyCoords(geocoded.lat, geocoded.lng, geocoded.address);
      setIsSearching(false);
      return;
    }

    setLocationError('No encontramos esa ubicación. Probá buscar en el mapa o elegí una ciudad de la lista.');
    setIsSearching(false);
  };

  const handleRadiusChange = (newRadius: number[]) => {
    const radiusValue = newRadius[0];
    onRadiusChange?.(radiusValue);
    if (selectedLocation) {
      onChange(selectedLocation.address, selectedLocation.lat, selectedLocation.lng, radiusValue);
    }
  };

  const mapsReady = !hasGoogleMaps || isLoaded;

  return (
    <div className="space-y-4">
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

      {loadError && hasGoogleMaps && (
        <Alert variant="destructive">
          <AlertDescription>
            Google Maps no cargó. Verificá VITE_GOOGLE_MAPS_API_KEY o usá la lista de ciudades.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
          {hasGoogleMaps && isLoaded ? (
            <PlacesAutocompleteInput
              value={searchQuery}
              onChange={setSearchQuery}
              onPlaceSelect={({ lat, lng, address }) => {
                void applyCoords(lat, lng, address);
                setSearchQuery(address);
              }}
              placeholder="Buscar con Google Places..."
              className="pl-10"
            />
          ) : (
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
              placeholder="Buscar ciudad, barrio..."
              className="pl-10"
            />
          )}
        </div>
        <Button type="button" onClick={() => void handleSearch()} variant="outline" disabled={isSearching}>
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Radio de búsqueda: {radius} km</Label>
        <Slider value={[radius]} onValueChange={handleRadiusChange} min={1} max={100} step={1} />
      </div>

      {mapsReady ? (
        <UnifiedMapView
          center={mapCenter}
          radiusKm={radius}
          height={280}
          draggableCenter
          onCenterChange={(lat, lng) => void applyCoords(lat, lng)}
        />
      ) : (
        <div className="h-[280px] rounded-lg border border-border bg-muted/30 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {selectedLocation && (
        <p className="text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 inline mr-1" />
          {selectedLocation.address}
          <span className="text-xs ml-2">
            ({selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)})
          </span>
        </p>
      )}

      <div>
        <Label className="mb-2 block">Ubicaciones comunes</Label>
        <div className="grid grid-cols-2 gap-2">
          {COMMON_LOCATION_PRESETS.map((location) => (
            <Button
              key={location.name}
              type="button"
              variant={selectedLocation?.address === location.name ? 'default' : 'outline'}
              onClick={() => handleLocationSelect(location)}
              className="justify-start text-left h-auto py-2"
            >
              <MapPin className="w-4 h-4 mr-2 shrink-0" />
              <span className="truncate">{location.name}</span>
            </Button>
          ))}
        </div>
      </div>

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
                Tocá el mapa, arrastrá el pin o buscá una dirección. Necesitamos coordenadas para calcular distancias.
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
