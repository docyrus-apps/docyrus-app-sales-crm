// @ts-nocheck
/* eslint-disable */
import { type ReactNode } from 'react'

export type IFieldType =
  | 'field-text'
  | 'field-textarea'
  | 'field-email'
  | 'field-password'
  | 'field-phone'
  | 'field-url'
  | 'field-color'
  | 'field-icon'
  | 'field-currency'
  | 'field-display'
  | 'field-htmlEditor'
  | 'field-emailEditor'
  | 'field-codeEditor'
  | 'field-markdown'
  | 'field-formula'
  | 'field-relatedField'
  | 'field-enum'
  | 'field-code'
  | 'field-button'
  | 'field-number'
  | 'field-money'
  | 'field-percent'
  | 'field-duration'
  | 'field-rating'
  | 'field-identity'
  | 'field-autonumber'
  | 'field-checkbox'
  | 'field-switch'
  | 'field-date'
  | 'field-dateTime'
  | 'field-time'
  | 'field-dateRange'
  | 'field-select'
  | 'field-radioGroup'
  | 'field-status'
  | 'field-relation'
  | 'field-userSelect'
  | 'field-multiSelect'
  | 'field-tagSelect'
  | 'field-userMultiSelect'
  | 'field-json'
  | 'field-jsonSchema'
  | 'field-jsonata'
  | 'field-handlebars'
  | 'field-dsql'
  | 'field-adaptiveCard'
  | 'field-file'
  | 'field-image'
  | 'field-avatar'
  | 'field-docEditor'
  | 'field-inlineData'
  | 'field-inlineForm'
  | 'field-taskList'
  | 'field-approvalStatus'
  | 'field-locationSelect'
  | 'field-list'
  | 'field-todo'
  | 'field-conversationChannel'
  | 'field-queryBuilder'
  | 'field-dynamic'
  | 'field-schema'
  | 'field-schemaRepeater'
  | 'field-fileStorageFolder'
  | 'field-systemEnum'
  | 'field-systemBuffer'
  | 'field-systemVector'
  | 'field-systemTextArray'
  | 'field-systemUuidArray'

export type CustomValidationRule = {
  id: string
  expression: string
  message: string
}

/**
 * Computed boolean formula stored on a field. Can be:
 * - A Query Builder JSON object (RuleGroupType from react-querybuilder) — converted to JSONata at evaluation time
 * - A direct JSONata boolean expression string
 * - null (no formula)
 */
export type ComputedBooleanFormula =
  | string
  | { id?: string; combinator: string; rules: Array<unknown> }
  | null

/*
 * ---------------------------------------------------------------------------
 * Field Actions — imperative steps that run when a trigger fires
 * ---------------------------------------------------------------------------
 */

/** A single imperative step produced by an action block */
export type FieldActionStep =
  | { method: 'setFieldValue'; fieldSlug: string; value: unknown }
  | {
      method: 'setFieldValues'
      fields: Array<{ fieldSlug: string; value: unknown }>
    }
  | { method: 'clearFieldValue'; fieldSlug: string }
  | { method: 'showField'; fieldSlug: string }
  | { method: 'hideField'; fieldSlug: string }
  | { method: 'setFieldRequired'; fieldSlug: string; required: boolean }
  | { method: 'setFieldDisabled'; fieldSlug: string; disabled: boolean }
  | { method: 'setFieldReadOnly'; fieldSlug: string; readOnly: boolean }

/** Condition format — same as ComputedBooleanFormula (QB JSON or JSONata string) */
export type FieldActionCondition = ComputedBooleanFormula

/** One if-branch inside a block: condition is true → run actions */
export interface FieldActionBlockItem {
  id: string
  condition: FieldActionCondition
  actions: FieldActionStep[]
}

/**
 * A named block with if / else-if / else semantics plus unconditional steps.
 * conditionalItems are evaluated in order; the first truthy condition wins.
 */
export interface FieldActionBlock {
  id: string
  name?: string
  sortOrder: number
  /** if / else-if branches — evaluated top-to-bottom, first match wins */
  conditionalItems: FieldActionBlockItem[]
  /** else branch — runs when no conditionalItem matched */
  elseActions: FieldActionStep[]
  /** always runs after conditional logic, regardless of which branch fired */
  unconditionalActions: FieldActionStep[]
}

/** A single field action: trigger + ordered blocks */
export interface FieldAction {
  id: string
  name?: string
  triggerType: 'onFieldChange'
  blocks: FieldActionBlock[]
}

/** Per-field property overrides accumulated by action execution */
export interface FieldActionPropertyOverrides {
  hidden?: boolean
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
}

/*
 * ---------------------------------------------------------------------------
 * Form-Level Actions — trigger on form lifecycle events (not field-specific)
 * ---------------------------------------------------------------------------
 */

export type FormActionTriggerType =
  | 'onFormLoad'
  | 'onFormBeforeSubmit'
  | 'onFormAfterSubmit'

/**
 * A form-level action: fires on a lifecycle event and runs ordered blocks.
 * Uses the same FieldActionBlock structure as field actions.
 * backend mapping: tenant_form_action with trigger_source_field_id = null
 */
export interface FormAction {
  id: string
  name?: string
  triggerType: FormActionTriggerType
  blocks: FieldActionBlock[]
}

