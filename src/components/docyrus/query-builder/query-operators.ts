// @ts-nocheck
/* eslint-disable */
/*
 * Centralized catalog of Docyrus filter operators, grouped by filter group.
 * Backend reference: ./query-operators.json (kept in sync with this catalog).
 */

import {
  type FullOperator,
  type ValueEditorType,
  type InputType,
} from 'react-querybuilder'

import operatorsJson from './query-operators.json'

export type FilterGroup =
  | 'ALPHA'
  | 'APPROVAL'
  | 'BOOL'
  | 'CODE'
  | 'COMMON'
  | 'DATE'
  | 'DATETIME'
  | 'FILE'
  | 'FOLLOWER'
  | 'JSON'
  | 'LIST'
  | 'MULTISELECT'
  | 'NUMERIC'
  | 'OWNER'
  | 'RELATION'
  | 'TIME'

export interface RawOperatorEntry {
  operator: string
  group: FilterGroup
  no_value_field: boolean
}

const RAW_OPERATORS = operatorsJson as RawOperatorEntry[]

/*
 * Human-readable labels for each operator. Falls back to the operator
 * identifier itself if no label is found.
 */
export const OPERATOR_LABELS: Record<string, string> = {
  '=': 'equals',
  '<>': 'not equals',
  '!=': 'not equals',
  '<': 'less than',
  '<=': 'less or equal',
  '>': 'greater than',
  '>=': 'greater or equal',
  like: 'contains',
  'not like': 'does not contain',
  'starts with': 'starts with',
  'ends with': 'ends with',
  empty: 'is empty',
  'not empty': 'is not empty',
  between: 'between',
  true: 'is true',
  false: 'is false',
  contains: 'contains',
  'contains any': 'contains any',
  'contains all': 'contains all',
  'not contains': 'does not contain',
  is_other_field: 'matches field',
  is_not_other_field: 'does not match field',
  'is one of': 'is one of',
  'is none of': 'is none of',
  last_7_days: 'in the last 7 days',
  last_15_days: 'in the last 15 days',
  last_30_days: 'in the last 30 days',
  last_60_days: 'in the last 60 days',
  last_90_days: 'in the last 90 days',
  last_120_days: 'in the last 120 days',
  last_3_months: 'in the last 3 months',
  last_6_months: 'in the last 6 months',
  next_7_days: 'in the next 7 days',
  next_15_days: 'in the next 15 days',
  next_30_days: 'in the next 30 days',
  next_60_days: 'in the next 60 days',
  next_90_days: 'in the next 90 days',
  next_120_days: 'in the next 120 days',
  today: 'today',
  yesterday: 'yesterday',
  tomorrow: 'tomorrow',
  last_week: 'last week',
  this_week: 'this week',
  next_week: 'next week',
  last_month: 'last month',
  this_month: 'this month',
  next_month: 'next month',
  last_year: 'last year',
  this_year: 'this year',
  next_year: 'next year',
  first_quarter: 'first quarter',
  second_quarter: 'second quarter',
  third_quarter: 'third quarter',
  fourth_quarter: 'fourth quarter',
  before_today: 'before today',
  after_today: 'after today',
  x_days_ago: 'X days ago',
  x_days_later: 'X days from now',
  before_last_x_days: 'before X days ago',
  after_last_x_days: 'after X days ago',
  in_last_x_days: 'in the last X days',
  in_next_x_days: 'in the next X days',
  weekday_is: 'weekday is',
  monthday_is: 'day of month is',
  weekdays: 'on weekdays',
  time_is: 'time equals',
  time_greater: 'time after',
  time_greater_or_equals: 'time at or after',
  time_lower: 'time before',
  time_lower_or_equals: 'time at or before',
  json_key_is: 'key equals',
  json_key_is_not: 'key not equals',
  json_key_is_empty: 'key is empty',
  json_key_is_not_empty: 'key is not empty',
  in_role: 'has role',
  not_in_role: 'does not have role',
  in_active_user_scope: 'in current user scope',
  not_in_active_user_scope: 'not in current user scope',
  active_user: 'is current user',
  not_active_user: 'is not current user',
  in_team: 'in team',
  not_in_team: 'not in team',
  in_active_user_team: 'in current user team',
  not_in_active_user_team: 'not in current user team',
  in_unit: 'in unit',
  not_in_unit: 'not in unit',
  in_sub_unit: 'in sub-unit',
  not_in_sub_unit: 'not in sub-unit',
  contains_active_user: 'includes current user',
  not_contains_active_user: 'excludes current user',
  contains_member_of_active_user_team: 'includes current user team member',
}

