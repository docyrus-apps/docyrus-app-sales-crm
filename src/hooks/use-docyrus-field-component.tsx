'use client'

import { useMemo, type ComponentType } from 'react'

import {
  type DocyrusFormFieldProps,
  type DocyrusValueProps,
  type EnumOption,
  type IField,
  type IFieldType,
} from '@/components/docyrus/form-fields/types'

import { ApprovalStatusFormField } from '@/components/docyrus/form-fields/approval-status-form-field'
import { AvatarField } from '@/components/docyrus/form-fields/avatar-field'
import { CheckboxFormField } from '@/components/docyrus/form-fields/checkbox-form-field'
import { CodeEditorFormField } from '@/components/docyrus/form-fields/code-editor-form-field'
import { ColorFormField } from '@/components/docyrus/form-fields/color-form-field'
import { CurrencyCodeFormField } from '@/components/docyrus/form-fields/currency-code-form-field'
import { DateFormField } from '@/components/docyrus/form-fields/date-form-field'
import { DateRangeFormField } from '@/components/docyrus/form-fields/date-range-form-field'
import { DateTimeFormField } from '@/components/docyrus/form-fields/datetime-form-field'
import { DocEditorFormField } from '@/components/docyrus/form-fields/doc-editor-form-field'
import { DurationFormField } from '@/components/docyrus/form-fields/duration-form-field'
import { EmailEditorFormField } from '@/components/docyrus/form-fields/email-editor-form-field'
import { EmailFormField } from '@/components/docyrus/form-fields/email-form-field'
import { EnumComboboxField } from '@/components/docyrus/form-fields/enum-combobox-field'
import { FileFormField } from '@/components/docyrus/form-fields/file-form-field'
import { HtmlEditorFormField } from '@/components/docyrus/form-fields/html-editor-form-field'
import { IconFormField } from '@/components/docyrus/form-fields/icon-form-field'
import { ImageFormField } from '@/components/docyrus/form-fields/image-form-field'
import { LocationSelectFormField } from '@/components/docyrus/form-fields/location-select-form-field'
import { MoneyFormField } from '@/components/docyrus/form-fields/money-form-field'
import { MultiSelectFormField } from '@/components/docyrus/form-fields/multi-select-form-field'
import { NumberFormField } from '@/components/docyrus/form-fields/number-form-field'
import { PercentFormField } from '@/components/docyrus/form-fields/percent-form-field'
import { PhoneFormField } from '@/components/docyrus/form-fields/phone-form-field'
import { QueryBuilderFormField } from '@/components/docyrus/form-fields/query-builder-form-field'
import { RadioGroupFormField } from '@/components/docyrus/form-fields/radio-group-form-field'
import { RatingFormField } from '@/components/docyrus/form-fields/rating-form-field'
import { RelationFormField } from '@/components/docyrus/form-fields/relation-form-field'
import { SchemaRepeaterFormField } from '@/components/docyrus/form-fields/schema-repeater-form-field'
import { StatusFormField } from '@/components/docyrus/form-fields/status-form-field'
import { SwitchFormField } from '@/components/docyrus/form-fields/switch-form-field'
import { TagSelectFormField } from '@/components/docyrus/form-fields/tag-select-form-field'
import { TaskListFormField } from '@/components/docyrus/form-fields/task-list-form-field'
import { TextFormField } from '@/components/docyrus/form-fields/text-form-field'
import { TextareaFormField } from '@/components/docyrus/form-fields/textarea-form-field'
import { TimeFormField } from '@/components/docyrus/form-fields/time-form-field'
import { UrlFormField } from '@/components/docyrus/form-fields/url-form-field'
import { UserMultiSelectFormField } from '@/components/docyrus/form-fields/user-multi-select-form-field'
import { UserSelectFormField } from '@/components/docyrus/form-fields/user-select-form-field'

