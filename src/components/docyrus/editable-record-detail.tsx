'use client'

// @ts-nocheck
/* eslint-disable */
import {
  createContext,
  useCallback,
  use,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ComponentRef,
  type ComponentProps,
  type ReactNode,
  type RefObject,
  type Ref,
} from 'react'

import { RotateCcw, Save } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  ActionBar,
  ActionBarGroup,
  ActionBarSeparator,
} from '@/components/ui/action-bar'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'

import {
  EditableValue,
  type EditableValueProps,
} from '@/components/docyrus/editable-value'
import {
  type EnumOption,
  type IField,
} from '@/components/docyrus/form-fields/types'

export interface RecordDetailField {
  /** Field configuration */
  field: IField
  /** Enum options for select-based fields */
  enumOptions?: Array<EnumOption>
  /** Whether this field is read-only */
  readOnly?: boolean
  /** Whether this field is required. Accepts a boolean or a function that receives current values. */
  required?: boolean | ((values: Record<string, unknown>) => boolean)
  /** Whether this field should be hidden. Accepts a boolean or a function that receives current values. */
  hidden?: boolean | ((values: Record<string, unknown>) => boolean)
  /** App slug for dynamic enum loading */
  appSlug?: string
  /** Data source slug for dynamic enum loading */
  dataSourceSlug?: string
}

export interface FieldChange {
  fieldSlug: string
  fieldName: string
  originalValue: unknown
  newValue: unknown
}

function valuesEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (a == null && b == null) return true
  if (a == null || b == null) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    const sortedA = a.toSorted()
    const sortedB = b.toSorted()

    return sortedA.every((v, i) => Object.is(v, sortedB[i]))
  }

  if (typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b)
  }

  return false
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(String).join(', ')

  return JSON.stringify(value)
}

function isEmpty(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0

  return false
}

function noop() {}

interface EditableRecordDetailContextValue {
  form: any
  fieldMap: Map<string, RecordDetailField>
  valuesRef: RefObject<Record<string, unknown>>
  changedFields: Set<string>
  validationErrors: Map<string, string>
  trackChanges: boolean
  handleFieldValueChange: (slug: string, value: unknown) => void
  readOnly: boolean
  disabled: boolean
  isSaving: boolean
  changedFieldCount: number
  valuesVersion: number
  getChanges: () => Array<FieldChange>
  handleSave: () => Promise<void>
  handleCancel: () => void
  setFieldValue: (slug: string, value: unknown) => void
}

const EditableRecordDetailContext =
  createContext<EditableRecordDetailContextValue | null>(null)

/**
 * A stable per-field component that holds its own value state.
 * Mirrors the MicroFormField pattern from EditableValue.
 */
function MacroFormField({
  slug,
  valuesRef,
  resetSignal,
  onFieldChange,
  validationErrors,
  valuesVersion,
  children,
}: {
  slug: string
  valuesRef: RefObject<Record<string, unknown>>
  resetSignal: number
  onFieldChange?: (slug: string, value: unknown) => void
  validationErrors: Map<string, string>
  valuesVersion: number
  children: (field: any) => ReactNode
}) {
  const [localValue, setLocalValue] = useState<unknown>(
    () => valuesRef.current[slug],
  )
  const [touched, setTouched] = useState(false)

  const lastResetRef = useRef(resetSignal)

  if (lastResetRef.current !== resetSignal) {
    lastResetRef.current = resetSignal
    setLocalValue(valuesRef.current[slug])
    setTouched(false)
  }

  const handleChange = useCallback(
    (v: unknown) => {
      setLocalValue(v)
      setTouched(true)
      valuesRef.current[slug] = v
      onFieldChange?.(slug, v)
    },
    [slug, valuesRef, onFieldChange],
  )

  const handleBlur = useCallback(() => {
    setTouched(true)
  }, [])

  void valuesVersion
  const error = validationErrors.get(slug)
  const hasError = error != null

  return (
    <>
      {children({
        name: slug,
        state: {
          value: localValue,
          meta: {
            isTouched: touched || hasError,
            isValid: !hasError,
            errors: hasError ? [{ message: error }] : [],
          },
        },
        handleChange,
        handleBlur,
      })}
    </>
  )
}

/**
 * Creates a stable multi-field form object matching the TanStack Form
 * `form.Field` duck-typed API. Each field slug gets its own
 * MacroFormField component with local state.
 */
