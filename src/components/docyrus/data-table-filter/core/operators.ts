// @ts-nocheck
/* eslint-disable */
import {
  type ColumnDataType,
  type FilterDetails,
  type FilterOperatorTarget,
  type FilterOperators,
  type FilterTypeOperatorDetails,
  type FilterValues,
} from './types'

export const DEFAULT_OPERATORS: Record<
  ColumnDataType,
  Record<FilterOperatorTarget, FilterOperators[ColumnDataType]>
> = {
  text: {
    single: 'contains',
    multiple: 'contains',
  },
  number: {
    single: 'is',
    multiple: 'is between',
  },
  date: {
    single: 'is',
    multiple: 'is between',
  },
  option: {
    single: 'is',
    multiple: 'is any of',
  },
  multiOption: {
    single: 'include',
    multiple: 'include any of',
  },
  boolean: {
    single: 'is',
    multiple: 'is',
  },
  uuid: {
    single: 'is',
    multiple: 'is',
  },
}

/* Details for all the filter operators for option data type */
export const optionFilterOperators = {
  is: {
    key: 'filters.option.is',
    value: 'is',
    target: 'single',
    singularOf: 'is any of',
    relativeOf: 'is not',
    isNegated: false,
    negation: 'is not',
  },
  'is not': {
    key: 'filters.option.isNot',
    value: 'is not',
    target: 'single',
    singularOf: 'is none of',
    relativeOf: 'is',
    isNegated: true,
    negationOf: 'is',
  },
  'is any of': {
    key: 'filters.option.isAnyOf',
    value: 'is any of',
    target: 'multiple',
    pluralOf: 'is',
    relativeOf: 'is none of',
    isNegated: false,
    negation: 'is none of',
  },
  'is none of': {
    key: 'filters.option.isNoneOf',
    value: 'is none of',
    target: 'multiple',
    pluralOf: 'is not',
    relativeOf: 'is any of',
    isNegated: true,
    negationOf: 'is any of',
  },
} as const satisfies FilterDetails<'option'>

/* Details for all the filter operators for multi-option data type */
export const multiOptionFilterOperators = {
  include: {
    key: 'filters.multiOption.include',
    value: 'include',
    target: 'single',
    singularOf: 'include any of',
    relativeOf: 'exclude',
    isNegated: false,
    negation: 'exclude',
  },
  exclude: {
    key: 'filters.multiOption.exclude',
    value: 'exclude',
    target: 'single',
    singularOf: 'exclude if any of',
    relativeOf: 'include',
    isNegated: true,
    negationOf: 'include',
  },
  'include any of': {
    key: 'filters.multiOption.includeAnyOf',
    value: 'include any of',
    target: 'multiple',
    pluralOf: 'include',
    relativeOf: ['exclude if all', 'include all of', 'exclude if any of'],
    isNegated: false,
    negation: 'exclude if all',
  },
  'exclude if all': {
    key: 'filters.multiOption.excludeIfAll',
    value: 'exclude if all',
    target: 'multiple',
    pluralOf: 'exclude',
    relativeOf: ['include any of', 'include all of', 'exclude if any of'],
    isNegated: true,
    negationOf: 'include any of',
  },
  'include all of': {
    key: 'filters.multiOption.includeAllOf',
    value: 'include all of',
    target: 'multiple',
    pluralOf: 'include',
    relativeOf: ['include any of', 'exclude if all', 'exclude if any of'],
    isNegated: false,
    negation: 'exclude if any of',
  },
  'exclude if any of': {
    key: 'filters.multiOption.excludeIfAnyOf',
    value: 'exclude if any of',
    target: 'multiple',
    pluralOf: 'exclude',
    relativeOf: ['include any of', 'exclude if all', 'include all of'],
    isNegated: true,
    negationOf: 'include all of',
  },
} as const satisfies FilterDetails<'multiOption'>