import { ApprovalStatusValue } from '@/components/docyrus/value-renderers/approval-status-value'
import { AvatarValue } from '@/components/docyrus/value-renderers/avatar-value'
import { ButtonValue } from '@/components/docyrus/value-renderers/button-value'
import { CheckboxValue } from '@/components/docyrus/value-renderers/checkbox-value'
import { CodeValue } from '@/components/docyrus/value-renderers/code-value'
import { ColorValue } from '@/components/docyrus/value-renderers/color-value'
import { ConversationChannelValue } from '@/components/docyrus/value-renderers/conversation-channel-value'
import { CurrencyCodeValue } from '@/components/docyrus/value-renderers/currency-code-value'
import { DateRangeValue } from '@/components/docyrus/value-renderers/date-range-value'
import { DateValue } from '@/components/docyrus/value-renderers/date-value'
import { DateTimeValue } from '@/components/docyrus/value-renderers/datetime-value'
import { DocEditorValue } from '@/components/docyrus/value-renderers/doc-editor-value'
import { DurationValue } from '@/components/docyrus/value-renderers/duration-value'
import { EmailValue } from '@/components/docyrus/value-renderers/email-value'
import { FileStorageFolderValue } from '@/components/docyrus/value-renderers/file-storage-folder-value'
import { FileValue } from '@/components/docyrus/value-renderers/file-value'
import { FormulaValue } from '@/components/docyrus/value-renderers/formula-value'
import { IconValue } from '@/components/docyrus/value-renderers/icon-value'
import { IdentityValue } from '@/components/docyrus/value-renderers/identity-value'
import { ImageValue } from '@/components/docyrus/value-renderers/image-value'
import { InlineDataValue } from '@/components/docyrus/value-renderers/inline-data-value'
import { JsonValue } from '@/components/docyrus/value-renderers/json-value'
import { ListValue } from '@/components/docyrus/value-renderers/list-value'
import { LocationValue } from '@/components/docyrus/value-renderers/location-value'
import { MoneyValue } from '@/components/docyrus/value-renderers/money-value'
import { MultiSelectValue } from '@/components/docyrus/value-renderers/multi-select-value'
import { NumberValue } from '@/components/docyrus/value-renderers/number-value'
import { PercentValue } from '@/components/docyrus/value-renderers/percent-value'
import { PhoneValue } from '@/components/docyrus/value-renderers/phone-value'
import { RatingValue } from '@/components/docyrus/value-renderers/rating-value'
import { RelatedFieldValue } from '@/components/docyrus/value-renderers/related-field-value'
import { RelationValue } from '@/components/docyrus/value-renderers/relation-value'
import { RichTextValue } from '@/components/docyrus/value-renderers/rich-text-value'
import { SelectValue } from '@/components/docyrus/value-renderers/select-value'
import { StatusValue } from '@/components/docyrus/value-renderers/status-value'
import { SwitchValue } from '@/components/docyrus/value-renderers/switch-value'
import { TaskListValue } from '@/components/docyrus/value-renderers/task-list-value'
import { TextValue } from '@/components/docyrus/value-renderers/text-value'
import { TimeValue } from '@/components/docyrus/value-renderers/time-value'
import { TodoValue } from '@/components/docyrus/value-renderers/todo-value'
import { UrlValue } from '@/components/docyrus/value-renderers/url-value'
import { UserMultiValue } from '@/components/docyrus/value-renderers/user-multi-value'
import { UserValue } from '@/components/docyrus/value-renderers/user-value'

import {
  CheckboxCell,
  ColorCell,
  CurrencyCell,
  CurrencyCodeCell,
  DateCell,
  DateRangeCell,
  DateTimeCell,
  DurationCell,
  EmailCell,
  EnumCell,
  FileCell,
  IconCell,
  ImageCell,
  LongTextCell,
  MultiSelectCell,
  NumberCell,
  PercentCell,
  PhoneCell,
  RatingCell,
  RelationCell,
  SelectCell,
  ShortTextCell,
  SwitchCell,
  TagSelectCell,
  TimeCell,
  UrlCell,
  UserCell,
  UserMultiSelectCell,
  UuidCell,
} from '@/components/docyrus/data-grid/data-grid-cell-variants'
import {
  type CellOpts,
  type CellUserOption,
  type DataGridCellProps,
} from '@/components/docyrus/data-grid/types'
import { type ColumnDef } from '@/components/docyrus/data-grid'

import { EditableValue } from '@/components/docyrus/editable-value'

function JsonCodeEditorFormField(props: DocyrusFormFieldProps) {
  return <CodeEditorFormField {...props} language="json" />
}