const GROUP_ORDER: Record<FilterGroup, string[]> = {
  ALPHA: [
    '=',
    '<>',
    'like',
    'not like',
    'starts with',
    'ends with',
    'empty',
    'not empty',
  ],
  APPROVAL: ['=', '<>'],
  BOOL: ['true', 'false'],
  CODE: ['empty', 'not empty'],
  COMMON: ['is_other_field', 'is_not_other_field'],
  DATE: [
    '=',
    '<>',
    '>',
    '<',
    'between',
    'today',
    'yesterday',
    'tomorrow',
    'this_week',
    'last_week',
    'next_week',
    'this_month',
    'last_month',
    'next_month',
    'this_year',
    'last_year',
    'next_year',
    'first_quarter',
    'second_quarter',
    'third_quarter',
    'fourth_quarter',
    'last_3_months',
    'last_6_months',
    'last_7_days',
    'last_15_days',
    'last_30_days',
    'last_60_days',
    'last_90_days',
    'last_120_days',
    'next_7_days',
    'next_15_days',
    'next_30_days',
    'next_60_days',
    'next_90_days',
    'next_120_days',
    'before_today',
    'after_today',
    'x_days_ago',
    'x_days_later',
    'before_last_x_days',
    'after_last_x_days',
    'in_last_x_days',
    'in_next_x_days',
    'weekday_is',
    'monthday_is',
    'weekdays',
    'empty',
    'not empty',
  ],
  DATETIME: [
    '=',
    '<>',
    '>',
    '<',
    'between',
    'today',
    'yesterday',
    'tomorrow',
    'this_week',
    'last_week',
    'next_week',
    'this_month',
    'last_month',
    'next_month',
    'this_year',
    'last_year',
    'next_year',
    'first_quarter',
    'second_quarter',
    'third_quarter',
    'fourth_quarter',
    'last_3_months',
    'last_6_months',
    'last_7_days',
    'last_15_days',
    'last_30_days',
    'last_60_days',
    'last_90_days',
    'last_120_days',
    'next_7_days',
    'next_15_days',
    'next_30_days',
    'next_60_days',
    'next_90_days',
    'next_120_days',
    'before_today',
    'after_today',
    'x_days_ago',
    'x_days_later',
    'before_last_x_days',
    'after_last_x_days',
    'in_last_x_days',
    'in_next_x_days',
    'weekday_is',
    'monthday_is',
    'time_is',
    'time_greater',
    'time_greater_or_equals',
    'time_lower',
    'time_lower_or_equals',
    'empty',
    'not empty',
  ],
  FILE: ['empty', 'not empty'],
  FOLLOWER: [
    'contains',
    'not like',
    'contains_active_user',
    'not_contains_active_user',
    'contains_member_of_active_user_team',
    'empty',
    'not empty',
  ],
  JSON: [
    'json_key_is',
    'json_key_is_not',
    'json_key_is_empty',
    'json_key_is_not_empty',
    'empty',
    'not empty',
  ],
  LIST: ['is one of', 'is none of', 'empty', 'not empty'],
  MULTISELECT: [
    'contains any',
    'contains all',
    'not contains',
    'empty',
    'not empty',
  ],
  NUMERIC: ['=', '!=', '<', '<=', '>', '>=', 'between', 'empty', 'not empty'],
  OWNER: [
    '=',
    '<>',
    'active_user',
    'not_active_user',
    'in_role',
    'not_in_role',
    'in_team',
    'not_in_team',
    'in_active_user_team',
    'not_in_active_user_team',
    'in_active_user_scope',
    'not_in_active_user_scope',
    'in_unit',
    'not_in_unit',
    'in_sub_unit',
    'not_in_sub_unit',
    'empty',
    'not empty',
  ],
  RELATION: ['is one of', 'is none of', 'empty', 'not empty'],
  TIME: ['=', '<>', '>', '<', 'empty', 'not empty'],
}

