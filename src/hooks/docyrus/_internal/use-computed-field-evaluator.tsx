'use client'

// @ts-nocheck
/* eslint-disable */
/*
 * Lives in `_internal/` so the registry scanner does not surface it as a
 * standalone hook. Bundled as a transitive file under use-docyrus-form-view.
 */

import { useEffect, useMemo, useRef, useState } from 'react'

import { type RuleGroupTypeAny } from 'react-querybuilder'

import { evaluateJsonata } from '@/components/docyrus/jsonata-editor/lib/evaluate'
import {
  computeDateBindings,
  convertQueryToJsonata,
  createHelperBindings,
  type DateBindingSpec,
} from '@/components/docyrus/query-builder/lib/query-to-jsonata'
import {
  type ComputedBooleanFormula,
  type IField,
} from '@/components/docyrus/form-fields/types'

export interface ComputedFieldState {
  /** Evaluated result of computedHidden — undefined if formula absent or failed */
  hidden?: boolean
  /** Evaluated result of computedRequired — undefined if formula absent or failed */
  required?: boolean
  /** Evaluated result of computedLabel — undefined if formula absent, empty, or failed */
  label?: string
  /** Evaluated result of computedDescription — undefined if formula absent, empty, or failed */
  description?: string
  /** Evaluated result of computedFormula */
  value?: unknown
  /** True when the field has a computedFormula (even if last evaluation produced undefined) */
  hasFormula: boolean
}

interface FieldEntry {
  slug: string
  field: IField
}

interface CompiledEntry {
  hiddenExpr: { expression: string; dateBindings: DateBindingSpec[] } | null
  requiredExpr: { expression: string; dateBindings: DateBindingSpec[] } | null
  labelExpr: string | null
  descriptionExpr: string | null
  formulaExpr: string | null
}

/**
 * Reactive computed-field evaluator for `useDocyrusFormView`.
 *
 * For each field that has one or more computed properties (computedHidden,
 * computedRequired, computedLabel, computedDescription, computedFormula) stored
 * in `IField`, this hook:
 *   1. Compiles QB JSON → JSONata strings once when the field list changes.
 *   2. Evaluates all compiled expressions asynchronously whenever `values` change.
 *   3. Returns a Map<slug, ComputedFieldState> that the caller merges into resolved fields.
 *
 * Returns an empty Map (no overrides) when no fields have computed properties.
 */
const NUMERIC_FIELD_TYPES = new Set<string>([
  'field-number',
  'field-money',
  'field-percent',
  'field-duration',
  'field-rating',
])

