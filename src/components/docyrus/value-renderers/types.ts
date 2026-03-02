export type IFieldType
  = | 'field-text'
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
    | 'field-systemUuidArray';

export interface IField {
  id: string;
  name: string;
  slug: string;
  type: IFieldType;
  defaultValue?: string | null;
  validations?: Array<string> | null;
  readOnly?: boolean | null;
  options?: Record<string, unknown> | null;
  relationDataSourceId?: string | null;
  avatarMapping?: {
    iconField?: string | null;
    colorField?: string | null;
    imageField?: string | null;
  } | null;
}

export interface EnumOption {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  parent?: string;
  slug?: string;
  sort_order?: number;
  active?: boolean;
  is_final_option?: boolean;
  force_description?: boolean;
  force_followup_date?: boolean;
  description?: string;
}

/** Common props for all TanStack Form field components */
export interface DocyrusFormFieldProps {
  /** Field configuration from the data source */
  field: IField;
  /** TanStack Form instance — the result of useForm() */

  form: any;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Enum options for select-based fields */
  enumOptions?: Array<EnumOption>;
  /** App slug for dynamic enum loading */
  appSlug?: string;
  /** Data source slug for dynamic enum loading */
  dataSourceSlug?: string;
}

/** Common props for all value renderer components */
export interface DocyrusValueProps {
  /** Field configuration from the data source */
  field: IField;
  /** The field value to display */
  value: unknown;
  /** Full record for accessing companion columns */
  record?: Record<string, unknown>;
  /** Enum options for select-based fields */
  enumOptions?: Array<EnumOption>;
  /** Additional CSS class */
  className?: string;
}