/** Single source of truth: field type → form input component. */
export const FORM_FIELD_MAP: Partial<
  Record<IFieldType, ComponentType<DocyrusFormFieldProps>>
> = {
  'field-text': TextFormField,
  'field-textarea': TextareaFormField,
  'field-code': TextFormField,
  'field-number': NumberFormField,
  'field-email': EmailFormField,
  'field-url': UrlFormField,
  'field-checkbox': CheckboxFormField,
  'field-switch': SwitchFormField,
  'field-select': EnumComboboxField,
  'field-multiSelect': MultiSelectFormField,
  'field-tagSelect': TagSelectFormField,
  'field-radioGroup': RadioGroupFormField,
  'field-enum': EnumComboboxField,
  'field-systemEnum': EnumComboboxField,
  'field-status': StatusFormField,
  'field-userSelect': UserSelectFormField,
  'field-userMultiSelect': UserMultiSelectFormField,
  'field-relation': RelationFormField,
  'field-date': DateFormField,
  'field-dateTime': DateTimeFormField,
  'field-time': TimeFormField,
  'field-dateRange': DateRangeFormField,
  'field-money': MoneyFormField,
  'field-percent': PercentFormField,
  'field-rating': RatingFormField,
  'field-duration': DurationFormField,
  'field-phone': PhoneFormField,
  'field-color': ColorFormField,
  'field-icon': IconFormField,
  'field-currency': CurrencyCodeFormField,
  'field-file': FileFormField,
  'field-image': ImageFormField,
  'field-avatar': AvatarField,
  'field-htmlEditor': HtmlEditorFormField,
  'field-emailEditor': EmailEditorFormField,
  'field-codeEditor': CodeEditorFormField,
  'field-json': JsonCodeEditorFormField,
  'field-docEditor': DocEditorFormField,
  'field-taskList': TaskListFormField,
  'field-locationSelect': LocationSelectFormField,
  'field-approvalStatus': ApprovalStatusFormField,
  'field-queryBuilder': QueryBuilderFormField,
  'field-schemaRepeater': SchemaRepeaterFormField,
}

/** Single source of truth: field type → read-only value renderer. */
export const VALUE_RENDERER_MAP: Partial<
  Record<IFieldType, ComponentType<DocyrusValueProps>>
> = {
  'field-text': TextValue,
  'field-textarea': TextValue,
  'field-display': TextValue,
  'field-code': TextValue,

  'field-number': NumberValue,
  'field-money': MoneyValue,
  'field-percent': PercentValue,
  'field-duration': DurationValue,
  'field-rating': RatingValue,

  'field-checkbox': CheckboxValue,
  'field-switch': SwitchValue,

  'field-email': EmailValue,
  'field-phone': PhoneValue,
  'field-url': UrlValue,

  'field-date': DateValue,
  'field-dateTime': DateTimeValue,
  'field-time': TimeValue,
  'field-dateRange': DateRangeValue,

  'field-select': SelectValue,
  'field-radioGroup': SelectValue,
  'field-enum': SelectValue,
  'field-systemEnum': SelectValue,
  'field-status': StatusValue,
  'field-userSelect': UserValue,
  'field-userMultiSelect': UserMultiValue,
  'field-multiSelect': MultiSelectValue,
  'field-tagSelect': MultiSelectValue,
  'field-relation': RelationValue,
  'field-list': ListValue,

  'field-color': ColorValue,
  'field-icon': IconValue,
  'field-currency': CurrencyCodeValue,

  'field-file': FileValue,
  'field-image': ImageValue,
  'field-avatar': AvatarValue,

  'field-htmlEditor': RichTextValue,
  'field-emailEditor': RichTextValue,
  'field-codeEditor': CodeValue,
  'field-docEditor': DocEditorValue,
  'field-json': JsonValue,

  'field-taskList': TaskListValue,
  'field-todo': TodoValue,
  'field-inlineData': InlineDataValue,
  'field-locationSelect': LocationValue,
  'field-approvalStatus': ApprovalStatusValue,

  'field-formula': FormulaValue,
  'field-relatedField': RelatedFieldValue,
  'field-identity': IdentityValue,
  'field-autonumber': IdentityValue,
  'field-button': ButtonValue,
  'field-conversationChannel': ConversationChannelValue,
  'field-fileStorageFolder': FileStorageFolderValue,
}

