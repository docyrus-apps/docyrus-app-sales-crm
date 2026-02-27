'use client'

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react'

import { RotateCcw, Save } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  ActionBar,
  ActionBarGroup,
  ActionBarSeparator,
} from '@/components/ui/action-bar'
import { Button } from '@/components/animate-ui/components/buttons/button'
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
    const sortedA = [...a].sort()
    const sortedB = [...b].sort()

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

function noop() {}

interface EditableRecordDetailContextValue {
  form: any
  fieldMap: Map<string, RecordDetailField>
  valuesRef: RefObject<Record<string, unknown>>
  changedFields: Set<string>
  handleFieldValueChange: (slug: string, value: unknown) => void
  readOnly: boolean
  disabled: boolean
  isSaving: boolean
  changedFieldCount: number
  getChanges: () => Array<FieldChange>
  handleSave: () => Promise<void>
  handleCancel: () => void
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
  onFieldChangeRef,
  resetSignal,
  children,
}: {
  slug: string
  valuesRef: RefObject<Record<string, unknown>>
  onFieldChangeRef: RefObject<(slug: string, v: unknown) => void>
  resetSignal: number
  children: (field: any) => ReactNode
}) {
  const [localValue, setLocalValue] = useState<unknown>(
    () => valuesRef.current[slug],
  )

  const lastResetRef = useRef(resetSignal)

  if (lastResetRef.current !== resetSignal) {
    lastResetRef.current = resetSignal
    setLocalValue(valuesRef.current[slug])
  }

  const handleChange = useCallback(
    (v: unknown) => {
      setLocalValue(v)
      valuesRef.current[slug] = v
      onFieldChangeRef.current(slug, v)
    },
    [slug, valuesRef, onFieldChangeRef],
  )

  return (
    <>
      {children({
        name: slug,
        state: {
          value: localValue,
          meta: { isTouched: false, isValid: true, errors: [] },
        },
        handleChange,
        handleBlur: () => {},
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
  onFieldChangeRef: RefObject<(slug: string, v: unknown) => void>,
) {
  const valuesRef = useRef<Record<string, unknown>>({ ...record })
  const resetSignalRef = useRef(0)
  const [, forceUpdate] = useState(0)

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
        onFieldChangeRef={onFieldChangeRef}
        resetSignal={resetSignalRef.current}
      >
        {children}
      </MacroFormField>
    ),
  }))

  const resetForm = useCallback((newValues: Record<string, unknown>) => {
    valuesRef.current = { ...newValues }
    resetSignalRef.current += 1
    forceUpdate((n) => n + 1)
  }, [])

  return { form, valuesRef, resetForm }
}