/*
 * ---------------------------------------------------------------------------
 * Form-Level Custom Validation
 * ---------------------------------------------------------------------------
 */

/**
 * A form-level validation rule evaluated on submit (after field validations).
 * expression must return true for the form to be valid.
 * On failure the message is shown in a banner at the top of the form.
 */
export interface FormCustomValidationRule {
  id: string
  /** JSONata expression or QB JSON — must return true for validation to pass. */
  expression: string
  message: string
}

export interface IField {
  id: string
  name: string
  slug: string
  type: IFieldType
  defaultValue?: string | null
  validations?: Array<string> | null
  readOnly?: boolean | null
  options?: Record<string, unknown> | null
  relationDataSourceId?: string | null
  avatarMapping?: {
    iconField?: string | null
    colorField?: string | null
    imageField?: string | null
  } | null
  /** Whether enum options should be displayed as a nested tree */
  nested?: boolean | null
  /** The property on EnumOption used for parent reference (defaults to 'parent') */
  nestedByProp?: string | null
  /** Mapping for custom item rendering in relation/select fields */
  itemMapping?: {
    iconField?: string | null
    colorField?: string | null
    imageField?: string | null
    descriptionField?: string | null
  } | null
  /** QB JSON or JSONata expression — true → field is hidden */
  computedHidden?: ComputedBooleanFormula
  /** QB JSON or JSONata expression — true → field is required */
  computedRequired?: ComputedBooleanFormula
  /** JSONata expression evaluated to a string — overrides field label */
  computedLabel?: string | null
  /** JSONata expression evaluated to a string — overrides field description */
  computedDescription?: string | null
  /** JSONata expression — result is written back as the field's value */
  computedFormula?: string | null
  /** Actions that run when this field's value changes */
  fieldActions?: FieldAction[] | null
  /** JSONata-based custom validation rules evaluated on submit */
  customValidations?: CustomValidationRule[] | null
}

export interface EnumOption {
  id: string
  name: string
  color?: string
  icon?: string
  parent?: string
  slug?: string
  sort_order?: number
  active?: boolean
  is_final_option?: boolean
  force_description?: boolean
  force_followup_date?: boolean
  description?: string
}

/** Common props for all TanStack Form field components */
export interface DocyrusFormFieldProps {
  /** Field configuration from the data source */
  field: IField
  /** TanStack Form instance — the result of useForm() */

  form: any
  /** Whether the field is disabled */
  disabled?: boolean
  /** Whether the field is required (shows asterisk on label) */
  required?: boolean
  /** Additional CSS class */
  className?: string
  /** Enum options for select-based fields */
  enumOptions?: Array<EnumOption>
  /** App slug for dynamic enum loading */
  appSlug?: string
  /** Data source slug for dynamic enum loading */
  dataSourceSlug?: string
  /** Tailwind color tones for field-color (e.g. [200, 500]) */
  tones?: number[]
  /** Callback for loading more options (pagination) */
  onLoadMore?: () => void
  /** Whether more options are available to load */
  hasMore?: boolean
  /** Callback for creating a new record inline (simple mode) */
  onCreateRecord?: (name: string) => Promise<EnumOption>
  /** Render prop for a custom inline record creation form */
  renderCreateForm?: (props: {
    onCreated: (option: EnumOption) => void
  }) => ReactNode
  /** Custom render function for option items */
  itemTemplate?: (option: EnumOption) => ReactNode
  /** Display mode: 'dropdown' (default popover) or 'card' (inline card grid) */
  variant?: 'dropdown' | 'card'
  /** Number of grid columns for card variant (1–5, responsive breakpoints) */
  columnCount?: 1 | 2 | 3 | 4 | 5
  /** Remote search callback — consumer updates enumOptions server-side */
  onSearch?: (query: string) => void
  /** Whether remote search is in progress (shows spinner) */
  searching?: boolean
  /** Max height for the scrollable card container (default: '360px') */
  maxHeight?: string
  /**
   * Upload handler for image fields — receives the picked File, uploads it,
   * and resolves to the stored file value (`{ source, file_name, signed_url, … }`).
   * Injected by `useDocyrusFormView` against the Docyrus storage endpoint.
   * Without it, the image field falls back to storing the raw `File`, which
   * serializes to `{}` over JSON and silently drops the image.
   */
  onImageUpload?: (file: File) => Promise<StoredFileValue | null>
  /** Upload handler for file fields — same contract as `onImageUpload`. */
  onFileUpload?: (file: File) => Promise<StoredFileValue | null>
  /** Locale for i18n — falls back to 'en' when undefined */
}

/**
 * Shape of a file/image value persisted by the Docyrus storage upload endpoint
 * (`POST /v1/apps/{app}/data-sources/{ds}/files/upload`). Shared by the image
 * and file form fields and by `useDocyrusFormView`'s injected upload handler.
 */
export interface StoredFileValue {
  file_name: string
  source: string
  file_size: number
  file_type: string
  signed_url: string
  file_data?: unknown
}

/** Common props for all value renderer components */
export interface DocyrusValueProps {
  /** Field configuration from the data source */
  field: IField
  /** The field value to display */
  value: unknown
  /** Full record for accessing companion columns */
  record?: Record<string, unknown>
  /** Enum options for select-based fields */
  enumOptions?: Array<EnumOption>
  /** Additional CSS class */
  className?: string
}
