'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type InputHTMLAttributes
} from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { MapPin, Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Spinner } from '@/components/ui/spinner';

/* -------------------------------------------------------------------------- */
/*  GeoJSON types (subset for Photon API)                                     */
/* -------------------------------------------------------------------------- */

interface PlaceFeatureProperties {
  osm_id: number;
  osm_type: 'N' | 'W' | 'R';
  osm_key: string;
  osm_value: string;
  type: string;
  name?: string;
  housenumber?: string;
  street?: string;
  locality?: string;
  district?: string;
  postcode?: string;
  city?: string;
  county?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  extent?: [number, number, number, number];
}

interface PlaceFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: PlaceFeatureProperties;
}

interface PlaceFeatureCollection {
  type: 'FeatureCollection';
  features: PlaceFeature[];
}

/* -------------------------------------------------------------------------- */
/*  Search options                                                            */
/* -------------------------------------------------------------------------- */

interface PlaceSearchOptions {
  /** Search text (address, place name, or POI). */
  query: string;
  /** Preferred language for results (e.g., "en", "de", "fr"). */
  lang?: string;
  /** Maximum number of results to return. */
  limit?: number;
  /** Bounding box to restrict results: [minLon, minLat, maxLon, maxLat]. */
  bbox?: [number, number, number, number];
  /** Latitude used to bias results toward a specific location. */
  lat?: number;
  /** Longitude used to bias results toward a specific location. */
  lon?: number;
  /** Zoom level for location biasing (higher = more local). */
  zoom?: number;
  /** Strength of the location bias. */
  locationBiasScale?: number;
}

/* -------------------------------------------------------------------------- */
/*  Variants                                                                  */
/* -------------------------------------------------------------------------- */

const placeAutocompleteVariants = cva(
  'flex items-center gap-2 rounded-md border bg-background shadow-xs transition-[color,box-shadow]',
  {
    variants: {
      variant: {
        default: 'border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        outline: 'border-border focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        ghost: 'border-transparent shadow-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50'
      },
      size: {
        sm: 'h-8 px-2 text-xs',
        default: 'h-9 px-2.5 text-sm',
        lg: 'h-11 px-3 text-base'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatAddress(properties: PlaceFeatureProperties) {
  const parts: string[] = [];

  if (properties.name) parts.push(properties.name);

  if (properties.housenumber && properties.street) {
    parts.push(`${properties.housenumber} ${properties.street}`);
  } else if (properties.street) {
    parts.push(properties.street);
  }

  if (properties.city) {
    parts.push(properties.city);
  } else if (properties.locality) {
    parts.push(properties.locality);
  }

  if (properties.state && properties.state !== properties.city) {
    parts.push(properties.state);
  }

  if (properties.country) {
    parts.push(properties.country);
  }

  return [...new Set(parts)].join(', ');
}

function buildSearchUrl({
  query,
  bbox,
  lang,
  lat,
  limit,
  locationBiasScale,
  lon,
  zoom
}: PlaceSearchOptions) {
  const url = new URL('https://photon.komoot.io/api');

  url.searchParams.set('q', query);

  if (lang) url.searchParams.set('lang', lang);
  if (limit) url.searchParams.set('limit', String(limit));
  if (bbox) url.searchParams.set('bbox', bbox.join(','));

  if (lat !== undefined && lon !== undefined) {
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lon));
  }

  if (zoom !== undefined) url.searchParams.set('zoom', String(zoom));
  if (locationBiasScale !== undefined) url.searchParams.set('location_bias_scale', String(locationBiasScale));

  return String(url);
}

/* -------------------------------------------------------------------------- */
/*  Hooks                                                                     */
/* -------------------------------------------------------------------------- */

function useDebounce<T>(value: T, delay: number = 300) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function usePlaceSearch({
  debounceMs,
  query,
  lang,
  limit,
  bbox,
  lat,
  lon,
  zoom,
  locationBiasScale
}: { debounceMs: number } & PlaceSearchOptions) {
  const [results, setResults] = useState<PlaceFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, debounceMs);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);

      return;
    }

    const abortController = new AbortController();

    async function fetchResults() {
      setIsLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const url = buildSearchUrl({
          query: debouncedQuery, lang, limit, bbox, lat, lon, zoom, locationBiasScale
        });
        const response = await fetch(url, { signal: abortController.signal });

        if (!response.ok) {
          throw new Error(`Photon API error: ${response.status} ${response.statusText}`);
        }

        const data: PlaceFeatureCollection = await response.json();
        const seen = new Set<number>();
        const dedupedFeatures = data.features.filter((feature) => {
          const id = feature.properties.osm_id;

          if (seen.has(id)) return false;
          seen.add(id);

          return true;
        });

        setResults(dedupedFeatures);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err);
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchResults();

    return () => abortController.abort();
  }, [
    debouncedQuery,
    lang,
    limit,
    bbox,
    lat,
    lon,
    zoom,
    locationBiasScale
  ]);

  return {
    results, isLoading, error, hasSearched
  };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export interface PlaceAutocompleteProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'>,
  Omit<PlaceSearchOptions, 'query'>,
  VariantProps<typeof placeAutocompleteVariants> {
  /** Debounce delay in milliseconds before triggering a search. */
  debounceMs?: number;
  /** Current input value (controlled). */
  value?: string;
  /** Initial input value (uncontrolled). */
  defaultValue?: string;
  /** Called when the input value changes. */
  onChange?: (value: string) => void;
  /** Called when a place is selected from the results. */
  onPlaceSelect?: (feature: PlaceFeature) => void;
  /** Called when the search results change. */
  onResultsChange?: (results: PlaceFeature[]) => void;
}