export const OPERATORS_BY_GROUP: Record<FilterGroup, RawOperatorEntry[]> =
  (() => {
    const map: Partial<Record<FilterGroup, RawOperatorEntry[]>> = {}

    for (const op of RAW_OPERATORS) {
      ;(map[op.group] ??= []).push(op)
    }

    /*
     * Override LIST: backend single-select fields ("=" / "<>") are presented as
     * multi-value "is one of" / "is none of" picks in the UI, with the value
     * being an array of enum-option UUIDs. The empty / not-empty operators are
     * preserved.
     */
    map.LIST = [
      { operator: 'is one of', group: 'LIST', no_value_field: false },
      { operator: 'is none of', group: 'LIST', no_value_field: false },
      { operator: 'empty', group: 'LIST', no_value_field: true },
      { operator: 'not empty', group: 'LIST', no_value_field: true },
    ]

    /*
     * Override RELATION: relation fields are picked from the related data
     * source's records. The UI uses the same multi-value "is one of" /
     * "is none of" semantics as LIST, with the value being an array of
     * related-record UUIDs.
     */
    map.RELATION = [
      { operator: 'is one of', group: 'RELATION', no_value_field: false },
      { operator: 'is none of', group: 'RELATION', no_value_field: false },
      { operator: 'empty', group: 'RELATION', no_value_field: true },
      { operator: 'not empty', group: 'RELATION', no_value_field: true },
    ]

    for (const grp of Object.keys(map) as FilterGroup[]) {
      const order = GROUP_ORDER[grp] ?? []
      const list = map[grp] ?? []

      list.sort((a, b) => {
        const ai = order.indexOf(a.operator)
        const bi = order.indexOf(b.operator)

        if (ai === -1 && bi === -1) return a.operator.localeCompare(b.operator)

        if (ai === -1) return 1

        if (bi === -1) return -1

        return ai - bi
      })
    }

    return map as Record<FilterGroup, RawOperatorEntry[]>
  })()

export const NO_VALUE_OPERATORS: ReadonlySet<string> = new Set(
  RAW_OPERATORS.filter((o) => o.no_value_field).map((o) => o.operator),
)

export const BETWEEN_OPERATORS: ReadonlySet<string> = new Set(['between'])

/*
 * Operators that should render a numeric input regardless of the field's
 * declared input type (e.g. "X days ago", "weekday is", "day of month is").
 */
export const NUMBER_VALUE_OPERATORS: ReadonlySet<string> = new Set([
  'x_days_ago',
  'x_days_later',
  'before_last_x_days',
  'after_last_x_days',
  'in_last_x_days',
  'in_next_x_days',
  'weekday_is',
  'monthday_is',
])

export const TIME_VALUE_OPERATORS: ReadonlySet<string> = new Set([
  'time_is',
  'time_greater',
  'time_greater_or_equals',
  'time_lower',
  'time_lower_or_equals',
])

export const WEEKDAYS_OPERATORS: ReadonlySet<string> = new Set(['weekdays'])

export const OTHER_FIELD_OPERATORS: ReadonlySet<string> = new Set([
  'is_other_field',
  'is_not_other_field',
])

