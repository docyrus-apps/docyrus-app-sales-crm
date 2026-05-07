'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  APIProvider,
  InfoWindow,
  Map,
  Marker,
  type MapMouseEvent,
  useMap,
  useMapsLibrary,
  useMarkerRef,
} from '@vis.gl/react-google-maps'
import { ChevronDown, MapPin, Search, X } from 'lucide-react'

import { type TranslateFn, useUiTranslation } from '@/lib/use-ui-translation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Field, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'

import { FormFieldLabel } from './form-field-label'
import { type DocyrusFormFieldProps, type IField } from './types'

const GOOGLE_MAPS_LIBRARIES = ['places', 'geocoding']

type MapPosition = {
  lat: number
  lng: number
}

type MapPositionAccessor = {
  lat: () => number
  lng: () => number
}

type PlaceDetailsLike = {
  displayName?: string | null
  formattedAddress?: string | null
  location?: MapPositionAccessor | null
  fetchFields: (request: { fields: string[] }) => Promise<unknown>
}

type PlacePredictionLike = {
  placeId: string
  mainText?: { text: string } | null
  secondaryText?: { text: string } | null
  text: { text: string }
  toPlace: () => PlaceDetailsLike
}

type MarkerDragEndEvent = {
  latLng?: MapPositionAccessor | null
}

const DEFAULT_MAP_CENTER: MapPosition = {
  lat: 39.9334,
  lng: 32.8597,
}
const DEFAULT_MAP_ZOOM = 12
const FOCUSED_MAP_ZOOM = 14

type LocationFieldValue = {
  address?: string | null
  description?: string | null
  details?: string | null
  latitude?: number | string | null
  longitude?: number | string | null
  lat?: number | string | null
  lng?: number | string | null
  placeId?: string | null
}

type LocationDraft = {
  address: string
  description: string
  details: string
  latitude: number | null
  longitude: number | null
  placeId?: string | null
}

type LocationSearchResult = {
  id: string
  prediction: PlacePredictionLike
  description: string
  details: string
  text: string
}

type LocationFieldOptions = {
  inline?: boolean
  language?: string
  region?: string
  defaultZoom?: number
  defaultCenter?: {
    lat?: number | string | null
    lng?: number | string | null
    latitude?: number | string | null
    longitude?: number | string | null
  } | null
}

type FormFieldController = {
  name: string
  state: {
    value: unknown
    meta: {
      isTouched: boolean
      isValid: boolean
      errors: Array<{ message?: string } | undefined>
    }
  }
  handleChange: (value: unknown) => void
  handleBlur: () => void
}

type LocationFieldContentProps = {
  field: FormFieldController
  fieldConfig: IField
  className?: string
  disabled?: boolean
  required?: boolean
  t: TranslateFn
}

type GoogleLocationPickerProps = {
  apiKey: string
  initialValue: LocationDraft | null
  defaultCenter: MapPosition
  defaultZoom: number
  readOnly: boolean
  language?: string
  region?: string
  t: TranslateFn
  onCancel: () => void
  onSave: (value: LocationFieldValue | null) => void
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()

  return normalized.length > 0 ? normalized : null
}

function parseCoordinate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)

    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function splitAddress(address?: string | null) {
  const parts = (address ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  return {
    description: parts[0] ?? '',
    details: parts.slice(1).join(', '),
  }
}

function formatCoordinates(latitude: number | null, longitude: number | null) {
  if (latitude == null || longitude == null) {
    return null
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
}

function getLocationFieldOptions(fieldConfig: IField): LocationFieldOptions {
  const raw = fieldConfig.options

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }

  return raw as LocationFieldOptions
}

function getDefaultCenter(options: LocationFieldOptions): MapPosition {
  const latitude = parseCoordinate(
    options.defaultCenter?.latitude ?? options.defaultCenter?.lat,
  )
  const longitude = parseCoordinate(
    options.defaultCenter?.longitude ?? options.defaultCenter?.lng,
  )

  if (latitude == null || longitude == null) {
    return DEFAULT_MAP_CENTER
  }

  return {
    lat: latitude,
    lng: longitude,
  }
}

function getDefaultZoom(options: LocationFieldOptions) {
  const parsed = parseCoordinate(options.defaultZoom)

  if (parsed == null) {
    return DEFAULT_MAP_ZOOM
  }

  return parsed
}

function toLatLngLiteral(
  value: Pick<LocationDraft, 'latitude' | 'longitude'> | null | undefined,
) {
  if (value?.latitude == null || value.longitude == null) {
    return null
  }

  return {
    lat: value.latitude,
    lng: value.longitude,
  }
}

function createLocationDraft(
  value: Partial<LocationFieldValue> | null | undefined,
): LocationDraft | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const latitude = parseCoordinate(value.latitude ?? value.lat)
  const longitude = parseCoordinate(value.longitude ?? value.lng)
  const address =
    normalizeString(value.address) ??
    formatCoordinates(latitude, longitude) ??
    ''
  const addressParts = splitAddress(address)
  const description =
    normalizeString(value.description) ?? addressParts.description ?? address
  const details = normalizeString(value.details) ?? addressParts.details
  const placeId = normalizeString(value.placeId)

  if (!address && latitude == null && longitude == null) {
    return null
  }

  return {
    address,
    description,
    details,
    latitude,
    longitude,
    placeId,
  }
}