export function useComputedFieldEvaluator(
  fields: FieldEntry[],
  values: Record<string, unknown>,
): Map<string, ComputedFieldState> {
  const helperBindingsRef = useRef<Record<string, unknown>>(
    createHelperBindings() as Record<string, unknown>,
  )

  const [states, setStates] = useState<Map<string, ComputedFieldState>>(
    () => new Map(),
  )

  const hasAnyComputed = fields.some(
    ({ field }) =>
      field.computedHidden != null ||
      field.computedRequired != null ||
      field.computedLabel != null ||
      field.computedDescription != null ||
      field.computedFormula != null,
  )

  /*
   * Step 1: (Re)compile expressions when the field list changes. Compilation is
   * a pure QB→JSONata string conversion, so it is derived during render with
   * useMemo rather than written to a ref from an effect.
   */
  const compiled = useMemo<Map<string, CompiledEntry>>(() => {
    const map = new Map<string, CompiledEntry>()

    if (!hasAnyComputed) return map

    for (const { slug, field } of fields) {
      const entry: CompiledEntry = {
        hiddenExpr: resolveBooleanExpr(field.computedHidden),
        requiredExpr: resolveBooleanExpr(field.computedRequired),
        labelExpr:
          typeof field.computedLabel === 'string' && field.computedLabel.trim()
            ? field.computedLabel.trim()
            : null,
        descriptionExpr:
          typeof field.computedDescription === 'string' &&
          field.computedDescription.trim()
            ? field.computedDescription.trim()
            : null,
        formulaExpr:
          typeof field.computedFormula === 'string' &&
          field.computedFormula.trim()
            ? field.computedFormula.trim()
            : null,
      }

      const hasEntry =
        entry.hiddenExpr != null ||
        entry.requiredExpr != null ||
        entry.labelExpr != null ||
        entry.descriptionExpr != null ||
        entry.formulaExpr != null

      if (hasEntry) {
        map.set(slug, entry)
      }
    }

    return map
  }, [fields, hasAnyComputed])

  /*
   * Step 2: Evaluate all compiled expressions async whenever values change.
   * Debounced by 200 ms so rapid keystrokes only trigger one evaluation after
   * the user pauses, rather than one per character. A new `compiled` map
   * (formula definition changed) shares the same debounce — 200 ms is
   * imperceptible for a formula editor.
   * The `cancelled` flag prevents stale async results from overwriting a
   * newer evaluation that may have already completed.
   */
  useEffect(() => {
    if (!hasAnyComputed || compiled.size === 0) {
      return
    }

    let cancelled = false

    const evaluate = async () => {
      const nextStates = new Map<string, ComputedFieldState>()
      const nowMs = Date.now()
      const helperBindings = helperBindingsRef.current

      /*
       * Number fields store their raw input as a string ("12123") because HTML
       * inputs are always strings. Coerce ONLY known numeric field types to JS
       * numbers so JSONata arithmetic works without requiring $number().
       * Enum IDs, phone numbers, zip codes and other string-typed fields are
       * deliberately left as strings to avoid breaking equality comparisons.
       */
      const numericSlugs = new Set(
        fields
          .filter((f) => NUMERIC_FIELD_TYPES.has(f.field.type))
          .map((f) => f.slug),
      )
      const coercedValues = coerceNumericStrings(values, numericSlugs)

      for (const [slug, entry] of compiled.entries()) {
        const state: ComputedFieldState = { hasFormula: !!entry.formulaExpr }

        if (entry.hiddenExpr) {
          const dateB = computeDateBindings(
            entry.hiddenExpr.dateBindings,
            nowMs,
          )
          const result = await evaluateJsonata(
            entry.hiddenExpr.expression,
            coercedValues,
            { bindings: { ...helperBindings, ...dateB } },
          )

          if (result.status === 'success') {
            state.hidden = Boolean(result.result)
          }
        }

        if (entry.requiredExpr) {
          const dateB = computeDateBindings(
            entry.requiredExpr.dateBindings,
            nowMs,
          )
          const result = await evaluateJsonata(
            entry.requiredExpr.expression,
            coercedValues,
            { bindings: { ...helperBindings, ...dateB } },
          )

          if (result.status === 'success') {
            state.required = Boolean(result.result)
          }
        }

        if (entry.labelExpr) {
          const result = await evaluateJsonata(entry.labelExpr, coercedValues)

          if (result.status === 'success' && result.result != null) {
            state.label = String(result.result)
          }
        }

        if (entry.descriptionExpr) {
          const result = await evaluateJsonata(
            entry.descriptionExpr,
            coercedValues,
          )

          if (result.status === 'success' && result.result != null) {
            state.description = String(result.result)
          }
        }

        if (entry.formulaExpr) {
          const result = await evaluateJsonata(entry.formulaExpr, coercedValues)

          if (result.status === 'success') {
            state.value = result.result
          }
        }

        nextStates.set(slug, state)
      }

      if (!cancelled) {
        setStates(nextStates)
      }
    }

    const timer = setTimeout(() => {
      void evaluate()
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [fields, values, hasAnyComputed, compiled])

  return hasAnyComputed ? states : EMPTY_MAP
}

/*
 * Stable empty map returned when no fields have computed properties,
 * avoiding a new Map() allocation on every render.
 */
const EMPTY_MAP = new Map<string, ComputedFieldState>()

/**
 * Normalises a `ComputedBooleanFormula` value into a compiled expression entry.
 * Returns null when the value is absent, empty, or an empty QB rule group.
 */
function resolveBooleanExpr(
  raw: ComputedBooleanFormula | undefined,
): CompiledEntry['hiddenExpr'] {
  if (!raw) return null

  if (typeof raw === 'string') {
    const trimmed = raw.trim()

    return trimmed ? { expression: trimmed, dateBindings: [] } : null
  }

  if (
    typeof raw === 'object' &&
    'combinator' in raw &&
    'rules' in raw &&
    Array.isArray(raw.rules) &&
    raw.rules.length > 0
  ) {
    const result = convertQueryToJsonata(raw as RuleGroupTypeAny)

    return { expression: result.expression, dateBindings: result.dateBindings }
  }

  return null
}

/*
 * Coerce numeric-looking string values to JS numbers ONLY for fields whose
 * type is a known numeric type (field-number, field-money, etc.).
 * Enum IDs, phone numbers, zip codes, and other string-typed fields are
 * intentionally left as strings — coercing them would break equality
 * comparisons like `status = "1"` (coerced 1 ≠ "1" in JSONata).
 */
function coerceNumericStrings(
  values: Record<string, unknown>,
  numericSlugs: Set<string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  for (const [k, v] of Object.entries(values)) {
    if (
      numericSlugs.has(k) &&
      typeof v === 'string' &&
      v.trim() !== '' &&
      /^-?\d+(\.\d+)?$/.test(v.trim())
    ) {
      out[k] = Number(v)
    } else {
      out[k] = v
    }
  }

  return out
}