export const MULTI_VALUE_OPERATORS: ReadonlySet<string> = new Set([
  'contains any',
  'contains all',
  'not contains',
  'contains',
])

/*
 * Operators whose value is an array (rendered as a multi-select). Used by the
 * LIST group to present `field-select` / `field-radioGroup` / `field-status`
 * fields with "is one of" / "is none of" semantics — the value sent to the
 * backend is an array of enum-option UUIDs.
 */
export const ARRAY_VALUE_OPERATORS: ReadonlySet<string> = new Set([
  'is one of',
  'is none of',
])

export const JSON_KEY_OPERATORS: ReadonlySet<string> = new Set([
  'json_key_is',
  'json_key_is_not',
])

export const JSON_KEY_NO_VALUE_OPERATORS: ReadonlySet<string> = new Set([
  'json_key_is_empty',
  'json_key_is_not_empty',
])

/*
 * Maps a Docyrus field type (`field-text`, `field-number`, ...) to a filter
 * group. Fields with no entry fall back to ALPHA so they can still be filtered.
 */
export const FIELD_TYPE_TO_FILTER_GROUP: Record<string, FilterGroup> = {
  'field-text': 'ALPHA',
  'field-textarea': 'ALPHA',
  'field-email': 'ALPHA',
  'field-phone': 'ALPHA',
  'field-url': 'ALPHA',
  'field-color': 'ALPHA',
  'field-icon': 'ALPHA',
  'field-htmlEditor': 'ALPHA',
  'field-docEditor': 'ALPHA',
  'field-markdown': 'ALPHA',
  'field-password': 'ALPHA',
  'field-code': 'CODE',
  'field-number': 'NUMERIC',
  'field-money': 'NUMERIC',
  'field-percent': 'NUMERIC',
  'field-currency': 'NUMERIC',
  'field-duration': 'NUMERIC',
  'field-rating': 'NUMERIC',
  'field-autonumber': 'NUMERIC',
  'field-identity': 'NUMERIC',
  'field-date': 'DATE',
  'field-dateRange': 'DATE',
  'field-dateTime': 'DATETIME',
  'field-time': 'TIME',
  'field-checkbox': 'BOOL',
  'field-switch': 'BOOL',
  'field-toggle': 'BOOL',
  'field-enum': 'LIST',
  'field-select': 'LIST',
  'field-radioGroup': 'LIST',
  'field-status': 'LIST',
  'field-systemEnum': 'LIST',
  'field-multiSelect': 'MULTISELECT',
  'field-tagSelect': 'MULTISELECT',
  'field-checkboxGroup': 'MULTISELECT',
  'field-file': 'FILE',
  'field-image': 'FILE',
  'field-attachment': 'FILE',
  'field-owner': 'OWNER',
  'field-user': 'OWNER',
  'field-userSelect': 'OWNER',
  'field-employee': 'OWNER',
  'field-createdBy': 'OWNER',
  'field-updatedBy': 'OWNER',
  'field-follower': 'FOLLOWER',
  'field-followers': 'FOLLOWER',
  'field-userMultiSelect': 'FOLLOWER',
  'field-relation': 'RELATION',
  'field-relationSelect': 'RELATION',
  'field-lookup': 'RELATION',
  'field-reference': 'RELATION',
  'field-locationSelect': 'RELATION',
  'field-json': 'JSON',
  'field-object': 'JSON',
  'field-approval': 'APPROVAL',
}

export function getFilterGroupForFieldType(
  fieldType: string | undefined | null,
): FilterGroup {
  if (!fieldType) return 'ALPHA'

  return FIELD_TYPE_TO_FILTER_GROUP[fieldType] ?? 'ALPHA'
}

