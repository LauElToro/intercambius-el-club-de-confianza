import { useEffect, useRef } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';

interface PlacesAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: { lat: number; lng: number; address: string }) => void;
  placeholder?: string;
  className?: string;
}

export function PlacesAutocompleteInput({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Buscar dirección, barrio o ciudad...',
  className,
}: PlacesAutocompleteInputProps) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.value = value;
  }, [value]);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
    autocomplete.setComponentRestrictions({ country: 'ar' });
  };

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    const loc = place?.geometry?.location;
    if (!loc) return;
    const address = place.formatted_address || place.name || value;
    onChange(address);
    onPlaceSelect({ lat: loc.lat(), lng: loc.lng(), address });
  };

  return (
    <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    </Autocomplete>
  );
}
