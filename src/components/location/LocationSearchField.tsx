import { useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlacesAutocompleteInput } from '@/components/location/PlacesAutocompleteInput';
import { geoService } from '@/services/geo.service';

export interface LocationSelection {
  lat: number;
  lng: number;
  address: string;
}

interface LocationSearchFieldProps {
  value?: string;
  onValueChange?: (value: string) => void;
  onLocationSelect: (location: LocationSelection) => void;
  placeholder?: string;
  showSearchButton?: boolean;
  className?: string;
  inputClassName?: string;
  onError?: (message: string | null) => void;
}

/** Búsqueda de ubicación con Places API (New) vía backend + geocoding de respaldo. */
export function LocationSearchField({
  value,
  onValueChange,
  onLocationSelect,
  placeholder = 'Buscar dirección, barrio o ciudad...',
  showSearchButton = true,
  className,
  inputClassName,
  onError,
}: LocationSearchFieldProps) {
  const [query, setQuery] = useState(value ?? '');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (value !== undefined) setQuery(value);
  }, [value]);

  const updateQuery = (next: string) => {
    setQuery(next);
    onValueChange?.(next);
  };

  const selectLocation = (location: LocationSelection) => {
    updateQuery(location.address);
    onError?.(null);
    onLocationSelect(location);
  };

  const geocodeQuery = async () => {
    const q = query.trim();
    if (!q) return;

    setSearching(true);
    onError?.(null);
    try {
      const geocoded = await geoService.geocodeAddress(q);
      if (geocoded) {
        selectLocation(geocoded);
      } else {
        onError?.('No encontramos esa ubicación. Probá con otra dirección o barrio.');
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className={cn('flex gap-2 min-w-0', className)}>
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
        <PlacesAutocompleteInput
          value={query}
          onChange={updateQuery}
          onPlaceSelect={selectLocation}
          onEnterFallback={() => void geocodeQuery()}
          placeholder={placeholder}
          className={cn('pl-10 pr-9', inputClassName)}
        />
      </div>
      {showSearchButton && (
        <Button
          type="button"
          variant="outline"
          onClick={() => void geocodeQuery()}
          disabled={searching || !query.trim()}
          className="shrink-0"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
        </Button>
      )}
    </div>
  );
}