export const FILTER_GROUP_INPUT_TYPE: Record<FilterGroup, InputType | null> = {
  ALPHA: 'text',
  APPROVAL: 'text',
  BOOL: 'text',
  CODE: 'text',
  COMMON: 'text',
  DATE: 'date',
  DATETIME: 'datetime-local',
  FILE: 'text',
  FOLLOWER: 'text',
  JSON: 'text',
  LIST: 'text',
  MULTISELECT: 'text',
  NUMERIC: 'number',
  OWNER: 'text',
  RELATION: 'text',
  TIME: 'time',
}

/*
 * Default valueEditorType for each filter group when rendering a "regular"
 * operator (i.e. an operator that takes a value).
 */
export const FILTER_GROUP_VALUE_EDITOR_TYPE: Record<
  FilterGroup,
  ValueEditorType
> = {
  ALPHA: 'text',
  APPROVAL: 'select',
  BOOL: 'checkbox',
  CODE: 'text',
  COMMON: 'text',
  DATE: 'text',
  DATETIME: 'text',
  FILE: 'text',
  FOLLOWER: 'multiselect',
  JSON: 'text',
  LIST: 'select',
  MULTISELECT: 'multiselect',
  NUMERIC: 'text',
  OWNER: 'select',
  RELATION: 'select',
  TIME: 'text',
}

/*
 * Convert a group's raw operators into FullOperator[] suitable for
 * react-querybuilder's `operators` field-level prop. No-value operators get
 * `arity: 'unary'` so the default ValueEditor short-circuits, and our own
 * QBValueEditor checks NO_VALUE_OPERATORS too as a safety net.
 */
export function getOperatorsForGroup(group: FilterGroup): FullOperator[] {
  const ops = OPERATORS_BY_GROUP[group] ?? []

  return ops.map((op) => {
    const base: FullOperator = {
      name: op.operator,
      value: op.operator,
      label: OPERATOR_LABELS[op.operator] ?? op.operator,
    }

    if (op.no_value_field) base.arity = 'unary'

    return base
  })
}

/*
 * Resolve a per-operator valueEditorType for the given filter group.
 * Returns `null` for no-value operators so RQB renders nothing.
 */
export function resolveValueEditorType(
  group: FilterGroup,
  operator: string,
  fallback: ValueEditorType,
): ValueEditorType {
  if (NO_VALUE_OPERATORS.has(operator)) return null

  if (ARRAY_VALUE_OPERATORS.has(operator)) return 'multiselect'

  if (WEEKDAYS_OPERATORS.has(operator)) return 'multiselect'

  if (
    NUMBER_VALUE_OPERATORS.has(operator) ||
    TIME_VALUE_OPERATORS.has(operator)
  )
    return 'text'

  if (BETWEEN_OPERATORS.has(operator)) return 'text'

  if (OTHER_FIELD_OPERATORS.has(operator)) return 'select'

  if (JSON_KEY_OPERATORS.has(operator)) return 'text'

  if (JSON_KEY_NO_VALUE_OPERATORS.has(operator)) return 'text'

  return fallback ?? FILTER_GROUP_VALUE_EDITOR_TYPE[group]
}

export function resolveInputType(
  group: FilterGroup,
  operator: string,
  fallback: InputType | null | undefined,
): InputType | null {
  if (NUMBER_VALUE_OPERATORS.has(operator)) return 'number'

  if (TIME_VALUE_OPERATORS.has(operator)) return 'time'

  return (fallback ?? FILTER_GROUP_INPUT_TYPE[group] ?? 'text') as InputType
}

export const WEEKDAY_OPTIONS: Array<{
  name: string
  value: string
  label: string
}> = [
  { name: '1', value: '1', label: 'Monday' },
  { name: '2', value: '2', label: 'Tuesday' },
  { name: '3', value: '3', label: 'Wednesday' },
  { name: '4', value: '4', label: 'Thursday' },
  { name: '5', value: '5', label: 'Friday' },
  { name: '6', value: '6', label: 'Saturday' },
  { name: '0', value: '0', label: 'Sunday' },
]