const PlaceAutocomplete = forwardRef<HTMLInputElement, PlaceAutocompleteProps>(
  (
    {
      className,
      variant,
      size,
      debounceMs = 300,
      lang,
      limit = 5,
      bbox,
      lat,
      lon,
      zoom,
      locationBiasScale,
      value: controlledValue,
      defaultValue = '',
      onChange: controlledOnChange,
      onPlaceSelect,
      onResultsChange,
      placeholder = 'Search places...',
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const [searchQuery, setSearchQuery] = useState('');
    const internalRef = useRef<HTMLInputElement>(null);

    const isControlled = controlledValue !== undefined;
    const displayValue = isControlled ? controlledValue : internalValue;

    const setRefs = useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    const {
      results, isLoading, error, hasSearched
    } = usePlaceSearch({
      query: searchQuery,
      debounceMs,
      lang,
      limit,
      bbox,
      lat,
      lon,
      zoom,
      locationBiasScale
    });

    useEffect(() => {
      onResultsChange?.(results);
    }, [results, onResultsChange]);

    const handleClear = useCallback(() => {
      if (!isControlled) setInternalValue('');
      setSearchQuery('');
      controlledOnChange?.('');
      internalRef.current?.focus();
    }, [isControlled, controlledOnChange]);

    const hasNoResults = hasSearched && !isLoading && !error && results.length === 0;
    const showCommandList = error || hasNoResults || results.length > 0;

    return (
      <Command
        className="h-fit overflow-visible bg-transparent"
        shouldFilter={false}
        loop>
        <div className="relative">
          <div
            className={cn(
              placeAutocompleteVariants({ variant, size }),
              showCommandList && 'rounded-b-none',
              disabled && 'pointer-events-none cursor-not-allowed opacity-50',
              className
            )}>
            <span className="shrink-0 text-muted-foreground">
              <Search className="size-4" />
            </span>
            <input
              ref={setRefs}
              type="text"
              data-slot="input"
              value={displayValue}
              onChange={(event) => {
                const newValue = event.target.value;

                if (!isControlled) setInternalValue(newValue);
                setSearchQuery(newValue);
                controlledOnChange?.(newValue);
              }}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
              {...props} />
            {isLoading && (
              <span className="shrink-0 text-muted-foreground">
                <Spinner className="size-4" />
              </span>
            )}
            {!isLoading && displayValue ? (
              <button
                type="button"
                tabIndex={-1}
                aria-label="Clear search"
                className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={handleClear}
                disabled={disabled}>
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          {showCommandList && (
            <CommandList
              data-state={showCommandList ? 'open' : 'closed'}
              className={cn(
                'bg-popover border-input absolute top-full right-0 left-0 z-50 rounded-b-md border border-t-0 shadow-md',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                'data-[state=open]:slide-in-from-top-2 data-[state=closed]:slide-out-to-top-2'
              )}>
              {error && (
                <CommandEmpty>Error: {error.message}</CommandEmpty>
              )}
              {hasNoResults && (
                <CommandEmpty>
                  No places found for &ldquo;{displayValue}&rdquo;.
                </CommandEmpty>
              )}
              {results.length > 0 && (
                <CommandGroup>
                  {results.map((feature) => {
                    const address = formatAddress(feature.properties);

                    return (
                      <CommandItem
                        key={feature.properties.osm_id}
                        value={String(feature.properties.osm_id)}
                        onSelect={() => {
                          const selected = formatAddress(feature.properties);

                          if (!isControlled) setInternalValue(selected);
                          setSearchQuery('');
                          controlledOnChange?.(selected);
                          onPlaceSelect?.(feature);
                        }}>
                        <MapPin className="size-4 shrink-0" />
                        <div className="flex flex-col items-start text-start">
                          <span className="font-medium">
                            {feature.properties.name
                              || feature.properties.street
                              || 'Unknown'}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {address}
                          </span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}
            </CommandList>
          )}
        </div>
      </Command>
    );
  }
);

PlaceAutocomplete.displayName = 'PlaceAutocomplete';

export {
  PlaceAutocomplete,
  placeAutocompleteVariants,
  formatAddress,
  type PlaceFeature,
  type PlaceFeatureProperties,
  type PlaceSearchOptions
};