type CellComponent = ComponentType<DataGridCellProps<unknown>>

/** Single source of truth: field type → data-grid cell component. */
export const CELL_COMPONENT_MAP: Partial<Record<IFieldType, CellComponent>> = {
  'field-text': ShortTextCell as CellComponent,
  'field-code': ShortTextCell as CellComponent,
  'field-textarea': LongTextCell as CellComponent,
  'field-htmlEditor': LongTextCell as CellComponent,
  'field-docEditor': LongTextCell as CellComponent,
  'field-email': EmailCell as CellComponent,
  'field-phone': PhoneCell as CellComponent,
  'field-url': UrlCell as CellComponent,
  'field-color': ColorCell as CellComponent,
  'field-icon': IconCell as CellComponent,
  'field-number': NumberCell as CellComponent,
  'field-autonumber': NumberCell as CellComponent,
  'field-identity': UuidCell as CellComponent,
  'field-money': CurrencyCell as CellComponent,
  'field-currency': CurrencyCodeCell as CellComponent,
  'field-percent': PercentCell as CellComponent,
  'field-rating': RatingCell as CellComponent,
  'field-duration': DurationCell as CellComponent,
  'field-date': DateCell as CellComponent,
  'field-dateRange': DateRangeCell as CellComponent,
  'field-dateTime': DateTimeCell as CellComponent,
  'field-time': TimeCell as CellComponent,
  'field-checkbox': CheckboxCell as CellComponent,
  'field-switch': SwitchCell as CellComponent,
  'field-status': SelectCell as CellComponent,
  'field-enum': EnumCell as CellComponent,
  'field-systemEnum': EnumCell as CellComponent,
  'field-select': SelectCell as CellComponent,
  'field-radioGroup': SelectCell as CellComponent,
  'field-multiSelect': MultiSelectCell as CellComponent,
  'field-tagSelect': TagSelectCell as CellComponent,
  'field-userSelect': UserCell as CellComponent,
  'field-userMultiSelect': UserMultiSelectCell as CellComponent,
  'field-relation': RelationCell as CellComponent,
  'field-file': FileCell as CellComponent,
  'field-image': ImageCell as CellComponent,
}

/* ------------------------------------------------------------------ */
/* TanStack column-def construction                                    */
/* ------------------------------------------------------------------ */

/**
 * Field types that should always be selectable as a row-grouping column.
 * Some of these (relation/user) fall back to the `short-text` cell variant
 * when the meta isn't enriched, so we mark the column with
 * `meta.groupable: true` to force the grouping picker to accept them.
 */
export const GROUPABLE_FIELD_TYPES = new Set<IFieldType>([
  'field-select',
  'field-status',
  'field-enum',
  'field-systemEnum',
  'field-radioGroup',
  'field-multiSelect',
  'field-tagSelect',
  'field-relation',
  'field-relatedField',
  'field-userSelect',
  'field-userMultiSelect',
  'field-date',
  'field-dateRange',
  'field-dateTime',
])

const ENUM_LIKE_TYPES = new Set<IFieldType>([
  'field-status',
  'field-enum',
  'field-systemEnum',
  'field-select',
  'field-radioGroup',
])

const MULTI_LIKE_TYPES = new Set<IFieldType>([
  'field-multiSelect',
  'field-tagSelect',
  'field-userMultiSelect',
])

const RELATION_LIKE_TYPES = new Set<IFieldType>([
  'field-relation',
  'field-relatedField',
  'field-userSelect',
])

/**
 * Loose field shape accepted by `buildTanstackColumnDef` and friends.
 * Compatible with both `IField` (Docyrus UI) and `DataSourceField` (`@docyrus/app-utils`)
 * — the shared minimum is `slug`, `name`, `type`, with optional `enums`/`options` for
 * select-like cells.
 */
export interface DocyrusFieldLike {
  id?: string
  slug: string
  name: string
  /** Accepts `IFieldType` or a plain `string` (e.g. from `DataSourceField`); the builder casts internally. */
  type: IFieldType | (string & {})
  options?: unknown
  enums?: unknown
  [key: string]: unknown
}