function useMacroForm(
  record: Record<string, unknown>,
  onFieldChange?: (slug: string, value: unknown) => void,
  validationErrors?: Map<string, string>,
  valuesVersion?: number,
) {
  const valuesRef = useRef<Record<string, unknown>>({ ...record })
  const resetSignalRef = useRef(0)
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0) as [
    number,
    () => void,
  ]
  const onFieldChangeRef = useRef(onFieldChange)
  const validationErrorsRef = useRef<Map<string, string>>(
    validationErrors ?? new Map(),
  )
  const valuesVersionRef = useRef(valuesVersion ?? 0)

  onFieldChangeRef.current = onFieldChange
  validationErrorsRef.current = validationErrors ?? new Map()
  valuesVersionRef.current = valuesVersion ?? 0

  /*
   * Stable `form.Field` wrapper — frozen via useState so its component
   * identity doesn't change across renders. See use-docyrus-form-view for
   * the matching pattern; the lint rule's "no nested component" check
   * doesn't apply because the closure target IS the stable identity.
   */
  const [form] = useState(() => ({
    Field: ({
      name,
      children,
    }: {
      name: string
      children: (field: any) => ReactNode
    }) => (
      <MacroFormField
        slug={name}
        valuesRef={valuesRef}
        resetSignal={resetSignalRef.current}
        onFieldChange={onFieldChangeRef.current}
        validationErrors={validationErrorsRef.current}
        valuesVersion={valuesVersionRef.current}
      >
        {children}
      </MacroFormField>
    ),
  }))

  const resetForm = useCallback((newValues: Record<string, unknown>) => {
    valuesRef.current = { ...newValues }
    resetSignalRef.current += 1
    forceUpdate()
  }, [])

  const setFieldValue = useCallback((slug: string, value: unknown) => {
    valuesRef.current[slug] = value
    resetSignalRef.current += 1
    forceUpdate()
  }, [])

  return {
    form,
    valuesRef,
    resetForm,
    setFieldValue,
  }
}

