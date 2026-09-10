// @ts-nocheck
/* eslint-disable */
/*
 * Adaptive Cards Templating expander.
 *
 * Walks a card template recursively and produces a plain payload by
 * substituting `${path}` expressions, honoring `$data` scope changes,
 * dropping elements that fail `$when`, and repeating elements whose
 * `$data` resolves to an array.
 *
 * Reference: https://learn.microsoft.com/en-us/adaptive-cards/templating/language
 */

import {
  evaluateMaybeExpression,
  interpolateString,
  type ExpressionScope,
} from './expression'

/*
 * Sentinel returned by `expandValue` when a `$data: array` expansion happens
 * inside an object that is itself a member of an array. The parent array
 * walker flattens these so repeated nodes become siblings, not nested arrays.
 */
const REPEAT = Symbol('ac.templating.repeat')

interface RepeatBundle {
  [REPEAT]: true
  items: Array<unknown>
}

function isRepeatBundle(value: unknown): value is RepeatBundle {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { [REPEAT]?: true })[REPEAT] === true
  )
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  if (Array.isArray(value)) return false
  const proto = Object.getPrototypeOf(value)

  return proto === Object.prototype || proto === null
}

function expandArray(
  arr: Array<unknown>,
  scope: ExpressionScope,
): Array<unknown> {
  const out: Array<unknown> = []

  for (const item of arr) {
    const result = expandValue(item, scope)

    if (isRepeatBundle(result)) {
      for (const child of result.items) {
        if (child != null) out.push(child)
      }
    } else if (result != null) {
      out.push(result)
    }
  }

  return out
}

function expandValue(node: unknown, scope: ExpressionScope): unknown {
  if (typeof node === 'string') {
    return evaluateMaybeExpression(node, scope)
  }

  if (Array.isArray(node)) {
    return expandArray(node, scope)
  }

  if (!isPlainObject(node)) {
    return node
  }

  if ('$when' in node) {
    const cond =
      typeof node.$when === 'string'
        ? evaluateMaybeExpression(node.$when, scope)
        : node.$when

    if (!cond) return null
  }

  if ('$data' in node) {
    let dataValue: unknown = node.$data

    if (typeof dataValue === 'string') {
      dataValue = evaluateMaybeExpression(dataValue, scope)
    }

    if (Array.isArray(dataValue)) {
      const stripped: Record<string, unknown> = {}

      for (const [k, v] of Object.entries(node)) {
        if (k !== '$data' && k !== '$when') stripped[k] = v
      }

      const items = dataValue.map((item, idx) =>
        expandValue(stripped, {
          data: item,
          root: scope.root,
          index: idx,
        }),
      )

      return { [REPEAT]: true, items } satisfies RepeatBundle
    }

    const stripped: Record<string, unknown> = {}

    for (const [k, v] of Object.entries(node)) {
      if (k !== '$data' && k !== '$when') stripped[k] = v
    }

    return expandValue(stripped, {
      data: dataValue,
      root: scope.root,
      index: scope.index,
    })
  }

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(node)) {
    if (key === '$when') continue
    const expanded = expandValue(value, scope)

    if (
      expanded === null &&
      (key === 'items' ||
        key === 'columns' ||
        key === 'actions' ||
        key === 'inlines' ||
        key === 'facts')
    ) {
      result[key] = []
      continue
    }

    if (expanded !== undefined) result[key] = expanded
  }

  return result
}

export interface ExpandTemplateOptions {
  /*
   * Optional `$host` data passed alongside `$root` so cards can reference
   * host-supplied data (e.g. user identity, theme) without polluting the
   * payload's main `$root`.
   */
  host?: unknown
}

/*
 * Public entry point. Expands `template` against `data`. The expanded
 * result is a plain card payload ready for `parseAdaptiveCard`.
 *
 * The caller-supplied `data` becomes both `$root` and the initial `$data`
 * scope. A template that declares its own root-level `$data` (Option A
 * from the official docs) is handled by `expandValue` itself — the same
 * code path that handles `$data` on any other element — so there is no
 * special-casing at this layer. That avoids the double-eval bug where
 * pre-setting `rootData` from `$data: "${path}"` then made `expandValue`
 * look up the same `path` inside the new (already-scoped) data and
 * return undefined.
 */
export function expandTemplate<T = unknown>(
  template: T,
  data: unknown,
  options: ExpandTemplateOptions = {},
): T {
  void options

  const expanded = expandValue(template, {
    data,
    root: data,
  })

  if (isRepeatBundle(expanded)) {
    return (expanded.items[0] ?? null) as T
  }

  return expanded as T
}

export { interpolateString }