/*
 * Date filter operators include both:
 * - Calendar-based comparison ("is", "is between", etc.) — user picks a date
 * - Relative-date operators ("today", "last7Days", "xDaysAgo", etc.) —
 *   resolved against today at query time on the backend (matches the
 *   FILTER_OPERATORS constants in libs/shared)
 *
 * Relative operators are flagged via `isRelativeDateOperator()` (see
 * helper at bottom of file) so the filter UI can render them without a
 * calendar picker.
 */

/*
 * `relativeOf` lists every other date operator so the operator dropdown
 * shows the full set when the user clicks the operator chip. We don't
 * compute this per-entry — it would be O(n²) to maintain — so a shared
 * array does the trick.
 */
const ALL_DATE_OPERATORS = [
  'is',
  'is not',
  'is before',
  'is on or after',
  'is after',
  'is on or before',
  'is between',
  'is not between',
  'today',
  'tomorrow',
  'yesterday',
  'last7Days',
  'last15Days',
  'last30Days',
  'last60Days',
  'last90Days',
  'last120Days',
  'next7Days',
  'next15Days',
  'next30Days',
  'next60Days',
  'next90Days',
  'next120Days',
  'lastWeek',
  'thisWeek',
  'nextWeek',
  'lastMonth',
  'thisMonth',
  'nextMonth',
  'beforeToday',
  'afterToday',
  'lastYear',
  'thisYear',
  'nextYear',
  'firstQuarter',
  'secondQuarter',
  'thirdQuarter',
  'fourthQuarter',
  'last3Months',
  'last6Months',
  'xDaysAgo',
  'xDaysLater',
  'beforeLastXDays',
  'inLastXDays',
  'afterLastXDays',
  'inNextXDays',
] as const satisfies ReadonlyArray<FilterOperators['date']>

function dateOperatorRelativeOf(
  current: FilterOperators['date'],
): Array<FilterOperators['date']> {
  return ALL_DATE_OPERATORS.filter((op) => op !== current)
}

function relativeDateOperator<V extends FilterOperators['date']>(
  value: V,
  key: string,
) {
  return {
    key,
    value,
    target: 'single' as const,
    /*
     * Relative operators don't have a meaningful negation — the type
     * system requires `negation`, so we self-reference. The UI never
     * surfaces a negation toggle for relative operators.
     */
    isNegated: false as const,
    negation: value,
    relativeOf: dateOperatorRelativeOf(value),
  }
}

