import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface LocationPickerProps {
  value: string;
  onChange: (location: string, lat?: number, lng?: number, radius?: number) => void;
  radius?: number;
  onRadiusChange?: (radius: number) => void;
  label?: string;
  required?: boolean;
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

  const handleLocationSelect = (location: typeof commonLocations[0]) => {
    setSelectedLocation({ ...location, address: location.name });
    onChange(location.name, location.lat, location.lng, radius);
    setSearchQuery("");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Por ahora, buscar en las ubicaciones comunes
      const found = commonLocations.find(
        loc => loc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (found) {
        handleLocationSelect(found);
      } else {
        // Si no se encuentra, usar el texto ingresado
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
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon">
              <MapPin className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Seleccionar ubicación</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
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
