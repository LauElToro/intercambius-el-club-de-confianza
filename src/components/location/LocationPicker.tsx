import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, X, Navigation } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LocationPickerProps {
  value: string;
  onChange: (location: string, lat?: number, lng?: number, radius?: number) => void;
  radius?: number;
  onRadiusChange?: (radius: number) => void;
  label?: string;
  required?: boolean;
}

// Función para obtener la dirección desde coordenadas (reverse geocoding)
async function getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
  try {
    // Usar Nominatim (OpenStreetMap) para reverse geocoding gratuito
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Intercambius App'
        }
      }
    );
    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      // Construir dirección legible
      const parts: string[] = [];
      
      if (addr.neighbourhood || addr.suburb) {
        parts.push(addr.neighbourhood || addr.suburb);
      }
      if (addr.city || addr.town || addr.village) {
        parts.push(addr.city || addr.town || addr.village);
      }
      if (addr.state) {
        parts.push(addr.state);
      }
      
      return parts.length > 0 ? parts.join(', ') : data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
    
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Error obteniendo dirección:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export const LocationPicker = ({
  value,
  onChange,
  radius = 20,
  onRadiusChange,
  label = "Ubicación",
  required = false,
}: LocationPickerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Ubicaciones comunes en Argentina
  const commonLocations = [
    { name: "CABA - Centro", lat: -34.6037, lng: -58.3816 },
    { name: "CABA - Palermo", lat: -34.5885, lng: -58.4204 },
    { name: "CABA - Belgrano", lat: -34.5631, lng: -58.4584 },
    { name: "CABA - Caballito", lat: -34.6208, lng: -58.4414 },
    { name: "CABA - San Telmo", lat: -34.6208, lng: -58.3731 },
    { name: "La Plata", lat: -34.9215, lng: -57.9545 },
    { name: "Mar del Plata", lat: -38.0055, lng: -57.5426 },
    { name: "Córdoba", lat: -31.4201, lng: -64.1888 },
    { name: "Rosario", lat: -32.9442, lng: -60.6505 },
  ];

  useEffect(() => {
    if (value && !selectedLocation) {
      // Intentar encontrar la ubicación en las comunes
      const found = commonLocations.find(loc => loc.name === value);
      if (found) {
        setSelectedLocation({ ...found, address: found.name });
      }
    }
  }, [value]);

  // Función para obtener ubicación automática
  const tryGetLocation = (highAccuracy: boolean) => {
    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización');
      return;
    }
    if (!window.isSecureContext) {
      setLocationError('La geolocalización requiere HTTPS. Asegurate de estar en una conexión segura.');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    const onSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      try {
        const address = await getAddressFromCoordinates(latitude, longitude);
        setSelectedLocation({ lat: latitude, lng: longitude, address });
        onChange(address, latitude, longitude, radius);
        setLocationError(null);
      } catch (error) {
        console.error('Error obteniendo dirección:', error);
        const fallbackAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setSelectedLocation({ lat: latitude, lng: longitude, address: fallbackAddress });
        onChange(fallbackAddress, latitude, longitude, radius);
      } finally {
        setIsGettingLocation(false);
      }
    };

    const onError = (error: GeolocationPositionError) => {
      setIsGettingLocation(false);
      let errorMessage = 'No se pudo obtener tu ubicación';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permiso denegado. Si ya lo permitiste en la configuración, probá recargar la página y volver a intentar. También podés elegir una ubicación de la lista o buscar manualmente.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Ubicación no disponible (GPS/WiFi desactivado o sin señal). Probá elegir una ubicación de la lista.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Tiempo agotado. Probá de nuevo o elegí una ubicación de la lista.';
          break;
      }
      setLocationError(errorMessage);
    };

    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: 15000,
      maximumAge: 60000, // Usar posición en caché hasta 1 min (más tolerante)
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  };

  const handleGetCurrentLocation = () => tryGetLocation(false);

  const handleLocationSelect = (location: typeof commonLocations[0]) => {
    setSelectedLocation({ ...location, address: location.name });
    onChange(location.name, location.lat, location.lng, radius);
    setSearchQuery("");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      // Buscar: nombre contiene búsqueda O búsqueda contiene nombre (ej: "córdoba" matchea "Córdoba")
      const found = commonLocations.find(
        loc => loc.name.toLowerCase().includes(query) || query.includes(loc.name.toLowerCase().split(' - ')[0])
      );
      if (found) {
        handleLocationSelect(found);
      } else {
        // Si no se encuentra, usar el texto pero sin coordenadas (no aparecerá en filtro por distancia)
        onChange(searchQuery);
        setSelectedLocation(null);
      }
    }
  };

  const handleRadiusChange = (newRadius: number[]) => {
    const radiusValue = newRadius[0];
    if (onRadiusChange) {
      onRadiusChange(radiusValue);
    }
    if (selectedLocation) {
      onChange(selectedLocation.address, selectedLocation.lat, selectedLocation.lng, radiusValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="location">{label} {required && "*"}</Label>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="location"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Buscar ubicación..."
            required={required}
            className="pl-10 bg-surface border-border focus:border-gold"
            readOnly
          />
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setLocationError(null); }}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon">
              <MapPin className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Seleccionar ubicación</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Para que tu publicación aparezca en búsquedas por distancia, seleccioná una ubicación de la lista o usá tu ubicación actual.
              </p>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Botón de ubicación automática */}
              <Button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                variant="outline"
                className="w-full"
              >
                <Navigation className={`w-4 h-4 mr-2 ${isGettingLocation ? 'animate-spin' : ''}`} />
                {isGettingLocation ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
              </Button>

              {locationError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <span className="block mb-2">{locationError}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => { setLocationError(null); handleGetCurrentLocation(); }}
                      disabled={isGettingLocation}
                    >
                      Reintentar
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Búsqueda */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Buscar ciudad, barrio..."
                    className="pl-10"
                  />
                </div>
                <Button type="button" onClick={handleSearch} variant="outline">
                  Buscar
                </Button>
              </div>

              {/* Radio de búsqueda */}
              <div className="space-y-2">
                <Label>Radio de búsqueda: {radius} km</Label>
                <Slider
                  value={[radius]}
                  onValueChange={handleRadiusChange}
                  min={1}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1 km</span>
                  <span>50 km</span>
                  <span>100 km</span>
                </div>
              </div>

              {/* Mapa placeholder */}
              <Card className="h-64 bg-muted/50 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Mapa interactivo (se implementará con Google Maps)
                  </p>
                  {selectedLocation && (
                    <p className="text-xs text-muted-foreground">
                      {selectedLocation.address}
                    </p>
                  )}
                </div>
              </Card>

              {/* Ubicaciones comunes */}
              <div>
                <Label className="mb-2 block">Ubicaciones comunes</Label>
                <div className="grid grid-cols-2 gap-2">
                  {commonLocations.map((location) => (
                    <Button
                      key={location.name}
                      type="button"
                      variant={selectedLocation?.name === location.name ? "default" : "outline"}
                      onClick={() => handleLocationSelect(location)}
                      className="justify-start"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      {location.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (selectedLocation || value) {
                      setIsOpen(false);
                    }
                  }}
                  className="flex-1"
                  disabled={!selectedLocation && !value}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {radius > 0 && (
        <p className="text-xs text-muted-foreground">
          Radio de búsqueda: {radius} km
        </p>
      )}
    </div>
  );
};