/* Details for all the filter operators for date data type */
export const dateFilterOperators = {
  is: {
    key: 'filters.date.is',
    value: 'is',
    target: 'single',
    singularOf: 'is between',
    relativeOf: dateOperatorRelativeOf('is'),
    isNegated: false,
    negation: 'is not',
  },
  'is not': {
    key: 'filters.date.isNot',
    value: 'is not',
    target: 'single',
    singularOf: 'is not between',
    relativeOf: dateOperatorRelativeOf('is not'),
    isNegated: true,
    negationOf: 'is',
  },
  'is before': {
    key: 'filters.date.isBefore',
    value: 'is before',
    target: 'single',
    singularOf: 'is between',
    relativeOf: dateOperatorRelativeOf('is before'),
    isNegated: false,
    negation: 'is on or after',
  },
  'is on or after': {
    key: 'filters.date.isOnOrAfter',
    value: 'is on or after',
    target: 'single',
    singularOf: 'is between',
    relativeOf: dateOperatorRelativeOf('is on or after'),
    isNegated: false,
    negation: 'is before',
  },
  'is after': {
    key: 'filters.date.isAfter',
    value: 'is after',
    target: 'single',
    singularOf: 'is between',
    relativeOf: dateOperatorRelativeOf('is after'),
    isNegated: false,
    negation: 'is on or before',
  },
  'is on or before': {
    key: 'filters.date.isOnOrBefore',
    value: 'is on or before',
    target: 'single',
    singularOf: 'is between',
    relativeOf: dateOperatorRelativeOf('is on or before'),
    isNegated: false,
    negation: 'is after',
  },
  'is between': {
    key: 'filters.date.isBetween',
    value: 'is between',
    target: 'multiple',
    pluralOf: 'is',
    relativeOf: dateOperatorRelativeOf('is between'),
    isNegated: false,
    negation: 'is not between',
  },
  'is not between': {
    key: 'filters.date.isNotBetween',
    value: 'is not between',
    target: 'multiple',
    pluralOf: 'is not',
    relativeOf: dateOperatorRelativeOf('is not between'),
    isNegated: true,
    negationOf: 'is between',
  },
  today: relativeDateOperator('today', 'filters.date.today'),
  tomorrow: relativeDateOperator('tomorrow', 'filters.date.tomorrow'),
  yesterday: relativeDateOperator('yesterday', 'filters.date.yesterday'),
  last7Days: relativeDateOperator('last7Days', 'filters.date.last7Days'),
  last15Days: relativeDateOperator('last15Days', 'filters.date.last15Days'),
  last30Days: relativeDateOperator('last30Days', 'filters.date.last30Days'),
  last60Days: relativeDateOperator('last60Days', 'filters.date.last60Days'),
  last90Days: relativeDateOperator('last90Days', 'filters.date.last90Days'),
  last120Days: relativeDateOperator('last120Days', 'filters.date.last120Days'),
  next7Days: relativeDateOperator('next7Days', 'filters.date.next7Days'),
  next15Days: relativeDateOperator('next15Days', 'filters.date.next15Days'),
  next30Days: relativeDateOperator('next30Days', 'filters.date.next30Days'),
  next60Days: relativeDateOperator('next60Days', 'filters.date.next60Days'),
  next90Days: relativeDateOperator('next90Days', 'filters.date.next90Days'),
  next120Days: relativeDateOperator('next120Days', 'filters.date.next120Days'),
  lastWeek: relativeDateOperator('lastWeek', 'filters.date.lastWeek'),
  thisWeek: relativeDateOperator('thisWeek', 'filters.date.thisWeek'),
  nextWeek: relativeDateOperator('nextWeek', 'filters.date.nextWeek'),
  lastMonth: relativeDateOperator('lastMonth', 'filters.date.lastMonth'),
  thisMonth: relativeDateOperator('thisMonth', 'filters.date.thisMonth'),
  nextMonth: relativeDateOperator('nextMonth', 'filters.date.nextMonth'),
  beforeToday: relativeDateOperator('beforeToday', 'filters.date.beforeToday'),
  afterToday: relativeDateOperator('afterToday', 'filters.date.afterToday'),
  lastYear: relativeDateOperator('lastYear', 'filters.date.lastYear'),
  thisYear: relativeDateOperator('thisYear', 'filters.date.thisYear'),
  nextYear: relativeDateOperator('nextYear', 'filters.date.nextYear'),
  firstQuarter: relativeDateOperator(
    'firstQuarter',
    'filters.date.firstQuarter',
  ),
  secondQuarter: relativeDateOperator(
    'secondQuarter',
    'filters.date.secondQuarter',
  ),
  thirdQuarter: relativeDateOperator(
    'thirdQuarter',
    'filters.date.thirdQuarter',
  ),
  fourthQuarter: relativeDateOperator(
    'fourthQuarter',
    'filters.date.fourthQuarter',
  ),
  last3Months: relativeDateOperator('last3Months', 'filters.date.last3Months'),
  last6Months: relativeDateOperator('last6Months', 'filters.date.last6Months'),
  xDaysAgo: relativeDateOperator('xDaysAgo', 'filters.date.xDaysAgo'),
  xDaysLater: relativeDateOperator('xDaysLater', 'filters.date.xDaysLater'),
  beforeLastXDays: relativeDateOperator(
    'beforeLastXDays',
    'filters.date.beforeLastXDays',
  ),
  inLastXDays: relativeDateOperator('inLastXDays', 'filters.date.inLastXDays'),
  afterLastXDays: relativeDateOperator(
    'afterLastXDays',
    'filters.date.afterLastXDays',
  ),
  inNextXDays: relativeDateOperator('inNextXDays', 'filters.date.inNextXDays'),
} as const satisfies FilterDetails<'date'>