function EditableRecordDetailActionBar({
  changedFieldCount,
  getChanges,
  onSave,
  onDiscard,
  sideOffset = 16,
  isSaving,
  portalContainer,
}: {
  changedFieldCount: number
  getChanges: () => Array<FieldChange>
  onSave: () => Promise<void>
  onDiscard: () => void
  sideOffset?: number
  isSaving: boolean
  portalContainer?: Element | DocumentFragment | null
}) {
  const [popoverOpen, setPopoverOpen] = useState(false)

  const onSaveClick = useCallback(async () => {
    await onSave()
  }, [onSave])

  const changes = useMemo(
    () => (changedFieldCount === 0 ? [] : getChanges()),
    [getChanges, changedFieldCount],
  )

  return (
    <ActionBar
      open
      onOpenChange={noop}
      sideOffset={sideOffset}
      portalContainer={portalContainer}
    >
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="rounded-sm px-2 py-1 text-sm font-medium tabular-nums underline decoration-dotted underline-offset-4 hover:decoration-solid"
          >
            {changedFieldCount} {changedFieldCount === 1 ? 'field' : 'fields'}{' '}
            changed
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          className="max-h-72 w-80 overflow-y-auto p-0"
        >
          <PopoverHeader className="sticky top-0 z-10 border-b bg-popover px-3 py-2">
            <PopoverTitle>Pending Changes</PopoverTitle>
          </PopoverHeader>
          <div className="divide-y">
            {changes.map((change) => (
              <div
                key={change.fieldSlug}
                className="flex items-center gap-1.5 px-3 py-2 text-xs"
              >
                <span className="shrink-0 font-medium">
                  {change.fieldName}:
                </span>
                <span
                  className="max-w-20 truncate text-muted-foreground line-through"
                  title={formatValue(change.originalValue)}
                >
                  {formatValue(change.originalValue) || '(empty)'}
                </span>
                <span className="shrink-0 text-muted-foreground">&rarr;</span>
                <span
                  className="max-w-20 truncate text-foreground"
                  title={formatValue(change.newValue)}
                >
                  {formatValue(change.newValue) || '(empty)'}
                </span>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <ActionBarSeparator />
      <ActionBarGroup>
        <Button variant="ghost" size="sm" onClick={onDiscard}>
          <RotateCcw className="size-3.5" />
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onSaveClick}
          disabled={isSaving}
        >
          <Save className="size-3.5" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </ActionBarGroup>
    </ActionBar>
  )
}

export interface EditableRecordDetailFieldProps extends Omit<
  EditableValueProps,
  | 'field'
  | 'value'
  | 'form'
  | 'onValueChange'
  | 'enumOptions'
  | 'appSlug'
  | 'dataSourceSlug'
  | 'record'
  | 'trackChanges'
  | 'changed'
> {
  ref?: Ref<HTMLDivElement>
  /** Field slug — looks up config from context */
  slug: string
  /** Optional label override */
  label?: ReactNode
  /** Render label + value row. Default: true */
  showLabel?: boolean
}

/**
 * Pre-wired EditableValue that reads field config, form, and change state
 * from the EditableRecordDetail context. Renders a label + value row
 * unless showLabel is false.
 */
function EditableRecordDetailField({
  slug,
  label,
  showLabel = true,
  className,
  ref,
  ...props
}: EditableRecordDetailFieldProps) {
  const ctx = use(EditableRecordDetailContext)

  if (!ctx) {
    throw new Error(
      'EditableRecordDetailField must be used within <EditableRecordDetail>',
    )
  }

  const config = ctx.fieldMap.get(slug)

  if (!config) return null

  void ctx.valuesVersion

  const isHidden =
    typeof config.hidden === 'function'
      ? config.hidden(ctx.valuesRef.current)
      : config.hidden

  if (isHidden) return null

  const {
    field,
    enumOptions,
    readOnly: fieldReadOnly,
    appSlug,
    dataSourceSlug,
  } = config

  const isChanged = ctx.changedFields.has(slug)
  const validationError = ctx.validationErrors.get(slug)
  const value = ctx.valuesRef.current[slug]

  const editableValue = (
    <EditableValue
      ref={showLabel ? undefined : ref}
      field={field}
      value={value}
      form={ctx.form}
      onValueChange={(v) => ctx.handleFieldValueChange(slug, v)}
      enumOptions={enumOptions}
      record={ctx.valuesRef.current}
      trackChanges={ctx.trackChanges}
      changed={isChanged}
      readOnly={ctx.readOnly || fieldReadOnly}
      editHint={ctx.readOnly || fieldReadOnly ? 'progressive' : 'visible'}
      disabled={ctx.disabled}
      appSlug={appSlug}
      dataSourceSlug={dataSourceSlug}
      className={cn(!showLabel && className)}
      {...props}
    />
  )

  if (!showLabel) return editableValue

  const isEditable = !ctx.readOnly && !fieldReadOnly && !ctx.disabled

  return (
    <div
      ref={ref}
      className={cn('rounded-md px-2 py-1.5 transition-colors', className)}
    >
      <div
        className={cn(
          'flex items-center gap-4',
          isEditable && 'cursor-pointer hover:bg-muted/50 rounded-md',
          isChanged && 'bg-amber-50/50 dark:bg-amber-950/20',
          validationError && 'ring-1 ring-destructive/40 rounded-md',
        )}
      >
        <span className="w-32 shrink-0 text-sm text-muted-foreground">
          {label ?? field.name}
          {(typeof config.required === 'function'
            ? config.required(ctx.valuesRef.current)
            : config.required) && (
            <span className="ml-0.5 text-destructive">*</span>
          )}
        </span>
        {editableValue}
      </div>
      {validationError && (
        <p className="mt-1 pl-[calc(8rem+16px)] text-xs text-destructive">
          {validationError}
        </p>
      )}
    </div>
  )
}

export interface EditableRecordDetailProps extends Omit<
  ComponentProps<'div'>,
  'children'
> {
  ref?: Ref<HTMLDivElement>
  /** Field configurations */
  fields: Array<RecordDetailField>
  /** Current record values keyed by field slug */
  record: Record<string, unknown>
  /** Called when save is triggered */
  onSave?: (
    changes: Array<FieldChange>,
    values: Record<string, unknown>,
  ) => void | Promise<void>
  /** Called when cancel is triggered */
  onCancel?: () => void
  /** External TanStack Form instance — skips internal macro-form */
  form?: any
  /** Whether all fields are read-only */
  readOnly?: boolean
  /** Whether all fields are disabled */
  disabled?: boolean
  /** Whether changed fields should be visually highlighted */
  trackChanges?: boolean
  /** Side offset for the floating action bar */
  actionBarSideOffset?: number
  /** Content */
  children: ReactNode
}

function EditableRecordDetail({
  fields,
  record,
  onSave,
  onCancel,
  form: externalForm,
  readOnly = false,
  disabled = false,
  trackChanges = true,
  actionBarSideOffset,
  children,
  className,
  ref,
  ...props
}: EditableRecordDetailProps) {
  const containerRef = useRef<ComponentRef<'div'>>(null)

  const fieldMap = useMemo(() => {
    const map = new Map<string, RecordDetailField>()

    for (const entry of fields) {
      map.set(entry.field.slug, entry)
    }

    return map
  }, [fields])

  const originalValuesRef = useRef<Record<string, unknown>>({
    ...record,
  })

  const [changedFields, setChangedFields] = useState<Set<string>>(
    () => new Set(),
  )

  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Map<string, string>>(
    () => new Map(),
  )
  const onSaveRef = useRef(onSave)
  const onCancelRef = useRef(onCancel)

  onSaveRef.current = onSave
  onCancelRef.current = onCancel

  const handleFieldValueChange = useCallback(
    (slug: string, newValue: unknown) => {
      const original = originalValuesRef.current[slug]

      setChangedFields((prev) => {
        const next = new Set(prev)

        if (valuesEqual(original, newValue)) {
          next.delete(slug)
        } else {
          next.add(slug)
        }

        return next
      })

      setValidationErrors((prev) => {
        if (!prev.has(slug)) return prev
        const next = new Map(prev)

        next.delete(slug)

        return next
      })
    },
    [],
  )

  const [valuesVersion, setValuesVersion] = useState(0)

  const onFieldChange = useCallback(
    (slug: string, value: unknown) => {
      handleFieldValueChange(slug, value)
      setValuesVersion((v) => v + 1)
    },
    [handleFieldValueChange],
  )

  const {
    form: internalForm,
    valuesRef,
    resetForm,
    setFieldValue: macroSetFieldValue,
  } = useMacroForm(record, onFieldChange, validationErrors, valuesVersion)

  const setFieldValue = useCallback(
    (slug: string, value: unknown) => {
      macroSetFieldValue(slug, value)
      setValuesVersion((v) => v + 1)
    },
    [macroSetFieldValue],
  )

  const activeForm = externalForm ?? internalForm

  const getChanges = useCallback((): Array<FieldChange> => {
    const changes: Array<FieldChange> = []

    for (const slug of changedFields) {
      const config = fieldMap.get(slug)

      if (!config) continue

      changes.push({
        fieldSlug: slug,
        fieldName: config.field.name,
        originalValue: originalValuesRef.current[slug],
        newValue: valuesRef.current[slug],
      })
    }

    return changes
  }, [changedFields, fieldMap, valuesRef])

  const validate = useCallback((): boolean => {
    const errors = new Map<string, string>()
    const currentValues = valuesRef.current

    for (const [slug, config] of fieldMap) {
      if (config.readOnly) continue

      const isHidden =
        typeof config.hidden === 'function'
          ? config.hidden(currentValues)
          : config.hidden

      if (isHidden) continue

      const isRequired =
        typeof config.required === 'function'
          ? config.required(currentValues)
          : config.required

      if (!isRequired) continue

      const value = currentValues[slug]

      if (isEmpty(value)) {
        errors.set(slug, `${config.field.name} is required`)
      }
    }

    setValidationErrors(errors)

    return errors.size === 0
  }, [fieldMap, valuesRef])

  const handleSave = useCallback(async () => {
    if (!validate()) return

    setIsSaving(true)

    try {
      const changes = getChanges()

      await onSaveRef.current?.(changes, { ...valuesRef.current })

      originalValuesRef.current = { ...valuesRef.current }
      setChangedFields(new Set())
      setValidationErrors(new Map())
    } finally {
      setIsSaving(false)
    }
  }, [getChanges, valuesRef, validate])

  const handleCancel = useCallback(() => {
    resetForm(originalValuesRef.current)
    setChangedFields(new Set())
    setValidationErrors(new Map())
    onCancelRef.current?.()
  }, [resetForm])

  const changedFieldCount = changedFields.size

  const ctxValue = useMemo<EditableRecordDetailContextValue>(
    () => ({
      form: activeForm,
      fieldMap,
      valuesRef,
      changedFields,
      validationErrors,
      trackChanges,
      handleFieldValueChange,
      readOnly,
      disabled,
      isSaving,
      changedFieldCount,
      valuesVersion,
      getChanges,
      handleSave,
      handleCancel,
      setFieldValue,
    }),
    [
      activeForm,
      fieldMap,
      valuesRef,
      changedFields,
      validationErrors,
      trackChanges,
      handleFieldValueChange,
      readOnly,
      disabled,
      isSaving,
      changedFieldCount,
      valuesVersion,
      getChanges,
      handleSave,
      handleCancel,
      setFieldValue,
    ],
  )

  return (
    <EditableRecordDetailContext value={ctxValue}>
      <div
        ref={(node) => {
          containerRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        data-slot="editable-record-detail"
        className={cn('relative w-full', className)}
        {...props}
      >
        {children}
      </div>
      {changedFieldCount > 0 && (
        <EditableRecordDetailActionBar
          changedFieldCount={changedFieldCount}
          getChanges={getChanges}
          onSave={handleSave}
          onDiscard={handleCancel}
          sideOffset={actionBarSideOffset}
          isSaving={isSaving}
          portalContainer={containerRef.current}
        />
      )}
    </EditableRecordDetailContext>
  )
}

export { EditableRecordDetail, EditableRecordDetailField }
