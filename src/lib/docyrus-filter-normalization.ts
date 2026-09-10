import { type RuleGroupType } from 'react-querybuilder'

/*
 * Query Builder stores saved-view filters with UI-only keys (`id`,
 * `valueSource`) and display operator labels ("is one of", "is none of")
 * that the backend's strict filter schema rejects. Saved views must be
 * normalised before they are sent to data-source item queries.
 */
const QUERY_BUILDER_OPERATOR_TO_BACKEND: Record<string, string> = {
  'is one of': 'in',
  'is none of': 'not in'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isRuleGroup(value: unknown): value is RuleGroupType {
  return isRecord(value) && Array.isArray(value['rules'])
}

/**
 * Convert a saved view's React Query Builder filter tree into the canonical
 * backend filter-group shape. Returns `undefined` for empty/non-group values.
 */
export function normalizeSavedViewFilterQuery(
  filterQuery: unknown
): RuleGroupType | undefined {
  if (!isRuleGroup(filterQuery) || filterQuery.rules.length === 0) {
    return undefined
  }

  return normalizeSavedViewFilterGroup(filterQuery)
}

function normalizeSavedViewFilterGroup(group: RuleGroupType): RuleGroupType {
  const normalizedRules = (group.rules ?? []).map((rule) => {
    if (isRuleGroup(rule)) {
      return normalizeSavedViewFilterGroup(rule)
    }

    const source = rule as unknown as Record<string, unknown>
    const sourceOperator = source['operator']
    const operator =
      typeof sourceOperator === 'string'
        ? (QUERY_BUILDER_OPERATOR_TO_BACKEND[sourceOperator] ?? sourceOperator)
        : sourceOperator

    const cleaned: Record<string, unknown> = { operator }

    for (const key of [
'field',
'value',
'valueField',
'filterType'
] as const) {
      if (key in source) cleaned[key] = source[key]
    }

    return cleaned
  })

  const result: Record<string, unknown> = {
    combinator: group.combinator,
    rules: normalizedRules
  }

  if ('not' in group) {
    result['not'] = (group as unknown as Record<string, unknown>)['not']
  }

  return result as unknown as RuleGroupType
}