/**
 * Relative-date operators don't take a calendar value — the popover
 * renders without a date picker, with an optional numeric input for
 * the `*XDays`/`x_days_*` variants.
 */
const RELATIVE_DATE_OPERATORS = new Set<FilterOperators['date']>([
  'today',
  'tomorrow',
  'yesterday',
  'last7Days',
  'last15Days',
  'last30Days',
  'last60Days',
  'last90Days',
  'last120Days',
  'next7Days',
  'next15Days',
  'next30Days',
  'next60Days',
  'next90Days',
  'next120Days',
  'lastWeek',
  'thisWeek',
  'nextWeek',
  'lastMonth',
  'thisMonth',
  'nextMonth',
  'beforeToday',
  'afterToday',
  'lastYear',
  'thisYear',
  'nextYear',
  'firstQuarter',
  'secondQuarter',
  'thirdQuarter',
  'fourthQuarter',
  'last3Months',
  'last6Months',
  'xDaysAgo',
  'xDaysLater',
  'beforeLastXDays',
  'inLastXDays',
  'afterLastXDays',
  'inNextXDays',
])

const X_DAYS_RELATIVE_OPERATORS = new Set<FilterOperators['date']>([
  'xDaysAgo',
  'xDaysLater',
  'beforeLastXDays',
  'inLastXDays',
  'afterLastXDays',
  'inNextXDays',
])

export function isRelativeDateOperator(
  operator: FilterOperators['date'],
): boolean {
  return RELATIVE_DATE_OPERATORS.has(operator)
}

export function isXDaysRelativeOperator(
  operator: FilterOperators['date'],
): boolean {
  return X_DAYS_RELATIVE_OPERATORS.has(operator)
}

/* Details for all the filter operators for text data type */
export const textFilterOperators = {
  contains: {
    key: 'filters.text.contains',
    value: 'contains',
    target: 'single',
    relativeOf: 'does not contain',
    isNegated: false,
    negation: 'does not contain',
  },
  'does not contain': {
    key: 'filters.text.doesNotContain',
    value: 'does not contain',
    target: 'single',
    relativeOf: 'contains',
    isNegated: true,
    negationOf: 'contains',
  },
} as const satisfies FilterDetails<'text'>

/* Details for all the filter operators for number data type */
export const numberFilterOperators = {
  is: {
    key: 'filters.number.is',
    value: 'is',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is not',
      'is greater than',
      'is less than or equal to',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is not',
  },
  'is not': {
    key: 'filters.number.isNot',
    value: 'is not',
    target: 'single',
    singularOf: 'is not between',
    relativeOf: [
      'is',
      'is greater than',
      'is less than or equal to',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: true,
    negationOf: 'is',
  },
  'is greater than': {
    key: 'filters.number.greaterThan',
    value: 'is greater than',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is less than or equal to',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is less than or equal to',
  },
  'is greater than or equal to': {
    key: 'filters.number.greaterThanOrEqual',
    value: 'is greater than or equal to',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is greater than',
      'is less than or equal to',
      'is less than',
    ],
    isNegated: false,
    negation: 'is less than or equal to',
  },
  'is less than': {
    key: 'filters.number.lessThan',
    value: 'is less than',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is greater than',
      'is less than or equal to',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is greater than',
  },
  'is less than or equal to': {
    key: 'filters.number.lessThanOrEqual',
    value: 'is less than or equal to',
    target: 'single',
    singularOf: 'is between',
    relativeOf: [
      'is',
      'is not',
      'is greater than',
      'is less than',
      'is greater than or equal to',
    ],
    isNegated: false,
    negation: 'is greater than or equal to',
  },
  'is between': {
    key: 'filters.number.isBetween',
    value: 'is between',
    target: 'multiple',
    pluralOf: 'is',
    relativeOf: 'is not between',
    isNegated: false,
    negation: 'is not between',
  },
  'is not between': {
    key: 'filters.number.isNotBetween',
    value: 'is not between',
    target: 'multiple',
    pluralOf: 'is not',
    relativeOf: 'is between',
    isNegated: true,
    negationOf: 'is between',
  },
} as const satisfies FilterDetails<'number'>