function EditableRecordDetailActionBar({
  changedFieldCount,
  getChanges,
  onSave,
  onDiscard,
  sideOffset = 16,
  isSaving,
}: {
  changedFieldCount: number
  getChanges: () => Array<FieldChange>
  onSave: () => Promise<void>
  onDiscard: () => void
  sideOffset?: number
  isSaving: boolean
}) {
  const [popoverOpen, setPopoverOpen] = useState(false)

  const onSaveClick = useCallback(async () => {
    await onSave()
  }, [onSave])

  const changes = useMemo(
    () => getChanges(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- changedFieldCount triggers re-derive
    [getChanges, changedFieldCount],
  )

  return (
    <ActionBar open onOpenChange={noop} sideOffset={sideOffset}>
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

/**
 * Access the EditableRecordDetail context from within the provider.
 * Returns form, values, change tracking state, and save/cancel handlers.
 */
export function useEditableRecordDetail() {
  const ctx = useContext(EditableRecordDetailContext)

  if (!ctx) {
    throw new Error(
      'useEditableRecordDetail must be used within <EditableRecordDetail>',
    )
  }

  return {
    form: ctx.form,
    values: ctx.valuesRef.current,
    changedFields: ctx.changedFields,
    changedFieldCount: ctx.changedFieldCount,
    isFieldChanged: (slug: string) => ctx.changedFields.has(slug),
    getFieldValue: (slug: string) => ctx.valuesRef.current[slug],
    getChanges: ctx.getChanges,
    handleSave: ctx.handleSave,
    handleCancel: ctx.handleCancel,
    isSaving: ctx.isSaving,
  }
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
> {
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
const EditableRecordDetailField = forwardRef<
  HTMLDivElement,
  EditableRecordDetailFieldProps
>(({ slug, label, showLabel = true, className, ...props }, ref) => {
  const ctx = useContext(EditableRecordDetailContext)

  if (!ctx) {
    throw new Error(
      'EditableRecordDetailField must be used within <EditableRecordDetail>',
    )
  }

  const config = ctx.fieldMap.get(slug)

  if (!config) return null

  const {
    field,
    enumOptions,
    readOnly: fieldReadOnly,
    appSlug,
    dataSourceSlug,
  } = config

  const isChanged = ctx.changedFields.has(slug)
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
      readOnly={ctx.readOnly || fieldReadOnly}
      disabled={ctx.disabled}
      appSlug={appSlug}
      dataSourceSlug={dataSourceSlug}
      className={cn(
        isChanged &&
          'bg-amber-50 dark:bg-amber-900/20 border-s-2 border-s-amber-400',
        !showLabel && className,
      )}
      {...props}
    />
  )

  if (!showLabel) return editableValue

  return (
    <div ref={ref} className={cn('flex items-center gap-4', className)}>
      <span className="w-32 shrink-0 text-sm text-muted-foreground">
        {label ?? field.name}
      </span>
      {editableValue}
    </div>
  )
})

EditableRecordDetailField.displayName = 'EditableRecordDetailField'

export interface EditableRecordDetailProps extends Omit<
  ComponentProps<'div'>,
  'children'
> {
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
  /** Side offset for the floating action bar */
  actionBarSideOffset?: number
  /** Content */
  children: ReactNode
}

const EditableRecordDetail = forwardRef<
  HTMLDivElement,
  EditableRecordDetailProps
>(
  (
    {
      fields,
      record,
      onSave,
      onCancel,
      form: externalForm,
      readOnly = false,
      disabled = false,
      actionBarSideOffset,
      children,
      className,
      ...props
    },
    ref,
  ) => {
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

    const [changedFields, setChangedFields] = useState<Set<string>>(new Set())

    const [isSaving, setIsSaving] = useState(false)
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
      },
      [],
    )

    const onFieldChangeRef = useRef(handleFieldValueChange)

    onFieldChangeRef.current = handleFieldValueChange

    const {
      form: internalForm,
      valuesRef,
      resetForm,
    } = useMacroForm(record, onFieldChangeRef)

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

    const handleSave = useCallback(async () => {
      setIsSaving(true)

      try {
        const changes = getChanges()

        await onSaveRef.current?.(changes, { ...valuesRef.current })

        originalValuesRef.current = { ...valuesRef.current }
        setChangedFields(new Set())
      } finally {
        setIsSaving(false)
      }
    }, [getChanges, valuesRef])

    const handleCancel = useCallback(() => {
      resetForm(originalValuesRef.current)
      setChangedFields(new Set())
      onCancelRef.current?.()
    }, [resetForm])

    const changedFieldCount = changedFields.size

    const ctxValue = useMemo<EditableRecordDetailContextValue>(
      () => ({
        form: activeForm,
        fieldMap,
        valuesRef,
        changedFields,
        handleFieldValueChange,
        readOnly,
        disabled,
        isSaving,
        changedFieldCount,
        getChanges,
        handleSave,
        handleCancel,
      }),
      [
        activeForm,
        fieldMap,
        valuesRef,
        changedFields,
        handleFieldValueChange,
        readOnly,
        disabled,
        isSaving,
        changedFieldCount,
        getChanges,
        handleSave,
        handleCancel,
      ],
    )

    return (
      <EditableRecordDetailContext value={ctxValue}>
        <div
          ref={ref}
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
          />
        )}
      </EditableRecordDetailContext>
    )
  },
)

EditableRecordDetail.displayName = 'EditableRecordDetail'

export { EditableRecordDetail, EditableRecordDetailField }
