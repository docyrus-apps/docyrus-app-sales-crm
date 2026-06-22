'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Check, ChevronsUpDown, Loader2, Plus, Search } from 'lucide-react'
import { cva } from 'class-variance-authority'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { Field, FieldError } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

import { FormFieldLabel } from './form-field-label'
import {
  flattenNestedOptions,
  getEnumDotClassName,
  getEnumDotStyle,
  getEnumIconColor,
} from './lib/utils'
import { type DocyrusFormFieldProps, type EnumOption } from './types'

export const relationCardGridVariants = cva('w-full grid', {
  variants: {
    columnCount: {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    },
  },
  defaultVariants: {
    columnCount: 1,
  },
})

export function RelationFormField(props: DocyrusFormFieldProps) {
  if (props.variant === 'card') return <RelationCardGrid {...props} />

  return <RelationDropdown {...props} />
}

function RelationDropdown({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  enumOptions = [],
  onLoadMore,
  hasMore,
  onCreateRecord,
  renderCreateForm,
  itemTemplate,
  onSearch,
}: DocyrusFormFieldProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const isNested = fieldConfig.nested === true
  const nestedByProp = fieldConfig.nestedByProp ?? 'parent'
  const mapping = fieldConfig.itemMapping

  const flatOptions = useMemo(
    () => (isNested ? flattenNestedOptions(enumOptions, nestedByProp) : null),
    [enumOptions, isNested, nestedByProp],
  )

  const debouncedQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    if (onSearch) onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])

  const getMappedValue = useCallback(
    (option: EnumOption, field: string | null | undefined) => {
      if (!field) return undefined

      return (option as unknown as Record<string, unknown>)[field] as
        | string
        | undefined
    },
    [],
  )

  const renderOptionContent = useCallback(
    (option: EnumOption, depth = 0) => {
      if (itemTemplate) return itemTemplate(option)

      const iconValue = mapping?.iconField
        ? getMappedValue(option, mapping.iconField)
        : option.icon
      const colorValue = mapping?.colorField
        ? getMappedValue(option, mapping.colorField)
        : option.color
      const imageValue = mapping?.imageField
        ? getMappedValue(option, mapping.imageField)
        : undefined
      const descriptionValue = mapping?.descriptionField
        ? getMappedValue(option, mapping.descriptionField)
        : undefined

      const iconColor = getEnumIconColor(colorValue)

      return (
        <div
          className="flex min-w-0 items-start gap-2"
          style={depth > 0 ? { paddingLeft: `${depth * 1}rem` } : undefined}
        >
          {imageValue ? (
            <Avatar size="sm" className="mt-0.5 shrink-0">
              <AvatarImage src={imageValue} />
              <AvatarFallback>
                {option.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : iconValue ? (
            <span
              className={cn('mt-0.5 shrink-0', iconColor.className)}
              style={iconColor.style}
            >
              <DocyrusIcon icon={iconValue} className="size-4" />
            </span>
          ) : colorValue ? (
            <span
              className={cn(
                'mt-1.5 size-2.5 shrink-0 rounded-full',
                getEnumDotClassName(colorValue),
              )}
              style={getEnumDotStyle(colorValue)}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <span className="truncate text-sm">{option.name}</span>
            {descriptionValue && (
              <p className="text-muted-foreground truncate text-xs">
                {descriptionValue}
              </p>
            )}
          </div>
        </div>
      )
    },
    [itemTemplate, mapping, getMappedValue],
  )

  const handleCreateSimple = useCallback(
    async (formField: any, name: string) => {
      if (!onCreateRecord || !name.trim()) return
      setCreating(true)
      try {
        const created = await onCreateRecord(name.trim())

        formField.handleChange(created.id)
        setOpen(false)
        setSearchQuery('')
      } finally {
        setCreating(false)
      }
    },
    [onCreateRecord],
  )

  const handleCreated = useCallback(
    (formField: any) => (option: EnumOption) => {
      formField.handleChange(option.id)
      setShowCreateForm(false)
      setOpen(false)
      setSearchQuery('')
    },
    [],
  )

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const currentValue = field.state.value ?? ''
        const selectedOption = enumOptions.find((o) => o.id === currentValue)

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>
            <Popover
              open={open}
              onOpenChange={(v) => {
                setOpen(v)
                if (!v) {
                  setShowCreateForm(false)
                  setSearchQuery('')
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  id={field.name}
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  aria-invalid={isInvalid}
                  onBlur={field.handleBlur}
                  disabled={disabled || fieldConfig.readOnly === true}
                  className="h-auto min-h-9 w-full justify-between"
                >
                  {selectedOption ? (
                    <span className="min-w-0 truncate">
                      {renderOptionContent(selectedOption)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Search...</span>
                  )}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-(--radix-popover-trigger-width) min-w-[18rem] max-h-[min(360px,var(--radix-popover-content-available-height))] p-0">
                {showCreateForm && renderCreateForm ? (
                  <div className="p-3">
                    {renderCreateForm({
                      onCreated: handleCreated(field),
                    })}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setShowCreateForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Command>
                    <CommandInput
                      placeholder="Search records..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No records found.</CommandEmpty>
                      <CommandGroup>
                        {flatOptions
                          ? flatOptions.map(({ option, depth }) => (
                              <CommandItem
                                key={option.id}
                                value={option.name}
                                onSelect={() => {
                                  field.handleChange(
                                    option.id === currentValue
                                      ? null
                                      : option.id,
                                  )
                                  setOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 size-4 shrink-0',
                                    currentValue === option.id
                                      ? 'opacity-100'
                                      : 'opacity-0',
                                  )}
                                />
                                {renderOptionContent(option, depth)}
                              </CommandItem>
                            ))
                          : enumOptions.map((option) => (
                              <CommandItem
                                key={option.id}
                                value={option.name}
                                onSelect={() => {
                                  field.handleChange(
                                    option.id === currentValue
                                      ? null
                                      : option.id,
                                  )
                                  setOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 size-4 shrink-0',
                                    currentValue === option.id
                                      ? 'opacity-100'
                                      : 'opacity-0',
                                  )}
                                />
                                {renderOptionContent(option)}
                              </CommandItem>
                            ))}
                        {hasMore && onLoadMore && (
                          <CommandItem
                            value="__load_more__"
                            onSelect={() => onLoadMore()}
                            className="text-muted-foreground justify-center"
                          >
                            <Loader2 className="mr-2 size-4 animate-spin opacity-50" />
                            Load more...
                          </CommandItem>
                        )}
                      </CommandGroup>
                      {(renderCreateForm || onCreateRecord) && (
                        <>
                          <CommandSeparator />
                          <CommandGroup>
                            <CommandItem
                              value="__create_new__"
                              disabled={creating}
                              onSelect={() => {
                                if (renderCreateForm) {
                                  setShowCreateForm(true)
                                } else if (onCreateRecord) {
                                  handleCreateSimple(field, searchQuery)
                                }
                              }}
                              className="text-primary"
                            >
                              {creating ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                              ) : (
                                <Plus className="mr-2 size-4" />
                              )}
                              {searchQuery.trim()
                                ? `Create "${searchQuery.trim()}"`
                                : 'Create new record'}
                            </CommandItem>
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                )}
              </PopoverContent>
            </Popover>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  )
}

function RelationCardGrid({
  field: fieldConfig,
  form,
  disabled,
  required,
  className,
  enumOptions = [],
  onLoadMore,
  hasMore,
  onCreateRecord,
  renderCreateForm,
  itemTemplate,
  columnCount = 2,
  onSearch,
  searching,
  maxHeight = '360px',
}: DocyrusFormFieldProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const isNested = fieldConfig.nested === true
  const nestedByProp = fieldConfig.nestedByProp ?? 'parent'
  const mapping = fieldConfig.itemMapping
  const isDisabled = disabled || fieldConfig.readOnly === true

  const debouncedQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    if (onSearch) onSearch(debouncedQuery)
  }, [debouncedQuery, onSearch])

  const filteredOptions = useMemo(() => {
    if (onSearch || !searchQuery.trim()) return enumOptions
    const q = searchQuery.toLowerCase()

    return enumOptions.filter((o) => o.name.toLowerCase().includes(q))
  }, [enumOptions, searchQuery, onSearch])

  const flatOptions = useMemo(
    () =>
      isNested ? flattenNestedOptions(filteredOptions, nestedByProp) : null,
    [filteredOptions, isNested, nestedByProp],
  )

  const optionsToRender = useMemo(
    () =>
      flatOptions
        ? flatOptions.map(({ option, depth }) => ({ option, depth }))
        : filteredOptions.map((option) => ({ option, depth: 0 })),
    [flatOptions, filteredOptions],
  )

  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingMoreRef = useRef(false)

  useEffect(() => {
    if (!hasMore || !onLoadMore) return

    const sentinel = sentinelRef.current

    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !loadingMoreRef.current) {
          loadingMoreRef.current = true
          onLoadMore()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [hasMore, onLoadMore])

  const prevLengthRef = useRef(enumOptions.length)

  useEffect(() => {
    if (enumOptions.length !== prevLengthRef.current) {
      loadingMoreRef.current = false
      prevLengthRef.current = enumOptions.length
    }
  }, [enumOptions.length])

  const getMappedValue = useCallback(
    (option: EnumOption, field: string | null | undefined) => {
      if (!field) return undefined

      return (option as unknown as Record<string, unknown>)[field] as
        | string
        | undefined
    },
    [],
  )

  const renderOptionContent = useCallback(
    (option: EnumOption, depth = 0) => {
      if (itemTemplate) return itemTemplate(option)

      const iconValue = mapping?.iconField
        ? getMappedValue(option, mapping.iconField)
        : option.icon
      const colorValue = mapping?.colorField
        ? getMappedValue(option, mapping.colorField)
        : option.color
      const imageValue = mapping?.imageField
        ? getMappedValue(option, mapping.imageField)
        : undefined
      const descriptionValue = mapping?.descriptionField
        ? getMappedValue(option, mapping.descriptionField)
        : undefined

      const iconColor = getEnumIconColor(colorValue)

      return (
        <div
          className="flex min-w-0 flex-1 items-start gap-2"
          style={depth > 0 ? { paddingLeft: `${depth * 1}rem` } : undefined}
        >
          {imageValue ? (
            <Avatar size="sm" className="mt-0.5 shrink-0">
              <AvatarImage src={imageValue} />
              <AvatarFallback>
                {option.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : iconValue ? (
            <span
              className={cn('mt-0.5 shrink-0', iconColor.className)}
              style={iconColor.style}
            >
              <DocyrusIcon icon={iconValue} className="size-4" />
            </span>
          ) : colorValue ? (
            <span
              className={cn(
                'mt-1.5 size-2.5 shrink-0 rounded-full',
                getEnumDotClassName(colorValue),
              )}
              style={getEnumDotStyle(colorValue)}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <span className="truncate text-sm">{option.name}</span>
            {descriptionValue && (
              <p className="text-muted-foreground truncate text-xs">
                {descriptionValue}
              </p>
            )}
          </div>
        </div>
      )
    },
    [itemTemplate, mapping, getMappedValue],
  )

  const handleCreateSimple = useCallback(
    async (formField: any, name: string) => {
      if (!onCreateRecord || !name.trim()) return
      setCreating(true)
      try {
        const created = await onCreateRecord(name.trim())

        formField.handleChange(created.id)
        setSearchQuery('')
      } finally {
        setCreating(false)
      }
    },
    [onCreateRecord],
  )

  const handleCreated = useCallback(
    (formField: any) => (option: EnumOption) => {
      formField.handleChange(option.id)
      setShowCreateForm(false)
      setSearchQuery('')
    },
    [],
  )

  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid
        const currentValue = field.state.value ?? ''

        return (
          <Field data-invalid={isInvalid} className={className}>
            <FormFieldLabel htmlFor={field.name} required={required}>
              {fieldConfig.name}
            </FormFieldLabel>

            {/* Search input */}
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
              <Input
                id={field.name}
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={field.handleBlur}
                disabled={isDisabled}
                className="pl-9"
              />
              {searching && (
                <Loader2 className="text-muted-foreground absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin" />
              )}
            </div>

            {/* Scrollable card grid */}
            <ScrollArea
              className="mt-2 rounded-md border"
              style={{ maxHeight }}
            >
              <div
                className={cn(
                  relationCardGridVariants({ columnCount }),
                  'gap-2 p-2',
                )}
              >
                {optionsToRender.map(({ option, depth }) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      field.handleChange(
                        option.id === currentValue ? null : option.id,
                      )
                    }}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                      'border-input bg-background hover:bg-accent/50',
                      'focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      currentValue === option.id &&
                        'border-primary bg-primary/5',
                    )}
                  >
                    <span
                      className={cn(
                        'relative mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                        currentValue === option.id
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground/30',
                      )}
                    >
                      {currentValue === option.id && (
                        <Check className="size-3 text-primary-foreground" />
                      )}
                    </span>
                    {renderOptionContent(option, depth)}
                  </button>
                ))}

                {/* Create new card */}
                {(renderCreateForm || onCreateRecord) && !showCreateForm && (
                  <button
                    type="button"
                    disabled={creating || isDisabled}
                    onClick={() => {
                      if (renderCreateForm) {
                        setShowCreateForm(true)
                      } else if (onCreateRecord) {
                        handleCreateSimple(field, searchQuery)
                      }
                    }}
                    className={cn(
                      'flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm transition-colors',
                      'border-input text-primary hover:bg-accent/50',
                      'focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                    )}
                  >
                    {creating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                    {searchQuery.trim()
                      ? `Create "${searchQuery.trim()}"`
                      : 'Create new record'}
                  </button>
                )}
              </div>

              {/* Inline create form */}
              {showCreateForm && renderCreateForm && (
                <div className="border-t p-3">
                  {renderCreateForm({ onCreated: handleCreated(field) })}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              {/* Empty state */}
              {optionsToRender.length === 0 && !searching && (
                <div className="text-muted-foreground flex items-center justify-center p-6 text-sm">
                  No records found.
                </div>
              )}

              {/* Sentinel for infinite scroll */}
              {hasMore && onLoadMore && (
                <div
                  ref={sentinelRef}
                  className="flex items-center justify-center p-2"
                >
                  <Loader2 className="text-muted-foreground size-4 animate-spin" />
                </div>
              )}
            </ScrollArea>

            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    />
  )
}