interface CellSelectOption {
  value: string
  label: string
  color?: string
  iconStr?: string
}

function extractSelectOptions(
  field: DocyrusFieldLike,
): Array<CellSelectOption> {
  const raw = field as Record<string, unknown>
  const source = Array.isArray(raw.enums)
    ? raw.enums
    : Array.isArray(raw.options)
      ? raw.options
      : null

  if (!source) return []

  const result: Array<CellSelectOption> = []

  for (const entry of source) {
    if (!entry || typeof entry !== 'object') continue

    const option = entry as Record<string, unknown>
    const value =
      typeof option.id === 'string' || typeof option.id === 'number'
        ? String(option.id)
        : typeof option.slug === 'string'
          ? option.slug
          : typeof option.value === 'string'
            ? option.value
            : undefined
    const label =
      typeof option.name === 'string'
        ? option.name
        : typeof option.label === 'string'
          ? option.label
          : value

    if (value && label) {
      const opt: CellSelectOption = { value, label }

      if (typeof option.color === 'string') opt.color = option.color
      /*
       * Docyrus enum metadata stores the icon as a string identifier
       * (e.g. `huge user-circle`). Map it to `iconStr` so the data-grid's
       * `CellOptionIndicator` renders the icon instead of falling through
       * to the colored dot. Both `icon` (Docyrus shape) and `iconStr` (UI
       * shape) are accepted in case a consumer hand-crafts an option list.
       */
      if (typeof option.icon === 'string') opt.iconStr = option.icon
      else if (typeof option.iconStr === 'string') opt.iconStr = option.iconStr
      result.push(opt)
    }
  }

  return result
}

export function extractEnumOptions(field: DocyrusFieldLike): Array<EnumOption> {
  const raw = field as Record<string, unknown>
  const source = Array.isArray(raw.enums) ? raw.enums : null

  if (!source) return []

  const result: Array<EnumOption> = []

  for (const entry of source) {
    if (!entry || typeof entry !== 'object') continue

    const option = entry as Record<string, unknown>
    const id = typeof option.id === 'string' ? option.id : undefined
    const name = typeof option.name === 'string' ? option.name : undefined

    if (!id || !name) continue

    const enumOption: EnumOption = { id, name }

    if (typeof option.slug === 'string') enumOption.slug = option.slug
    if (typeof option.color === 'string') enumOption.color = option.color
    if (typeof option.icon === 'string') enumOption.icon = option.icon
    if (typeof option.sortOrder === 'number')
      enumOption.sort_order = option.sortOrder
    if (typeof option.sort_order === 'number')
      enumOption.sort_order = option.sort_order
    if (typeof option.isFinalOption === 'boolean')
      enumOption.is_final_option = option.isFinalOption

    result.push(enumOption)
  }

  return result
}

export function toIField(field: DocyrusFieldLike): IField {
  const raw = field as Record<string, unknown>

  return {
    id: typeof field.id === 'string' ? field.id : field.slug,
    name: field.name,
    slug: field.slug,
    type: field.type as IFieldType,
    defaultValue:
      typeof raw.default_value === 'string' ? raw.default_value : null,
    options:
      typeof raw.options === 'object' &&
      raw.options !== null &&
      !Array.isArray(raw.options)
        ? (raw.options as Record<string, unknown>)
        : null,
    relationDataSourceId:
      typeof raw.relation_data_source_id === 'string'
        ? raw.relation_data_source_id
        : typeof raw.relationDataSourceId === 'string'
          ? raw.relationDataSourceId
          : null,
  }
}

export function getFieldValue(row: unknown, slug: string): unknown {
  if (!row || typeof row !== 'object') return undefined

  return (row as Record<string, unknown>)[slug]
}

function extractObjectId(value: unknown): string | undefined {
  if (value && typeof value === 'object' && 'id' in value) {
    const { id } = value as { id?: unknown }

    if (typeof id === 'string' || typeof id === 'number') return String(id)
  }

  return undefined
}

function extractObjectLabel(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined

  const obj = value as Record<string, unknown>
  const candidates = [
    obj.name,
    obj.label,
    obj.title,
    obj.address,
    obj.details,
    obj.description,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.length > 0) return candidate
  }

  return undefined
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

