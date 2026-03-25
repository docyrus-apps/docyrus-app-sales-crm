import jsonata from 'jsonata';

import { resolveColorHex } from '@/lib/tailwind-colors';

import {
  type PivotGridCellColorRule,
  type PivotGridColorScope,
  type PivotGridRenderedCell
} from '../types';

interface CompiledRule {
  scope?: PivotGridColorScope;
  expression: jsonata.Expression;
  color: string;
}

function getCellScope<TData>(
  cell: PivotGridRenderedCell<TData>
): PivotGridColorScope {
  if (cell.isGrandTotal) {
    return 'grand-total';
  }

  if (cell.isTotal) {
    return 'total';
  }

  if (cell.isSubtotal) {
    return 'subtotal';
  }

  return 'leaf';
}

export function compilePivotGridCellColorRules(
  rules: Array<PivotGridCellColorRule>
): Array<CompiledRule> {
  const compiledRules: Array<CompiledRule> = [];

  for (const rule of rules) {
    try {
      compiledRules.push({
        scope: rule.scope,
        expression: jsonata(rule.formula),
        color: resolveColorHex(rule.color)
      });
    } catch {
    }
  }

  return compiledRules;
}

export async function evaluatePivotGridCellColorRules<TData>(
  compiledRules: Array<CompiledRule>,
  cells: Array<PivotGridRenderedCell<TData>>
): Promise<Map<string, string>> {
  const colorMap = new Map<string, string>();

  if (compiledRules.length === 0) {
    return colorMap;
  }

  for (const cell of cells) {
    const cellScope = getCellScope(cell);

    for (const rule of compiledRules) {
      if (rule.scope && rule.scope !== cellScope) {
        continue;
      }

      try {
        const result = await rule.expression.evaluate({
          value: cell.value,
          measureId: cell.measureId,
          rowPath: cell.rowPath,
          columnPath: cell.columnPath,
          rowDepth: cell.rowPath.length,
          columnDepth: cell.columnPath.length,
          isSubtotal: cell.isSubtotal,
          isTotal: cell.isTotal,
          isGrandTotal: cell.isGrandTotal,
          rawRowCount: cell.rawRowCount
        });

        if (result) {
          colorMap.set(cell.id, rule.color);
          break;
        }
      } catch {
      }
    }
  }

  return colorMap;
}