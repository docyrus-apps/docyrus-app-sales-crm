import { type ReactNode } from 'react'

export type IFieldType =
  | 'field-text'
  | 'field-textarea'
  | 'field-email'
  | 'field-phone'
  | 'field-url'
  | 'field-color'
  | 'field-icon'
  | 'field-currency'
  | 'field-display'
  | 'field-htmlEditor'
  | 'field-emailEditor'
  | 'field-codeEditor'
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
  /** Number of grid columns for card variant (1–4, responsive breakpoints) */
  columnCount?: 1 | 2 | 3 | 4
  /** Remote search callback — consumer updates enumOptions server-side */
  onSearch?: (query: string) => void
  /** Whether remote search is in progress (shows spinner) */
  searching?: boolean
  /** Max height for the scrollable card container (default: '360px') */
  maxHeight?: string
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