function serializeLocation(
  value: LocationDraft | null,
): LocationFieldValue | null {
  if (!value) {
    return null
  }

  const coordinates = toLatLngLiteral(value)

  return {
    address: value.address || undefined,
    description: value.description || undefined,
    details: value.details || undefined,
    placeId: value.placeId || undefined,
    latitude: coordinates?.lat,
    longitude: coordinates?.lng,
    lat: coordinates?.lat,
    lng: coordinates?.lng,
  }
}

function getLocationSignature(value: LocationDraft | null) {
  return JSON.stringify(serializeLocation(value))
}

function resolveGoogleMapsApiKey() {
  return normalizeString(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [value, delay])

  return debouncedValue
}

function ManualLocationInputs({
  value,
  onChange,
  onBlur,
  readOnly,
  t,
}: {
  value: LocationDraft | null
  onChange: (value: LocationFieldValue | null) => void
  onBlur: () => void
  readOnly: boolean
  t: TranslateFn
}) {
  const currentValue = value ?? {
    address: '',
    description: '',
    details: '',
    latitude: null,
    longitude: null,
  }

  const updateValue = (updates: Partial<LocationFieldValue>) => {
    const nextValue = createLocationDraft({
      ...serializeLocation(currentValue),
      ...updates,
    })

    onChange(serializeLocation(nextValue))
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <Label className="text-xs text-muted-foreground">
          {t('ui.formField.locationAddress', 'Address')}
        </Label>
        <Input
          value={currentValue.address}
          onChange={(event) => updateValue({ address: event.target.value })}
          onBlur={onBlur}
          disabled={readOnly}
          placeholder={t('ui.formField.locationAddress', 'Address')}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">
            {t('ui.formField.locationLatitude', 'Latitude')}
          </Label>
          <Input
            type="number"
            step="any"
            value={currentValue.latitude ?? ''}
            onChange={(event) =>
              updateValue({
                latitude:
                  event.target.value === '' ? null : Number(event.target.value),
              })
            }
            onBlur={onBlur}
            disabled={readOnly}
            placeholder={t('ui.formField.locationLatitude', 'Latitude')}
          />
        </div>
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground">
            {t('ui.formField.locationLongitude', 'Longitude')}
          </Label>
          <Input
            type="number"
            step="any"
            value={currentValue.longitude ?? ''}
            onChange={(event) =>
              updateValue({
                longitude:
                  event.target.value === '' ? null : Number(event.target.value),
              })
            }
            onBlur={onBlur}
            disabled={readOnly}
            placeholder={t('ui.formField.locationLongitude', 'Longitude')}
          />
        </div>
      </div>
    </div>
  )
}

function GoogleLocationPicker({ apiKey, ...props }: GoogleLocationPickerProps) {
  return (
    <APIProvider
      apiKey={apiKey}
      libraries={GOOGLE_MAPS_LIBRARIES}
      language={props.language}
      region={props.region}
    >
      <GoogleLocationPickerPanel {...props} />
    </APIProvider>
  )
}

