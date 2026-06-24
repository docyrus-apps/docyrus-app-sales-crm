// @ts-nocheck
/* eslint-disable */
import { type Row } from '@tanstack/react-table'
import jsonata from 'jsonata'

import { resolveColorHex } from '@/lib/docyrus/tailwind-colors'

import { type DataGridCellColorRule, type DataGridRowColorRule } from '../types'

interface CompiledRule {
  expression: jsonata.Expression
  color: string
}

interface CompiledCellRule extends CompiledRule {
  column: string
}

export function compileRowColorRules(
  rules: Array<DataGridRowColorRule>,
): Array<CompiledRule> {
  const compiled: Array<CompiledRule> = []

  for (const rule of rules) {
    try {
      compiled.push({
        expression: jsonata(rule.formula),
        color: resolveColorHex(rule.color),
      })
    } catch {}
  }

  return compiled
}

export function compileCellColorRules(
  rules: Array<DataGridCellColorRule>,
): Array<CompiledCellRule> {
  const compiled: Array<CompiledCellRule> = []

  for (const rule of rules) {
    try {
      compiled.push({
        column: rule.column,
        expression: jsonata(rule.formula),
        color: resolveColorHex(rule.color),
      })
    } catch {}
  }

  return compiled
}

export async function evaluateRowColorRules<TData>(
  compiledRules: Array<CompiledRule>,
  rows: Array<Row<TData>>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>()

  if (compiledRules.length === 0) return map

  for (const row of rows) {
    const data = row.original

    for (const rule of compiledRules) {
      try {
        const result = await rule.expression.evaluate(
          data as Record<string, unknown>,
        )

        if (result) {
          map.set(row.id, rule.color)
          break
        }
      } catch {}
    }
  }

  return map
}

export async function evaluateCellColorRules<TData>(
  compiledRules: Array<CompiledCellRule>,
  rows: Array<Row<TData>>,
): Promise<Map<string, Map<string, string>>> {
  const map = new Map<string, Map<string, string>>()

  if (compiledRules.length === 0) return map

  const rulesByColumn = new Map<string, Array<CompiledRule>>()

  for (const rule of compiledRules) {
    let columnRules = rulesByColumn.get(rule.column)

    if (!columnRules) {
      columnRules = []
      rulesByColumn.set(rule.column, columnRules)
    }

    columnRules.push(rule)
  }

  for (const row of rows) {
    const data = row.original
    let rowCellColors: Map<string, string> | undefined

    for (const [columnId, rules] of rulesByColumn) {
      for (const rule of rules) {
        try {
          const result = await rule.expression.evaluate(
            data as Record<string, unknown>,
          )

          if (result) {
            if (!rowCellColors) {
              rowCellColors = new Map<string, string>()
              map.set(row.id, rowCellColors)
            }

            rowCellColors.set(columnId, rule.color)
            break
          }
        } catch {}
      }
    }
  }

  return map
}