/* Details for all the filter operators for boolean data type */
export const booleanFilterOperators = {
  is: {
    key: 'filters.boolean.is',
    value: 'is',
    target: 'single',
    relativeOf: 'is not',
    isNegated: false,
    negation: 'is not',
  },
  'is not': {
    key: 'filters.boolean.isNot',
    value: 'is not',
    target: 'single',
    relativeOf: 'is',
    isNegated: true,
    negationOf: 'is',
  },
  'is empty': {
    key: 'filters.boolean.isEmpty',
    value: 'is empty',
    target: 'single',
    relativeOf: 'is not empty',
    isNegated: false,
    negation: 'is not empty',
  },
  'is not empty': {
    key: 'filters.boolean.isNotEmpty',
    value: 'is not empty',
    target: 'single',
    relativeOf: 'is empty',
    isNegated: true,
    negationOf: 'is empty',
  },
} as const satisfies FilterDetails<'boolean'>

/*
 * Details for all the filter operators for uuid data type. Mirrors the
 * boolean operator set (is / is not / is empty / is not empty) — uuid
 * columns filter by exact equality only, never substring/`LIKE`.
 */
export const uuidFilterOperators = {
  is: {
    key: 'filters.uuid.is',
    value: 'is',
    target: 'single',
    relativeOf: 'is not',
    isNegated: false,
    negation: 'is not',
  },
  'is not': {
    key: 'filters.uuid.isNot',
    value: 'is not',
    target: 'single',
    relativeOf: 'is',
    isNegated: true,
    negationOf: 'is',
  },
  'is empty': {
    key: 'filters.uuid.isEmpty',
    value: 'is empty',
    target: 'single',
    relativeOf: 'is not empty',
    isNegated: false,
    negation: 'is not empty',
  },
  'is not empty': {
    key: 'filters.uuid.isNotEmpty',
    value: 'is not empty',
    target: 'single',
    relativeOf: 'is empty',
    isNegated: true,
    negationOf: 'is empty',
  },
} as const satisfies FilterDetails<'uuid'>

export const filterTypeOperatorDetails: FilterTypeOperatorDetails = {
  text: textFilterOperators,
  number: numberFilterOperators,
  date: dateFilterOperators,
  option: optionFilterOperators,
  multiOption: multiOptionFilterOperators,
  boolean: booleanFilterOperators,
  uuid: uuidFilterOperators,
}

/*
 *
 * Determines the new operator for a filter based on the current operator, old and new filter values.
 *
 * This handles cases where the filter values have transitioned from a single value to multiple values (or vice versa),
 * and the current operator needs to be transitioned to its plural form (or singular form).
 *
 * For example, if the current operator is 'is', and the new filter values have a length of 2, the
 * new operator would be 'is any of'.
 *
 */
export function determineNewOperator<TType extends ColumnDataType>(
  type: TType,
  oldVals: FilterValues<TType>,
  nextVals: FilterValues<TType>,
  currentOperator: FilterOperators[TType],
): FilterOperators[TType] {
  const a =
    Array.isArray(oldVals) && Array.isArray(oldVals[0])
      ? oldVals[0].length
      : oldVals.length
  const b =
    Array.isArray(nextVals) && Array.isArray(nextVals[0])
      ? nextVals[0].length
      : nextVals.length

  /*
   * If filter size has not transitioned from single to multiple (or vice versa)
   * or is unchanged, return the current operator.
   */
  if (a === b || (a >= 2 && b >= 2) || (a <= 1 && b <= 1))
    return currentOperator

  const opDetails = filterTypeOperatorDetails[type][currentOperator]

  if (a < b && b >= 2) return opDetails.singularOf ?? currentOperator
  if (a > b && b <= 1) return opDetails.pluralOf ?? currentOperator

  return currentOperator
}