function normalizeFieldValue(value: unknown, fieldType: IFieldType): unknown {
  if (value === null || value === undefined) return value

  if (ENUM_LIKE_TYPES.has(fieldType)) {
    return extractObjectId(value) ?? value
  }

  if (MULTI_LIKE_TYPES.has(fieldType)) {
    if (Array.isArray(value)) {
      return value.map((item) => extractObjectId(item) ?? item)
    }

    return value
  }

  if (RELATION_LIKE_TYPES.has(fieldType)) {
    return extractObjectLabel(value) ?? value
  }

  if (typeof value === 'object') {
    return extractObjectLabel(value) ?? safeStringify(value)
  }

  return value
}

/**
 * Resolve the TanStack `meta.cell` config (`CellOpts`) for a Docyrus field.
 * The returned object goes straight into a `ColumnDef.meta.cell` slot and is
 * dispatched at render time by `DataGridCell`.
 *
 * Field types that need extra metadata not present on the data source field
 * response (`field-userSelect`, `field-userMultiSelect`, `field-relation`,
 * `field-relatedField`) fall back to `short-text`. Override via `mapColumn`
 * in `useDocyrusDataGrid` once you have the user list / relation target.
 */
export function getCellOpts(
  field: DocyrusFieldLike,
  options: {
    appSlug?: string
    dataSourceSlug?: string
    /**
     * Tenant-wide users list shared across cells. When supplied, user-select
     * and user-multi-select cells use this as their static option list so
     * avatars + labels render without each cell hitting the network.
     * `useDocyrusDataGrid` accepts a `users` option that flows through here.
     */
    users?: ReadonlyArray<CellUserOption>
  } = {},
): CellOpts {
  const { appSlug = '', dataSourceSlug = '', users = [] } = options
  const userOptions = Array.from(users)

  switch (field.type) {
    case 'field-text':

    case 'field-code':
      return { variant: 'short-text' }

    case 'field-textarea':

    case 'field-htmlEditor':

    case 'field-docEditor':
      return { variant: 'long-text' }

    case 'field-email':
      return { variant: 'email' }

    case 'field-phone':
      return { variant: 'phone' }

    case 'field-url':
      return { variant: 'url' }

    case 'field-color':
      return { variant: 'color' }

    case 'field-icon':
      return { variant: 'icon' }

    case 'field-number':

    case 'field-autonumber':
      return { variant: 'number' }

    case 'field-identity':
      return { variant: 'uuid' }

    case 'field-money':
      return { variant: 'currency' }

    case 'field-currency':
      return { variant: 'currency-code' }

    case 'field-percent':
      return { variant: 'percent' }

    case 'field-rating':
      return { variant: 'rating' }

    case 'field-duration':
      return { variant: 'duration' }

    case 'field-date':
      return { variant: 'date' }

    case 'field-dateRange':
      return { variant: 'date-range' }

    case 'field-dateTime':
      return { variant: 'datetime' }

    case 'field-time':
      return { variant: 'time' }

    case 'field-checkbox':
      return { variant: 'checkbox' }

    case 'field-switch':
      return { variant: 'switch' }

    case 'field-status':

    case 'field-approvalStatus':
      return { variant: 'status', options: extractSelectOptions(field) }

    case 'field-enum':

    case 'field-systemEnum':
      return {
        variant: 'enum',
        appSlug,
        dataSourceSlug,
        fieldSlug: field.slug,
        options: extractSelectOptions(field),
      }

    case 'field-select':

    case 'field-radioGroup':
      return { variant: 'select', options: extractSelectOptions(field) }

    case 'field-multiSelect':
      return { variant: 'multi-select', options: extractSelectOptions(field) }

    case 'field-tagSelect':
      return { variant: 'tag-select', options: extractSelectOptions(field) }

    case 'field-userSelect':
      return { variant: 'user', options: userOptions }

    case 'field-userMultiSelect':
      return { variant: 'user-multi-select', options: userOptions }

    case 'field-relation':

    case 'field-relatedField': {
      const raw = field as Record<string, unknown>
      const relationDataSourceId =
        typeof raw.relationDataSourceId === 'string'
          ? raw.relationDataSourceId
          : typeof raw.relation_data_source_id === 'string'
            ? raw.relation_data_source_id
            : ''
      const relationAppSlug =
        typeof raw.relationDataSourceAppSlug === 'string'
          ? raw.relationDataSourceAppSlug
          : typeof raw.relation_data_source_app_slug === 'string'
            ? raw.relation_data_source_app_slug
            : undefined
      const relationDataSourceSlug =
        typeof raw.relationDataSourceSlug === 'string'
          ? raw.relationDataSourceSlug
          : typeof raw.relation_data_source_slug === 'string'
            ? raw.relation_data_source_slug
            : undefined

      return {
        variant: 'relation',
        dataSourceId: relationDataSourceId,
        ...(relationAppSlug ? { relationAppSlug } : {}),
        ...(relationDataSourceSlug ? { relationDataSourceSlug } : {}),
      }
    }

    case 'field-file':
      return { variant: 'file' }

    case 'field-image':
      return { variant: 'image' }

    default:
      return { variant: 'short-text' }
  }
}