function GoogleLocationPickerPanel({
  initialValue,
  defaultCenter,
  defaultZoom,
  readOnly,
  t,
  onCancel,
  onSave,
  language,
  region,
}: Omit<GoogleLocationPickerProps, 'apiKey'>) {
  const map = useMap()
  const placesLibrary = useMapsLibrary('places')
  const geocodingLibrary = useMapsLibrary('geocoding')
  const [markerRef, marker] = useMarkerRef()

  const [draft, setDraft] = useState<LocationDraft | null>(initialValue)
  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState<
    Array<LocationSearchResult>
  >([])
  const [isSearching, setIsSearching] = useState(false)
  const [isResolvingLocation, setIsResolvingLocation] = useState(false)
  const [activeSearchResultId, setActiveSearchResultId] = useState<
    string | null
  >(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [infoWindowOpen, setInfoWindowOpen] = useState(Boolean(initialValue))

  const geocoder = useMemo(
    () => (geocodingLibrary ? new geocodingLibrary.Geocoder() : null),
    [geocodingLibrary],
  )

  const skipSearchRef = useRef<string | null>(null)
  const latestInitialValueRef = useRef(initialValue)
  const debouncedSearchValue = useDebouncedValue(searchValue, 250)
  const draftLatitude = draft?.latitude ?? null
  const draftLongitude = draft?.longitude ?? null
  const draftMarkerPosition = useMemo(
    () =>
      draftLatitude == null || draftLongitude == null
        ? null
        : {
            lat: draftLatitude,
            lng: draftLongitude,
          },
    [draftLatitude, draftLongitude],
  )
  const coordinatesText = useMemo(
    () => formatCoordinates(draftLatitude, draftLongitude),
    [draftLatitude, draftLongitude],
  )
  const initialValueSignature = getLocationSignature(initialValue)
  const hasChanges = getLocationSignature(draft) !== initialValueSignature
  const canSave =
    hasChanges &&
    !isSearching &&
    !isResolvingLocation &&
    activeSearchResultId == null

  const focusMap = useCallback(
    (position: MapPosition) => {
      if (!map) {
        return
      }

      map.panTo(position)

      const currentZoom = map.getZoom() ?? defaultZoom

      if (currentZoom < FOCUSED_MAP_ZOOM) {
        map.setZoom(FOCUSED_MAP_ZOOM)
      }
    },
    [map, defaultZoom],
  )

  const applyInitialDraftState = useCallback(
    (nextInitialValue: LocationDraft | null) => {
      skipSearchRef.current = null
      setDraft(nextInitialValue)
      setInfoWindowOpen(Boolean(nextInitialValue))
      setSearchValue('')
      setSearchResults([])
      setSearchError(null)
      setIsSearching(false)
      setActiveSearchResultId(null)
      setIsResolvingLocation(false)
    },
    [],
  )

  const resetDraft = useCallback(() => {
    applyInitialDraftState(latestInitialValueRef.current)
  }, [applyInitialDraftState])

  const reverseGeocode = useCallback(
    async (position: MapPosition) => {
      const fallbackAddress =
        formatCoordinates(position.lat, position.lng) ?? ''

      if (!geocoder) {
        return createLocationDraft({
          address: fallbackAddress,
          latitude: position.lat,
          longitude: position.lng,
        })
      }

      try {
        const response = await geocoder.geocode({
          location: position,
          language,
          region,
        })
        const result = response.results[0]
        const address = result?.formatted_address ?? fallbackAddress
        const addressParts = splitAddress(address)

        return createLocationDraft({
          address,
          description: addressParts.description,
          details: addressParts.details,
          latitude: position.lat,
          longitude: position.lng,
          placeId: result?.place_id ?? null,
        })
      } catch {
        return createLocationDraft({
          address: fallbackAddress,
          latitude: position.lat,
          longitude: position.lng,
        })
      }
    },
    [geocoder, language, region],
  )

  const commitPickedPosition = useCallback(
    async (position: MapPosition | null) => {
      if (!position || readOnly) {
        return
      }

      setIsResolvingLocation(true)
      setSearchError(null)

      try {
        const nextDraft = await reverseGeocode(position)

        if (!nextDraft) {
          return
        }

        setDraft(nextDraft)
        setInfoWindowOpen(true)
        skipSearchRef.current = nextDraft.address
        setSearchValue(nextDraft.address)
        setSearchResults([])
        focusMap(position)
      } finally {
        setIsResolvingLocation(false)
      }
    },
    [focusMap, readOnly, reverseGeocode],
  )

  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      void commitPickedPosition(event.detail.latLng)
    },
    [commitPickedPosition],
  )

  const handleMarkerDragEnd = useCallback(
    (event: MarkerDragEndEvent) => {
      const position = event.latLng
        ? {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          }
        : null

      void commitPickedPosition(position)
    },
    [commitPickedPosition],
  )

  const handleSearchResultSelect = useCallback(
    async (result: LocationSearchResult) => {
      if (readOnly) {
        return
      }

      setActiveSearchResultId(result.id)
      setSearchError(null)

      try {
        const place = result.prediction.toPlace()

        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location'],
        })

        const { location } = place

        if (!location) {
          return
        }

        const position = {
          lat: location.lat(),
          lng: location.lng(),
        }
        const address = place.formattedAddress ?? result.text
        const addressParts = splitAddress(address)
        const nextDraft = createLocationDraft({
          address,
          description:
            result.description || place.displayName || addressParts.description,
          details: result.details || addressParts.details,
          latitude: position.lat,
          longitude: position.lng,
          placeId: result.id,
        })

        if (!nextDraft) {
          return
        }

        setDraft(nextDraft)
        setInfoWindowOpen(true)
        skipSearchRef.current = address
        setSearchValue(address)
        setSearchResults([])
        focusMap(position)
      } catch (error) {
        setSearchError(
          error instanceof Error
            ? error.message
            : t(
                'ui.formField.locationSelectSearchError',
                'Unable to load location details.',
              ),
        )
      } finally {
        setActiveSearchResultId(null)
      }
    },
    [focusMap, readOnly, t],
  )

  useEffect(() => {
    latestInitialValueRef.current = initialValue
  }, [initialValue])

  useEffect(() => {
    applyInitialDraftState(latestInitialValueRef.current)
  }, [applyInitialDraftState, initialValueSignature])

  useEffect(() => {
    if (!draftMarkerPosition) {
      return
    }

    focusMap(draftMarkerPosition)
  }, [draftMarkerPosition, focusMap])

  useEffect(() => {
    if (!placesLibrary) {
      return
    }

    if (!debouncedSearchValue.trim()) {
      setSearchResults((prev) => (prev.length === 0 ? prev : []))
      setSearchError(null)
      setIsSearching(false)

      return
    }

    if (skipSearchRef.current === debouncedSearchValue.trim()) {
      skipSearchRef.current = null
      setSearchResults((prev) => (prev.length === 0 ? prev : []))
      setSearchError(null)
      setIsSearching(false)

      return
    }

    let isActive = true

    const fetchSuggestions = async () => {
      setIsSearching(true)
      setSearchError(null)

      try {
        const { suggestions } =
          await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            {
              input: debouncedSearchValue.trim(),
              language,
              region,
              origin: draftMarkerPosition ?? defaultCenter,
            },
          )

        if (!isActive) {
          return
        }

        const nextResults: Array<LocationSearchResult> = []

        for (const suggestion of suggestions) {
          const prediction = suggestion.placePrediction

          if (!prediction) {
            continue
          }

          nextResults.push({
            id: prediction.placeId,
            prediction,
            description: prediction.mainText?.text ?? prediction.text.text,
            details: prediction.secondaryText?.text ?? '',
            text: prediction.text.text,
          })
        }

        setSearchResults(nextResults)
      } catch (error) {
        if (!isActive) {
          return
        }

        setSearchResults([])
        setSearchError(
          error instanceof Error
            ? error.message
            : t(
                'ui.formField.locationSelectSearchError',
                'Unable to search locations.',
              ),
        )
      } finally {
        if (isActive) {
          setIsSearching(false)
        }
      }
    }

    void fetchSuggestions()

    return () => {
      isActive = false
    }
  }, [
    debouncedSearchValue,
    defaultCenter,
    draftMarkerPosition,
    language,
    placesLibrary,
    region,
    t,
  ])

  const showSearchPanel =
    searchError || isSearching || debouncedSearchValue.trim().length > 0

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => {
              setSearchValue(event.target.value)
              setSearchError(null)
            }}
            placeholder={t(
              'ui.formField.locationSelectSearchPlaceholder',
              'Search location',
            )}
            disabled={readOnly || !placesLibrary}
            className="pr-10 pl-9"
          />
          {isSearching || isResolvingLocation || activeSearchResultId ? (
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
              <Spinner className="size-4" />
            </span>
          ) : searchValue ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
              onClick={() => {
                skipSearchRef.current = null
                setSearchValue('')
                setSearchResults([])
                setSearchError(null)
              }}
              disabled={readOnly}
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </div>

        {showSearchPanel ? (
          <div className="overflow-hidden rounded-lg border bg-popover shadow-xs">
            <ScrollArea className="max-h-56">
              <div className="divide-y">
                {searchError ? (
                  <div className="px-3 py-3 text-sm text-destructive">
                    {searchError}
                  </div>
                ) : null}

                {!searchError &&
                !isSearching &&
                debouncedSearchValue.trim() !== '' &&
                searchResults.length === 0 ? (
                  <div className="px-3 py-3 text-sm text-muted-foreground">
                    {t(
                      'ui.formField.locationSelectNoResults',
                      'No locations found.',
                    )}
                  </div>
                ) : null}

                {!searchError &&
                  searchResults.map((result) => (
                    <Button
                      key={result.id}
                      type="button"
                      variant="ghost"
                      className="h-auto w-full justify-start rounded-none px-3 py-3 text-left"
                      onClick={() => {
                        void handleSearchResultSelect(result)
                      }}
                      disabled={readOnly || activeSearchResultId != null}
                    >
                      <span className="flex w-full items-start gap-3">
                        <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-foreground">
                            {result.description}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {result.details || result.text}
                          </span>
                        </span>
                        {activeSearchResultId === result.id ? (
                          <Spinner className="size-4 shrink-0" />
                        ) : null}
                      </span>
                    </Button>
                  ))}
              </div>
            </ScrollArea>
          </div>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-xl border bg-muted/15">
        {isResolvingLocation ? (
          <div className="absolute top-3 right-3 z-10 rounded-full border bg-background/95 p-2 shadow-sm">
            <Spinner className="size-4" />
          </div>
        ) : null}

        <Map
          defaultCenter={draftMarkerPosition ?? defaultCenter}
          defaultZoom={defaultZoom}
          className="h-[420px] w-full"
          mapTypeControl={false}
          fullscreenControl
          streetViewControl={false}
          zoomControl
          gestureHandling="cooperative"
          clickableIcons={false}
          onClick={handleMapClick}
        >
          {draftMarkerPosition ? (
            <>
              <Marker
                ref={markerRef}
                position={draftMarkerPosition}
                draggable={!readOnly}
                onClick={() => setInfoWindowOpen(true)}
                onDragEnd={handleMarkerDragEnd}
              />
              {marker && draft && infoWindowOpen ? (
                <InfoWindow
                  anchor={marker}
                  onCloseClick={() => setInfoWindowOpen(false)}
                >
                  <div className="min-w-56 space-y-1.5">
                    <p className="text-sm font-semibold text-foreground">
                      {draft.description || draft.address}
                    </p>
                    {draft.details ? (
                      <p className="text-xs text-muted-foreground">
                        {draft.details}
                      </p>
                    ) : null}
                    {coordinatesText ? (
                      <p className="text-xs text-muted-foreground">
                        {coordinatesText}
                      </p>
                    ) : null}
                  </div>
                </InfoWindow>
              ) : null}
            </>
          ) : null}
        </Map>
      </div>

      <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {draft?.address ||
              t('ui.formField.locationSelectEmpty', 'No location selected')}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {coordinatesText ||
              t(
                'ui.formField.locationSelectHint',
                'Search for an address or pin a spot on the map.',
              )}
          </p>
        </div>

        {!readOnly ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                skipSearchRef.current = null
                setDraft(null)
                setInfoWindowOpen(false)
                setSearchResults([])
                setSearchError(null)
                setSearchValue('')
              }}
              disabled={!draft && !initialValue}
            >
              {t('ui.formField.locationSelectClear', 'Clear')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetDraft()
                onCancel()
              }}
              disabled={!hasChanges}
            >
              {t('ui.formField.locationSelectCancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => onSave(serializeLocation(draft))}
              disabled={!canSave}
            >
              {t('ui.formField.locationSelectSave', 'Save')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function LocationFieldContent({
  field,
  fieldConfig,
  className,
  disabled,
  required,
  t,
}: LocationFieldContentProps) {
  const [open, setOpen] = useState(false)

  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const options = getLocationFieldOptions(fieldConfig)
  const apiKey = resolveGoogleMapsApiKey()
  const inline = options.inline === true
  const readOnly = disabled || fieldConfig.readOnly === true
  const value = useMemo(
    () => createLocationDraft(field.state.value as LocationFieldValue | null),
    [field.state.value],
  )
  const valueLatitude = value?.latitude ?? null
  const valueLongitude = value?.longitude ?? null
  const coordinatesText = useMemo(
    () => formatCoordinates(valueLatitude, valueLongitude),
    [valueLatitude, valueLongitude],
  )
  const defaultCenterLatitude =
    options.defaultCenter?.latitude ?? options.defaultCenter?.lat ?? null
  const defaultCenterLongitude =
    options.defaultCenter?.longitude ?? options.defaultCenter?.lng ?? null
  const defaultCenter = useMemo(
    () =>
      getDefaultCenter({
        defaultCenter: {
          latitude: defaultCenterLatitude,
          longitude: defaultCenterLongitude,
        },
      }),
    [defaultCenterLatitude, defaultCenterLongitude],
  )
  const defaultZoom = useMemo(
    () => getDefaultZoom({ defaultZoom: options.defaultZoom }),
    [options.defaultZoom],
  )

  const commitValue = useCallback(
    (nextValue: LocationFieldValue | null) => {
      field.handleChange(nextValue)
      field.handleBlur()
    },
    [field],
  )
  const handleFallbackChange = useCallback(
    (nextValue: LocationFieldValue | null) => {
      field.handleChange(nextValue)
    },
    [field],
  )

  const triggerLabel =
    value?.address ||
    t('ui.formField.locationSelectPlaceholder', 'Select location')
  const triggerHint =
    coordinatesText ||
    t(
      'ui.formField.locationSelectHint',
      'Search for an address or pin a spot on the map.',
    )

  return (
    <Field data-invalid={isInvalid} className={className}>
      <FormFieldLabel required={required}>{fieldConfig.name}</FormFieldLabel>

      {apiKey ? (
        inline ? (
          <div className="overflow-hidden rounded-xl border bg-card">
            <GoogleLocationPicker
              apiKey={apiKey}
              initialValue={value}
              defaultCenter={defaultCenter}
              defaultZoom={defaultZoom}
              readOnly={readOnly}
              language={options.language}
              region={options.region}
              t={t}
              onCancel={() => {}}
              onSave={commitValue}
            />
          </div>
        ) : (
          <Popover open={open} onOpenChange={setOpen} modal>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'h-auto w-full justify-between rounded-xl px-4 py-3 text-left',
                  'items-start gap-3',
                  readOnly && 'cursor-default',
                )}
                disabled={readOnly}
              >
                <span className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="rounded-full bg-primary/10 p-2 text-primary">
                    <MapPin className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {triggerLabel}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {triggerHint}
                    </span>
                  </span>
                </span>
                <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[min(92vw,48rem)] p-0">
              <GoogleLocationPicker
                apiKey={apiKey}
                initialValue={value}
                defaultCenter={defaultCenter}
                defaultZoom={defaultZoom}
                readOnly={readOnly}
                language={options.language}
                region={options.region}
                t={t}
                onCancel={() => setOpen(false)}
                onSave={(nextValue) => {
                  commitValue(nextValue)
                  setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        )
      ) : (
        <ManualLocationInputs
          value={value}
          onChange={handleFallbackChange}
          onBlur={field.handleBlur}
          readOnly={readOnly}
          t={t}
        />
      )}

      {isInvalid ? <FieldError errors={field.state.meta.errors} /> : null}
    </Field>
  )
}

export function LocationSelectFormField({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
}: DocyrusFormFieldProps) {
  const { t } = useUiTranslation()

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: FormFieldController) => (
        <LocationFieldContent
          field={field}
          fieldConfig={fieldConfig}
          disabled={disabled}
          required={required}
          className={className}
          t={t}
        />
      )}
    />
  )
}
