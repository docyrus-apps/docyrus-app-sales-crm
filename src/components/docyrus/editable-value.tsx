'use client'

// @ts-nocheck
/* eslint-disable */
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  type Ref,
} from 'react'
import { createPortal } from 'react-dom'

import { cva, type VariantProps } from 'class-variance-authority'

import { Check, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import { DynamicFormField } from '@/components/docyrus/form-fields/dynamic-form-field'
import {
  isMultiSelectField,
  isReadOnlyField,
  isSelectField,
} from '@/components/docyrus/form-fields/lib/utils'
import {
  type EnumOption,
  type IField,
  type IFieldType,
} from '@/components/docyrus/form-fields/types'
import { DynamicValue } from '@/components/docyrus/value-renderers/dynamic-value'
const editableValueVariants = cva(
  'relative inline-flex w-full items-center rounded-md transition-colors duration-150',
  {
    variants: {
      variant: {
        default: 'border border-transparent',
        ghost: '',
      },
      size: {
        sm: 'min-h-7 px-1.5 py-0.5 text-xs',
        default: 'min-h-9 px-2 py-1 text-sm',
        lg: 'min-h-11 px-3 py-1.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

/** Pure inline input fields — blur saves, Enter saves */
const INLINE_TYPES = new Set<IFieldType>([
  'field-text',
  'field-number',
  'field-email',
  'field-password',
  'field-url',
  'field-percent',
])

/**
 * Instant-save fields — value change immediately commits and exits edit mode.
 * These are simple toggle/click fields with no intermediate editing state.
 */
const INSTANT_SAVE_TYPES = new Set<IFieldType>([
  'field-checkbox',
  'field-switch',
  'field-rating',
])

/**
 * Fields that always require explicit save + visible action buttons.
 * These have compound inputs (e.g. amount + currency) or complex
 * interactions where auto-save on blur would be premature.
 */
const EXPLICIT_SAVE_TYPES = new Set<IFieldType>([
  'field-money',
  'field-phone',
  'field-duration',
  'field-currency',
  'field-dateTime',
  'field-time',
])

/**
 * Popover/dropdown fields that portal content outside the wrapper.
 * Blur must be ignored because focus moves to the portal.
 * Compound inline fields (money, phone, duration, currency) are also
 * included here because their internal dropdowns use portals.
 */
const POPOVER_TYPES = new Set<IFieldType>([
  'field-select',
  'field-status',
  'field-radioGroup',
  'field-enum',
  'field-relation',
  'field-userSelect',
  'field-list',
  'field-multiSelect',
  'field-userMultiSelect',
  'field-tagSelect',
  'field-date',
  'field-dateTime',
  'field-time',
  'field-dateRange',
  'field-color',
  'field-icon',
  'field-locationSelect',
  'field-approvalStatus',
  'field-money',
  'field-phone',
  'field-duration',
  'field-currency',
])

const WIDE_INLINE_EDITOR_TYPES = new Set<IFieldType>([
  'field-phone',
  'field-money',
  'field-duration',
  'field-currency',
])

const FLOATING_EDITOR_MARGIN = 12

function getFloatingEditorMinWidth(fieldType: IFieldType): number {
  if (WIDE_INLINE_EDITOR_TYPES.has(fieldType)) return 320

  return 0
}

function resolveFloatingEditorStyle(
  anchor: HTMLElement | null,
  fieldType: IFieldType,
): CSSProperties | undefined {
  if (!anchor || typeof window === 'undefined') return undefined

  const rect = anchor.getBoundingClientRect()

  if (rect.width <= 0 || rect.height <= 0) return undefined

  const maxWidth = Math.max(180, window.innerWidth - FLOATING_EDITOR_MARGIN * 2)
  const minWidth = getFloatingEditorMinWidth(fieldType)
  const width = Math.min(Math.max(rect.width, minWidth), maxWidth)
  const maxLeft = window.innerWidth - FLOATING_EDITOR_MARGIN - width
  const left = Math.max(FLOATING_EDITOR_MARGIN, Math.min(rect.left, maxLeft))

  return {
    left,
    top: rect.top,
    width,
  }
}

interface ProxyFieldContextValue {
  externalForm: any
  slug: string
  flags: {
    forceExplicit: boolean
    isInstantSave: boolean
    isPopover: boolean
    isMulti: boolean
    isSingleSelect: boolean
  }
  editingValueRef: RefObject<unknown>
  onValueChangeRef: RefObject<((v: unknown) => void) | undefined>
  setEditingRef: RefObject<(v: boolean) => void>
}

const ProxyFieldContext =
  createContext<RefObject<ProxyFieldContextValue> | null>(null)

function ProxyField({
  name,
  children,
}: {
  name: string
  children: (field: any) => ReactNode
}) {
  const ctxRef = use(ProxyFieldContext)
  const ctx = ctxRef?.current
  const ExternalField = ctx?.externalForm?.Field

  if (!ctx || !ExternalField) return null

  return (
    <ExternalField name={name}>
      {(formField: any) =>
        children({
          ...formField,
          handleChange: (nextValue: unknown) => {
            formField.handleChange(nextValue)

            if (name === ctx.slug) {
              ctx.editingValueRef.current = nextValue
              const { flags } = ctx

              if (
                flags.isInstantSave ||
                (!flags.forceExplicit &&
                  (flags.isSingleSelect || (flags.isPopover && !flags.isMulti)))
              ) {
                ctx.onValueChangeRef.current?.(nextValue)
                ctx.setEditingRef.current(false)
              }
            }
          },
        })
      }
    </ExternalField>
  )
}

interface MicroFormContextValue {
  slug: string
  initialValue: unknown
  editCount: number
  record: Record<string, unknown> | undefined
  onChangeRef: RefObject<(name: string, v: unknown) => void>
}

const MicroFormContext = createContext<RefObject<MicroFormContextValue> | null>(
  null,
)

function MicroFormFieldRenderer({
  name,
  children,
}: {
  name: string
  children: (field: any) => ReactNode
}) {
  const ctxRef = use(MicroFormContext)
  const ctx = ctxRef?.current

  if (!ctx) return null

  const isMainField = name === ctx.slug
  const fieldInitialValue = isMainField
    ? ctx.initialValue
    : (ctx.record?.[name] ?? undefined)

  return (
    <MicroFormField
      key={`${ctx.editCount}-${name}`}
      slug={name}
      initialValue={fieldInitialValue}
      onChangeRef={ctx.onChangeRef}
    >
      {children}
    </MicroFormField>
  )
}

/**
 * A stable component that holds its own value state so the parent
 * micro-form object never needs to be recreated on every keystroke.
 */
function MicroFormField({
  slug,
  initialValue,
  onChangeRef,
  children,
}: {
  slug: string
  initialValue: unknown
  onChangeRef: RefObject<(name: string, v: unknown) => void>
  children: (field: any) => ReactNode
}) {
  const [localValue, setLocalValue] = useState<unknown>(initialValue)

  const handleChange = useCallback(
    (v: unknown) => {
      setLocalValue(v)
      onChangeRef.current(slug, v)
    },
    [onChangeRef, slug],
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
 * Creates a stable form object with per-field initialization.
 *
 * Main field uses `initialValue`; companion fields (e.g. `__budget_currency`)
 * are initialized from `record[name]` so currency/country selects show the
 * correct current value when entering edit mode.
 *
 * `editCount` is used as part of the React key on MicroFormField so that each
 * time edit mode is entered the fields remount with fresh values.
 */
function useMicroForm(
  slug: string,
  initialValue: unknown,
  onChangeRef: RefObject<(name: string, v: unknown) => void>,
  editCount: number,
  record: Record<string, unknown> | undefined,
) {
  const ctxRef = useRef<MicroFormContextValue>({
    slug,
    initialValue,
    editCount,
    record,
    onChangeRef,
  })

  ctxRef.current.slug = slug
  ctxRef.current.initialValue = initialValue
  ctxRef.current.editCount = editCount
  ctxRef.current.record = record
  ctxRef.current.onChangeRef = onChangeRef

  const [form] = useState(() => ({ Field: MicroFormFieldRenderer }))

  return { form, ctxRef }
}

function EditableValueActions({
  onSave,
  onCancel,
}: {
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="self-center ml-1 flex shrink-0 items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSave}
      >
        <Check className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-6"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onCancel}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}

export interface EditableValueProps
  extends
    Omit<ComponentProps<'div'>, 'children' | 'onChange'>,
    VariantProps<typeof editableValueVariants> {
  ref?: Ref<HTMLDivElement>
  /** Field configuration — determines which renderer and editor to use */
  field: IField
  /** Current value to display and edit */
  value: unknown
  /** Called when a new value is committed */
  onValueChange?: (value: unknown) => void
  /** Called when companion field values change (e.g. currency for money, country for phone) */
  onCompanionChange?: (changes: Record<string, unknown>) => void
  /** Full record for companion fields (phone country, money currency) */
  record?: Record<string, unknown>
  /** Enum options for select-based fields */
  enumOptions?: Array<EnumOption>
  /** TanStack Form instance — if provided, delegates editing to this form */
  form?: any
  /** Whether the field is disabled (prevents entering edit mode) */
  disabled?: boolean
  /** Whether the field is read-only (shows value, no hover affordance) */
  readOnly?: boolean
  /** How editability is hinted while not actively editing */
  editHint?: 'progressive' | 'visible'
  /** Custom display content — overrides DynamicValue auto-rendering */
  children?: ReactNode
  /** Show confirm/cancel buttons during editing */
  showActions?: boolean
  /** Require explicit save — blur cancels instead of saving */
  explicitSave?: boolean
  /** Controlled editing state */
  editing?: boolean
  /** Called when editing state changes */
  onEditingChange?: (editing: boolean) => void
  /** Whether change-tracking visuals should be applied */
  trackChanges?: boolean
  /** Whether this field is currently marked as changed */
  changed?: boolean
  /** App slug for dynamic enum loading */
  appSlug?: string
  /** Data source slug for dynamic enum loading */
  dataSourceSlug?: string
}

function EditableValue({
  field,
  value,
  onValueChange,
  onCompanionChange,
  record,
  enumOptions,
  form: externalForm,
  disabled,
  readOnly,
  editHint = 'progressive',
  children,
  showActions: showActionsProp,
  explicitSave: explicitSaveProp,
  editing: controlledEditing,
  onEditingChange,
  trackChanges,
  changed,
  appSlug,
  dataSourceSlug,
  variant,
  size,
  className,
  ref,
  ...props
}: EditableValueProps) {
  const anchorRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const isFieldReadOnly =
    readOnly ||
    disabled ||
    isReadOnlyField(field.type) ||
    field.readOnly === true

  const isPopover = POPOVER_TYPES.has(field.type)
  const isMulti = isMultiSelectField(field.type)
  const isSingleSelect = isPopover && isSelectField(field.type) && !isMulti

  /*
   * Multi-select and compound fields always need explicit save + actions.
   * Single-select popover fields auto-save on change (no actions needed).
   * Inline fields use the user's props (defaults: blur-to-save, no actions).
   */
  const forceExplicit = isMulti || EXPLICIT_SAVE_TYPES.has(field.type)
  const effectiveExplicitSave = forceExplicit
    ? true
    : (explicitSaveProp ?? false)
  const effectiveShowActions = forceExplicit ? true : (showActionsProp ?? false)

  const isInstantSave = INSTANT_SAVE_TYPES.has(field.type)

  const id = useId()
  const [internalEditing, setInternalEditing] = useState(false)
  const [floatingEditorStyle, setFloatingEditorStyle] =
    useState<CSSProperties>()
  const isEditing = controlledEditing ?? internalEditing

  /*
   * Tracks how many times edit mode has been entered — used as part of
   * the key to remount MicroFormField with the latest value on each edit.
   */
  const editCountRef = useRef(0)

  const setEditing = useCallback(
    (v: boolean) => {
      if (v) {
        editCountRef.current += 1
        document.dispatchEvent(
          new CustomEvent('docyrus:editable-open', { detail: { id } }),
        )
      }

      setInternalEditing(v)
      onEditingChange?.(v)
    },
    [id, onEditingChange],
  )

  const editingValueRef = useRef<unknown>(value)
  const companionChangesRef = useRef<Record<string, unknown>>({})
  const onValueChangeRef = useRef(onValueChange)
  const onCompanionChangeRef = useRef(onCompanionChange)
  const valueRef = useRef(value)

  valueRef.current = value
  onValueChangeRef.current = onValueChange
  onCompanionChangeRef.current = onCompanionChange

  useEffect(() => {
    if (!isEditing) {
      editingValueRef.current = value
    }
  }, [value, isEditing])

  useEffect(() => {
    if (isEditing) {
      editingValueRef.current = valueRef.current
      companionChangesRef.current = {}
    }
  }, [isEditing])

  useLayoutEffect(() => {
    if (!isEditing) return

    let frameId: number | null = null

    const setPosition = () => {
      setFloatingEditorStyle(
        resolveFloatingEditorStyle(anchorRef.current, field.type),
      )
    }

    const schedulePosition = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null
        setPosition()
      })
    }

    setPosition()
    window.addEventListener('resize', schedulePosition)
    window.addEventListener('scroll', schedulePosition, true)

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', schedulePosition)
      window.removeEventListener('scroll', schedulePosition, true)
    }
  }, [isEditing, field.type])

  const setEditingRef = useRef(setEditing)

  setEditingRef.current = setEditing

  const onChangeRef = useRef((name: string, v: unknown) => {
    if (name === field.slug) {
      editingValueRef.current = v
    } else {
      companionChangesRef.current = {
        ...companionChangesRef.current,
        [name]: v,
      }
    }
  })

  /*
   * Instant-save fields: change = commit + close immediately
   * Single-select popover fields: selecting a value = save + close
   * Non-multi popover fields (date pickers, etc.): selecting = save + close
   * Multi-select / explicit-save: onChange just stores, confirm button saves
   */
  useEffect(() => {
    if (
      isInstantSave ||
      (!forceExplicit && (isSingleSelect || (isPopover && !isMulti)))
    ) {
      onChangeRef.current = (name: string, v: unknown) => {
        if (name === field.slug) {
          editingValueRef.current = v
          onValueChangeRef.current?.(v)
          setEditingRef.current(false)
        } else {
          companionChangesRef.current = {
            ...companionChangesRef.current,
            [name]: v,
          }
        }
      }
    } else {
      onChangeRef.current = (name: string, v: unknown) => {
        if (name === field.slug) {
          editingValueRef.current = v
        } else {
          companionChangesRef.current = {
            ...companionChangesRef.current,
            [name]: v,
          }
        }
      }
    }
  }, [
    isInstantSave,
    forceExplicit,
    isSingleSelect,
    isPopover,
    isMulti,
    field.slug,
  ])

  /*
   * Proxy that wraps externalForm.Field's handleChange with auto-save behavior.
   * We expose the module-level `ProxyField` as the form's `Field`, and feed it
   * the needed closure (slug, flags, refs) via context so its identity stays
   * stable across renders.
   */
  const proxyFieldContextRef = useRef<ProxyFieldContextValue>({
    externalForm,
    slug: field.slug,
    flags: {
      forceExplicit,
      isInstantSave,
      isPopover,
      isMulti,
      isSingleSelect,
    },
    editingValueRef,
    onValueChangeRef,
    setEditingRef,
  })

  proxyFieldContextRef.current.externalForm = externalForm
  proxyFieldContextRef.current.slug = field.slug
  proxyFieldContextRef.current.flags = {
    forceExplicit,
    isInstantSave,
    isPopover,
    isMulti,
    isSingleSelect,
  }

  const proxyForm = externalForm ? { ...externalForm, Field: ProxyField } : null

  const { form: internalForm, ctxRef: microFormCtxRef } = useMicroForm(
    field.slug,
    value,
    onChangeRef,
    editCountRef.current,
    record,
  )
  const activeForm = proxyForm ?? internalForm

  const handleSave = useCallback(() => {
    onValueChangeRef.current?.(editingValueRef.current)

    if (Object.keys(companionChangesRef.current).length > 0) {
      onCompanionChangeRef.current?.(companionChangesRef.current)
    }

    setEditing(false)
  }, [setEditing])

  const handleCancel = useCallback(() => {
    editingValueRef.current = value
    companionChangesRef.current = {}
    setEditing(false)
  }, [value, setEditing])

  const handleClick = useCallback(() => {
    if (!isEditing && !isFieldReadOnly) {
      /*
       * Checkbox and switch are binary toggles — no edit container needed.
       * Flip the value directly so the user gets single-click UX.
       */
      if (field.type === 'field-checkbox' || field.type === 'field-switch') {
        onValueChangeRef.current?.(!(value as boolean))

        return
      }

      setEditing(true)
    }
  }, [isEditing, isFieldReadOnly, field.type, value, setEditing])

  const handleBlur = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      /*
       * Popover fields portal their content — blur fires when focus
       * moves to the popover, so we must ignore blur entirely for these.
       * Outside-click is handled by the pointerdown capture listener below.
       */
      if (isPopover) return

      const related = e.relatedTarget as Node | null

      if (wrapperRef.current?.contains(related)) {
        return
      }

      if (effectiveExplicitSave) {
        handleCancel()
      } else {
        handleSave()
      }
    },
    [isPopover, effectiveExplicitSave, handleSave, handleCancel],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleCancel()

        return
      }

      if (e.key === 'Enter' && !e.shiftKey && INLINE_TYPES.has(field.type)) {
        e.preventDefault()
        handleSave()
      }
    },
    [field.type, handleSave, handleCancel],
  )

  const handleDisplayKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    },
    [handleClick],
  )

  useEffect(() => {
    if (!isEditing || !wrapperRef.current) return

    const focusable = wrapperRef.current.querySelector<HTMLElement>(
      'input, textarea, select, button, [tabindex], [role="combobox"], [contenteditable="true"]',
    )

    focusable?.focus()

    if (!isPopover || !focusable) return

    const rafId = window.requestAnimationFrame(() => {
      focusable.click()
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [isEditing, isPopover])

  /*
   * When any other EditableValue enters edit mode, close this one.
   * Uses a document-level custom event so no shared context is needed.
   */
  const handleCancelRef = useRef(handleCancel)

  handleCancelRef.current = handleCancel

  useEffect(() => {
    if (!isEditing) return

    const handler = (e: Event) => {
      const { id: otherId } = (e as CustomEvent<{ id: string }>).detail

      if (otherId !== id) handleCancelRef.current()
    }

    document.addEventListener('docyrus:editable-open', handler)

    return () => document.removeEventListener('docyrus:editable-open', handler)
  }, [isEditing, id])

  /*
   * Popover fields portal their content outside the wrapper. The standard
   * blur-based approach doesn't work because focus moves to the portal.
   *
   * For forceExplicit compound fields (phone, money, multi-select) we skip
   * this entirely — they have Check/Cancel buttons, and registering a
   * pointerdown handler interferes with their internal popover interactions
   * (e.g. PhoneInputCountrySelect).
   *
   * For auto-save popover fields (date, single-select) we still detect
   * outside clicks to close/save.
   */
  useEffect(() => {
    if (!isEditing || !isPopover || forceExplicit) return

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement

      if (wrapperRef.current?.contains(target)) return
      if (anchorRef.current?.contains(target)) return

      if (
        target.closest?.(
          '[data-radix-popper-content-wrapper],' +
            ' [data-slot="select-content"],' +
            ' [data-slot="popover-content"]',
        )
      ) {
        return
      }

      handleCancel()
    }

    document.addEventListener('pointerdown', handlePointerDown, true)

    return () =>
      document.removeEventListener('pointerdown', handlePointerDown, true)
  }, [isEditing, isPopover, forceExplicit, handleCancel])

  if (isEditing) {
    const editor = (
      <div
        ref={(node) => {
          wrapperRef.current = node
        }}
        data-editing=""
        className={cn(
          'fixed z-[120]',
          'flex items-center rounded-md',
          'border border-ring bg-background shadow-lg',
        )}
        style={floatingEditorStyle ?? { visibility: 'hidden' }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        {/* Inline style overrides inner input borders/rings — Tailwind v4's
              **:data-[…] generates :where() with zero specificity which cannot
              reliably override component-level styles. */}
        <style>
          {`
            [data-editing] :is(
              [data-slot="input"],
              [data-slot="mask-input"],
              [data-slot="phone-input"],
              [data-slot="phone-input-field"],
              [data-slot="select-trigger"]
            ) {
              border-width: 0 !important;
              box-shadow: none !important;
              outline: none !important;
            }
            [data-editing] :is(
              [data-slot="input"],
              [data-slot="mask-input"],
              [data-slot="phone-input-field"]
            ):focus-visible {
              border-width: 0 !important;
              box-shadow: none !important;
              outline: none !important;
              --tw-ring-shadow: 0 0 #0000 !important;
            }
            [data-editing] [data-slot="phone-input"] {
              height: 36px !important;
            }
            [data-editing] [data-slot="phone-input-country-select"] {
              position: relative;
              z-index: 1;
            }
          `}
        </style>
        <div
          className={cn(
            'flex-1 min-w-0 flex items-center px-2',
            size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm',
            '**:data-[slot=field-label]:hidden',
            '**:data-[slot=field]:w-full **:data-[slot=field]:gap-0 **:data-[slot=field]:mb-0',
            '**:data-[slot=phone-input]:h-9',
          )}
        >
          <MicroFormContext value={microFormCtxRef}>
            <ProxyFieldContext value={proxyFieldContextRef}>
              <DynamicFormField
                field={field}
                form={activeForm}
                enumOptions={enumOptions}
                appSlug={appSlug}
                dataSourceSlug={dataSourceSlug}
              />
            </ProxyFieldContext>
          </MicroFormContext>
        </div>
        {effectiveShowActions && (
          <EditableValueActions onSave={handleSave} onCancel={handleCancel} />
        )}
      </div>
    )

    return (
      <div
        ref={(node) => {
          anchorRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        data-slot="editable-value"
        className={cn(
          editableValueVariants({ variant, size }),
          'relative',
          trackChanges &&
            changed &&
            'bg-amber-50 dark:bg-amber-900/20 border-s-2 border-s-amber-400',
          className,
        )}
        {...props}
      >
        {/* Invisible spacer preserving the display-mode height */}
        <div className="pointer-events-none invisible">
          {children ?? (
            <DynamicValue
              field={field}
              value={value}
              record={record}
              enumOptions={enumOptions}
            />
          )}
        </div>
        {typeof document !== 'undefined' && createPortal(editor, document.body)}
      </div>
    )
  }

  return (
    <div
      ref={(node) => {
        anchorRef.current = node
        wrapperRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      data-slot="editable-value"
      role={isFieldReadOnly ? undefined : 'button'}
      tabIndex={isFieldReadOnly ? undefined : 0}
      className={cn(
        editableValueVariants({ variant, size }),
        trackChanges &&
          changed &&
          'bg-amber-50 dark:bg-amber-900/20 border-s-2 border-s-amber-400',
        !isFieldReadOnly &&
          editHint === 'visible' &&
          'border-input bg-muted/30',
        !isFieldReadOnly && 'cursor-pointer hover:border-muted-foreground/30',
        className,
      )}
      onClick={handleClick}
      onKeyDown={handleDisplayKeyDown}
      {...props}
    >
      {children ?? (
        <DynamicValue
          field={field}
          value={value}
          record={record}
          enumOptions={enumOptions}
        />
      )}
    </div>
  )
}

export { EditableValue }
