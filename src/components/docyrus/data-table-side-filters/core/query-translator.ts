import { type RuleGroupType, type RuleType } from 'react-querybuilder'

import {
  type ColumnConfig,
  type ColumnDataType,
  type FilterModel,
  type FiltersState,
} from '@/components/docyrus/data-table-filter/core/types'

import { DEFAULT_OPERATORS } from '@/components/docyrus/data-table-filter/core/operators'

import { type SideFilterCombinator, type SideFilterOperatorMap } from './types'

export const DEFAULT_OPERATOR_MAP: SideFilterOperatorMap = {
  text: {
    contains: 'contains',
    'does not contain': 'doesNotContain',
  },
  number: {
    is: '=',
    'is not': '!=',
    'is less than': '<',
    'is greater than': '>',
    'is less than or equal to': '<=',
    'is greater than or equal to': '>=',
    'is between': 'between',
    'is not between': 'notBetween',
  },
  date: {
    is: '=',
    'is not': '!=',
    'is before': '<',
    'is after': '>',
    'is on or after': '>=',
    'is on or before': '<=',
    'is between': 'between',
    'is not between': 'notBetween',
  },
  option: {
    is: '=',
    'is not': '!=',
    'is any of': 'in',
    'is none of': 'notIn',
  },
  multiOption: {
    include: 'contains',
    exclude: 'doesNotContain',
    'include any of': 'in',
    'include all of': 'containsAll',
    'exclude if any of': 'notIn',
    'exclude if all': 'doesNotContainAll',
  },
  boolean: {
    is: '=',
    'is not': '!=',
    'is empty': 'null',
    'is not empty': 'notNull',
  },
}

const RANGE_QB_OPERATORS = new Set(['between', 'notBetween'])
const ARRAY_QB_OPERATORS = new Set([
  'in',
  'notIn',
  'containsAll',
  'doesNotContainAll',
])
const NULLARY_QB_OPERATORS = new Set(['null', 'notNull'])

function buildReverseMap(map: SideFilterOperatorMap) {
  const reverse: Record<ColumnDataType, Record<string, string>> = {
    text: {},
    number: {},
    date: {},
    option: {},
    multiOption: {},
    boolean: {},
  }

  for (const type of Object.keys(map) as Array<ColumnDataType>) {
    const sub = map[type] as Record<string, string>

    for (const [dtfOp, qbOp] of Object.entries(sub)) {
      if (!qbOp) continue
      const target = reverse[type] as Record<string, string>

      if (target[qbOp] === undefined) target[qbOp] = dtfOp
    }
  }

  return reverse
}

function ruleValueFromFilter<TType extends ColumnDataType>(
  filter: FilterModel<TType>,
  qbOperator: string,
): unknown {
  if (NULLARY_QB_OPERATORS.has(qbOperator)) return null
  if (RANGE_QB_OPERATORS.has(qbOperator)) {
    const [from, to] = filter.values as Array<unknown>

    return [from, to]
  }
  if (ARRAY_QB_OPERATORS.has(qbOperator)) return [...filter.values]
  if (filter.values.length <= 1) return filter.values[0]

  return [...filter.values]
}

export function filtersStateToRuleGroup(
  state: FiltersState,
  combinator: SideFilterCombinator = 'and',
  operatorMap: SideFilterOperatorMap = DEFAULT_OPERATOR_MAP,
): RuleGroupType {
  const rules: Array<RuleType> = state
    .filter(
      (f) =>
        f.values.length > 0 ||
        f.operator === 'is empty' ||
        f.operator === 'is not empty',
    )
    .map((filter) => {
      const filterType = filter.type as ColumnDataType
      const sub = operatorMap[filterType] as Record<string, string> | undefined
      const qbOperator = sub?.[filter.operator] ?? filter.operator

      return {
        field: filter.columnId,
        operator: qbOperator,
        value: ruleValueFromFilter(filter, qbOperator),
      } satisfies RuleType
    })

  return { combinator, rules }
}

function valuesFromRule(rule: RuleType, type: ColumnDataType): Array<unknown> {
  const value = rule.value as unknown

  if (NULLARY_QB_OPERATORS.has(rule.operator)) return []
  if (Array.isArray(value)) return value
  if (
    typeof value === 'string' &&
    (RANGE_QB_OPERATORS.has(rule.operator) ||
      ARRAY_QB_OPERATORS.has(rule.operator))
  ) {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }

  if (value === null || value === undefined || value === '') return []

  if (type === 'date' && !(value instanceof Date)) {
    const parsed = new Date(value as string | number)

    return Number.isNaN(parsed.getTime()) ? [] : [parsed]
  }

  if (type === 'number' && typeof value !== 'number') {
    const parsed = Number(value)

    return Number.isNaN(parsed) ? [] : [parsed]
  }

  return [value]
}

function flattenRules(group: RuleGroupType): Array<RuleType> {
  const out: Array<RuleType> = []

  for (const r of group.rules) {
    if (typeof r === 'string') continue
    if ('rules' in r) {
      out.push(...flattenRules(r))
    } else {
      out.push(r)
    }
  }

  return out
}

export function ruleGroupToFiltersState(
  group: RuleGroupType,
  columns: ReadonlyArray<ColumnConfig<unknown>>,
  operatorMap: SideFilterOperatorMap = DEFAULT_OPERATOR_MAP,
): FiltersState {
  const reverse = buildReverseMap(operatorMap)
  const byId = new Map(columns.map((c) => [c.id, c]))
  const out: FiltersState = []

  for (const rule of flattenRules(group)) {
    const column = byId.get(rule.field)

    if (!column) continue
    const type = column.type as ColumnDataType
    const reverseSub = reverse[type] as Record<string, string>
    const dtfOperator =
      reverseSub[rule.operator] ??
      (rule.operator in (operatorMap[type] as object)
        ? rule.operator
        : undefined) ??
      DEFAULT_OPERATORS[type].single
    const values = valuesFromRule(rule, type)

    if (
      values.length === 0 &&
      dtfOperator !== 'is empty' &&
      dtfOperator !== 'is not empty'
    ) {
      continue
    }

    out.push({
      columnId: column.id,
      type,
      operator: dtfOperator,
      values,
    } as FilterModel)
  }

  return out
}