interface FieldGroupValueProps {
  field: IField
  value: unknown
  record?: Record<string, unknown>
  enumOptions?: Array<EnumOption>
}

/**
 * Renders a row group's header value using the right read-only renderer for
 * the field type (`SelectValue`, `StatusValue`, `RelationValue`, ...).
 */
function FieldGroupValue({
  field,
  value,
  record,
  enumOptions,
}: FieldGroupValueProps) {
  const ValueRenderer = useDocyrusFieldComponent(field.type, 'value-renderer')

  return (
    <ValueRenderer
      field={field}
      value={value}
      record={record}
      enumOptions={enumOptions}
    />
  )
}

export interface BuildTanstackColumnDefOptions {
  /** Field metadata. Accepts both `IField` and `@docyrus/app-utils`'s `DataSourceField`. */
  field: DocyrusFieldLike
  /** App slug — wired into `enum` cell meta for dynamic option loading. */
  appSlug?: string
  /** Data source slug — wired into `enum` cell meta for dynamic option loading. */
  dataSourceSlug?: string
  /** Shared users list for `field-userSelect` / `field-userMultiSelect` cell options. */
  users?: ReadonlyArray<CellUserOption>
}

export type TanstackColumnDefBuilder = <TData = unknown>(
  options: BuildTanstackColumnDefOptions,
) => ColumnDef<TData>

/**
 * Pin sizing for cell variants that have a strongly-implied width:
 * - uuid + showCopyButton (default): icon-only cell, narrow column
 * - uuid + !showCopyButton: full UUID string, needs a wider fixed column
 *
 * Setting `size`, `minSize`, and `maxSize` to the same value effectively
 * locks the column width even when resizing is otherwise enabled.
 */
function getColumnSizing(cell: CellOpts): {
  size?: number
  minSize?: number
  maxSize?: number
} {
  if (cell.variant === 'uuid') {
    const showCopyButton = cell.showCopyButton !== false
    const width = showCopyButton ? 60 : 300

    return { size: width, minSize: width, maxSize: width }
  }

  return {}
}

/**
 * Build a TanStack `ColumnDef` for a Docyrus data source field.
 *
 * The returned column has:
 * - `id`: `field.slug`
 * - `accessorFn`: reads `row[field.slug]` and normalizes object values for
 *   enum-/multi-/relation-like field types so TanStack grouping/sorting works.
 * - `header`: `field.name`
 * - `meta.label`: `field.name`
 * - `meta.cell`: `CellOpts` derived via `getCellOpts` (drives `DataGridCell`)
 * - `meta.groupable`: `true` for field types in `GROUPABLE_FIELD_TYPES`
 * - `meta.renderGroupValue`: renders a row group's header value with the right
 *   value renderer for the field type
 */
