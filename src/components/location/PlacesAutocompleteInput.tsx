import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { geoService, type PlaceSuggestion } from '@/services/geo.service';

interface PlacesAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect: (place: { lat: number; lng: number; address: string }) => void;
  onEnterFallback?: () => void;
  placeholder?: string;
  className?: string;
}

/** Autocomplete vía Places API (New) en backend — sin la API legacy de JavaScript. */
export function PlacesAutocompleteInput({
  value,
  onChange,
  onPlaceSelect,
  onEnterFallback,
  placeholder = 'Buscar dirección, barrio o ciudad...',
  className,
}: PlacesAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const fetchSuggestions = useCallback(async (query: string) => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const results = await geoService.autocomplete(q);
      if (requestId !== requestIdRef.current) return;
      setSuggestions(results);
      setOpen(results.length > 0);
      setActiveIndex(-1);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(value);
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, fetchSuggestions]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const selectSuggestion = async (suggestion: PlaceSuggestion) => {
    setOpen(false);
    setSuggestions([]);
    onChange(suggestion.label);

    const place = await geoService.getPlace(suggestion.placeId);
    if (place) {
      onPlaceSelect(place);
      return;
    }

    const geocoded = await geoService.geocodeAddress(suggestion.label);
    if (geocoded) {
      onPlaceSelect(geocoded);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open && suggestions.length > 0) setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (open && activeIndex >= 0 && suggestions[activeIndex]) {
        void selectSuggestion(suggestions[activeIndex]);
      } else {
        setOpen(false);
        onEnterFallback?.();
      }
      return;
    }
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground pointer-events-none" />
      )}
      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md"
          role="listbox"
        >
          {suggestions.map((s, i) => (
            <li key={s.placeId} role="option" aria-selected={i === activeIndex}>
              <button
                type="button"
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground break-words',
                  i === activeIndex && 'bg-accent text-accent-foreground',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void selectSuggestion(s)}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
