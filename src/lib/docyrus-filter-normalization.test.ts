import { describe, expect, it } from 'vitest'

import { normalizeSavedViewFilterQuery } from './docyrus-filter-normalization'

describe('normalizeSavedViewFilterQuery', () => {
  it('strips query-builder-only fields and maps display operators', () => {
    const normalized = normalizeSavedViewFilterQuery({
      combinator: 'and',
      rules: [
        {
          id: 'rule-1',
          field: 'lead_status',
          operator: 'is one of',
          value: ['status-new'],
          valueSource: 'value'
        },
        {
          field: 'related_product',
          operator: '=',
          value: 'product-1'
        }
      ]
    })

    expect(normalized).toEqual({
      combinator: 'and',
      rules: [
        {
          operator: 'in',
          field: 'lead_status',
          value: ['status-new']
        },
        {
          operator: '=',
          field: 'related_product',
          value: 'product-1'
        }
      ]
    })
  })

  it('normalizes nested groups recursively', () => {
    const normalized = normalizeSavedViewFilterQuery({
      id: 'group-1',
      combinator: 'or',
      rules: [
        {
          combinator: 'and',
          rules: [
            {
              id: 'rule-2',
              field: 'category',
              operator: 'is none of',
              value: ['archived'],
              valueSource: 'value'
            }
          ]
        }
      ]
    })

    expect(normalized).toEqual({
      combinator: 'or',
      rules: [
        {
          combinator: 'and',
          rules: [
            {
              operator: 'not in',
              field: 'category',
              value: ['archived']
            }
          ]
        }
      ]
    })
  })

  it('returns undefined for empty saved-view filters', () => {
    expect(
      normalizeSavedViewFilterQuery({ combinator: 'and', rules: [] })
    ).toBeUndefined()
  })
})