export function buildTanstackColumnDef<TData = unknown>(
  options: BuildTanstackColumnDefOptions,
): ColumnDef<TData> {
  const { field, appSlug, dataSourceSlug, users } = options
  const fieldType = field.type as IFieldType
  const cell = getCellOpts(field, { appSlug, dataSourceSlug, users })
  const ifield = toIField(field)
  const enumOptions = extractEnumOptions(field)
  const sizing = getColumnSizing(cell)

  return {
    id: field.slug,
    accessorFn: (row: unknown) =>
      normalizeFieldValue(getFieldValue(row, field.slug), fieldType),
    header: field.name,
    ...sizing,
    meta: {
      label: field.name,
      cell,
      groupable: GROUPABLE_FIELD_TYPES.has(fieldType),
      renderGroupValue: ({ value, record }) => (
        <FieldGroupValue
          field={ifield}
          value={value}
          record={record as Record<string, unknown> | undefined}
          enumOptions={enumOptions}
        />
      ),
    },
  } as ColumnDef<TData>
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export type DocyrusFieldComponentKind =
  | 'form-field'
  | 'value-renderer'
  | 'data-grid-cell-variant'
  | 'editable-value'
  | 'tanstack-column-def'

export type DocyrusFieldComponentResult<K extends DocyrusFieldComponentKind> =
  K extends 'form-field'
    ? ComponentType<DocyrusFormFieldProps> | null
    : K extends 'value-renderer'
      ? ComponentType<DocyrusValueProps>
      : K extends 'data-grid-cell-variant'
        ? ComponentType<DataGridCellProps<unknown>>
        : K extends 'editable-value'
          ? typeof EditableValue
          : K extends 'tanstack-column-def'
            ? TanstackColumnDefBuilder
            : never

/**
 * Resolves the right UI component (or builder) for a Docyrus data source field
 * type across five render contexts:
 *
 * - `form-field` — TanStack Form input component (e.g. `SelectFormField`).
 *   Returns `null` for read-only/unsupported types.
 * - `value-renderer` — Read-only display component (e.g. `SelectValue`).
 *   Falls back to `TextValue` for unknown types.
 * - `data-grid-cell-variant` — TanStack-table cell component (e.g. `SelectCell`).
 *   Falls back to `ShortTextCell`. Cells that need extra metadata (relation,
 *   user) only render correctly when their host column has matching meta
 *   wired through `meta.cell`; use `useDocyrusDataGrid` for that wiring.
 * - `editable-value` — Always returns `EditableValue`, which dispatches read/edit
 *   modes by field type internally.
 * - `tanstack-column-def` — Returns a `<TData>(opts) => ColumnDef<TData>` builder.
 *   Call with `{ field, appSlug?, dataSourceSlug? }` to produce a fully-configured
 *   TanStack column. The hook's `fieldType` argument is a memo key for this
 *   kind — the builder itself reads `field.type` from the passed field.
 *
 * The `FORM_FIELD_MAP`, `VALUE_RENDERER_MAP`, `CELL_COMPONENT_MAP` exports —
 * along with `getCellOpts` and `buildTanstackColumnDef` — are the single source
 * of truth for field-type-keyed registries.
 *
 * @example
 * const Form = useDocyrusFieldComponent('field-select', 'form-field');
 * if (Form) return <Form field={field} form={form} />;
 *
 * @example
 * const buildColumn = useDocyrusFieldComponent(field.type, 'tanstack-column-def');
 * const col = buildColumn<MyRow>({ field, appSlug: 'crm', dataSourceSlug: 'contacts' });
 */
export function useDocyrusFieldComponent<K extends DocyrusFieldComponentKind>(
  fieldType: IFieldType,
  kind: K,
): DocyrusFieldComponentResult<K> {
  return useMemo<DocyrusFieldComponentResult<K>>(() => {
    switch (kind) {
      case 'form-field':
        return (FORM_FIELD_MAP[fieldType] ??
          null) as DocyrusFieldComponentResult<K>

      case 'value-renderer':
        return (VALUE_RENDERER_MAP[fieldType] ??
          TextValue) as DocyrusFieldComponentResult<K>

      case 'data-grid-cell-variant':
        return (CELL_COMPONENT_MAP[fieldType] ??
          ShortTextCell) as DocyrusFieldComponentResult<K>

      case 'editable-value':
        return EditableValue as DocyrusFieldComponentResult<K>

      case 'tanstack-column-def':
        return buildTanstackColumnDef as DocyrusFieldComponentResult<K>

      default:
        return null as DocyrusFieldComponentResult<K>
    }
  }, [fieldType, kind])
}
