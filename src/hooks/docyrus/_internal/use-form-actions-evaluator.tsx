'use client'

// @ts-nocheck
/* eslint-disable */
/*
 * Lives in `_internal/` so the registry scanner does not surface it as a
 * standalone hook. Bundled as a transitive file under use-docyrus-form-view.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

import { type RuleGroupTypeAny } from 'react-querybuilder'

import { evaluateJsonata } from '@/components/docyrus/jsonata-editor/lib/evaluate'
import {
  computeDateBindings,
  convertQueryToJsonata,
  createHelperBindings,
} from '@/components/docyrus/query-builder/lib/query-to-jsonata'
import {
  type FieldActionBlockItem,
  type FieldActionCondition,
  type FieldActionPropertyOverrides,
  type FieldActionStep,
  type FormAction,
  type FormActionTriggerType,
  type FormCustomValidationRule,
} from '@/components/docyrus/form-fields/types'

/*
 * ---------------------------------------------------------------------------
 * Public interface
 * ---------------------------------------------------------------------------
 */

export interface UseFormActionsOptions {
  /** All form-level actions (across all trigger types) */
  formActions?: FormAction[] | null
  /** Form-level custom validation rules evaluated on submit */
  formCustomValidations?: FormCustomValidationRule[] | null
  /**
   * Called when an action step writes a new value to a field.
   * Wired to setValueExternal in use-docyrus-form-view.
   */
  onSetValue: (slug: string, value: unknown) => void
}

export interface UseFormActionsResult {
  /** Fire when the form finishes loading initial data. */
  triggerFormLoad: (formValues: Record<string, unknown>) => void
  /**
   * Fire just before the submit API call.
   * Runs onFormBeforeSubmit blocks — field value mutations are applied via onSetValue.
   * Awaitable: resolves when all blocks have run.
   */
  triggerBeforeSubmit: (formValues: Record<string, unknown>) => Promise<void>
  /**
   * Fire after a successful submit API call.
   * `result` is the raw API response — available as `$result` in expressions.
   */
  triggerAfterSubmit: (
    result: unknown,
    formValues: Record<string, unknown>,
  ) => void
  /**
   * Evaluate form-level custom validation rules.
   * Returns an array of error messages (empty = valid).
   */
  validateFormLevel: (formValues: Record<string, unknown>) => Promise<string[]>
  /**
   * Accumulated property overrides from form-level action runs.
   * Merges into resolvedFields at lower priority than computed formulas.
   */
  propertyOverrides: Map<string, FieldActionPropertyOverrides>
  /** Clear all accumulated property overrides. */
  resetPropertyOverrides: () => void
}

/*
 * ---------------------------------------------------------------------------
 * Hook
 * ---------------------------------------------------------------------------
 */

export function useFormActionsEvaluator({
  formActions,
  formCustomValidations,
  onSetValue,
}: UseFormActionsOptions): UseFormActionsResult {
  const helperBindingsRef = useRef<Record<string, unknown>>(
    createHelperBindings() as Record<string, unknown>,
  )

  const propertyOverridesRef = useRef<
    Map<string, FieldActionPropertyOverrides>
  >(new Map())
  const [propertyOverrides, setPropertyOverrides] = useState<
    Map<string, FieldActionPropertyOverrides>
  >(() => new Map())

  const onSetValueRef = useRef(onSetValue)
  const formActionsRef = useRef(formActions)
  const formCustomValidationsRef = useRef(formCustomValidations)

  useEffect(() => {
    onSetValueRef.current = onSetValue
  })

  useEffect(() => {
    formActionsRef.current = formActions
  }, [formActions])

  useEffect(() => {
    formCustomValidationsRef.current = formCustomValidations
  }, [formCustomValidations])

  /*
   * Core: run all FormAction[] for a given triggerType
   */
  const runTrigger = useCallback(
    async (
      triggerType: FormActionTriggerType,
      context: Record<string, unknown>,
    ): Promise<void> => {
      const actions = formActionsRef.current

      if (!actions || actions.length === 0) return

      const matching = actions.filter((a) => a.triggerType === triggerType)

      if (matching.length === 0) return

      const nowMs = Date.now()
      const helperBindings = helperBindingsRef.current
      const nextOverrides = new Map(propertyOverridesRef.current)
      const valueChanges: Array<{ slug: string; value: unknown }> = []

      for (const action of matching) {
        const sortedBlocks = [...action.blocks].sort(
          (a, b) => a.sortOrder - b.sortOrder,
        )

        for (const block of sortedBlocks) {
          let matchedSteps: FieldActionStep[] | null = null

          for (const item of block.conditionalItems) {
            const met = await evaluateCondition(
              item.condition,
              context,
              nowMs,
              helperBindings,
            )

            if (met) {
              matchedSteps = item.actions
              break
            }
          }

          if (matchedSteps === null) {
            matchedSteps = block.elseActions
          }

          for (const step of matchedSteps) {
            applyStep(step, nextOverrides, valueChanges)
          }

          for (const step of block.unconditionalActions) {
            applyStep(step, nextOverrides, valueChanges)
          }
        }
      }

      for (const { slug, value } of valueChanges) {
        onSetValueRef.current(slug, value)
      }

      if (!mapsShallowEqual(propertyOverridesRef.current, nextOverrides)) {
        propertyOverridesRef.current = nextOverrides
        setPropertyOverrides(new Map(nextOverrides))
      }
    },
    [],
  )

  const triggerFormLoad = useCallback(
    (formValues: Record<string, unknown>) => {
      void runTrigger('onFormLoad', { ...formValues })
    },
    [runTrigger],
  )

  const triggerBeforeSubmit = useCallback(
    async (formValues: Record<string, unknown>) => {
      await runTrigger('onFormBeforeSubmit', { ...formValues })
    },
    [runTrigger],
  )

  const triggerAfterSubmit = useCallback(
    (result: unknown, formValues: Record<string, unknown>) => {
      void runTrigger('onFormAfterSubmit', { ...formValues, $result: result })
    },
    [runTrigger],
  )

  const validateFormLevel = useCallback(
    async (formValues: Record<string, unknown>): Promise<string[]> => {
      const rules = formCustomValidationsRef.current

      if (!rules || rules.length === 0) return []

      const errors: string[] = []
      const nowMs = Date.now()
      const helperBindings = helperBindingsRef.current
      const context = { values: formValues, ...formValues }

      for (const rule of rules) {
        if (!rule.expression?.trim()) continue

        const dateBindings = computeDateBindings([], nowMs)
        const result = await evaluateJsonata(rule.expression, context, {
          bindings: { ...helperBindings, ...dateBindings },
        })

        if (result.status === 'success' && result.result !== true) {
          errors.push(rule.message || 'Form validation failed')
        }
      }

      return errors
    },
    [],
  )

  const resetPropertyOverrides = useCallback(() => {
    propertyOverridesRef.current = new Map()
    setPropertyOverrides(new Map())
  }, [])

  return {
    triggerFormLoad,
    triggerBeforeSubmit,
    triggerAfterSubmit,
    validateFormLevel,
    propertyOverrides,
    resetPropertyOverrides,
  }
}

/*
 * ---------------------------------------------------------------------------
 * Condition evaluation (shared with use-field-actions-evaluator pattern)
 * ---------------------------------------------------------------------------
 */

async function evaluateCondition(
  condition: FieldActionCondition,
  context: Record<string, unknown>,
  nowMs: number,
  helperBindings: Record<string, unknown>,
): Promise<boolean> {
  if (!condition) return true

  let expression: string
  let dateBindings: ReturnType<typeof computeDateBindings> = {}

  if (typeof condition === 'string') {
    const trimmed = condition.trim()

    if (!trimmed) return true
    expression = trimmed
  } else if (
    typeof condition === 'object' &&
    'combinator' in condition &&
    'rules' in condition &&
    Array.isArray(condition.rules) &&
    condition.rules.length > 0
  ) {
    const converted = convertQueryToJsonata(condition as RuleGroupTypeAny)

    ;({ expression } = converted)
    dateBindings = computeDateBindings(converted.dateBindings, nowMs)
  } else {
    return true
  }

  const result = await evaluateJsonata(expression, context, {
    bindings: { ...helperBindings, ...dateBindings },
  })

  return result.status === 'success' ? Boolean(result.result) : false
}

/*
 * ---------------------------------------------------------------------------
 * Step dispatcher
 * ---------------------------------------------------------------------------
 */

function applyStep(
  step: FieldActionStep,
  overrides: Map<string, FieldActionPropertyOverrides>,
  valueChanges: Array<{ slug: string; value: unknown }>,
): void {
  switch (step.method) {
    case 'setFieldValue':
      valueChanges.push({ slug: step.fieldSlug, value: step.value })
      break

    case 'setFieldValues':
      for (const { fieldSlug, value } of step.fields) {
        valueChanges.push({ slug: fieldSlug, value })
      }
      break

    case 'clearFieldValue':
      valueChanges.push({ slug: step.fieldSlug, value: null })
      break

    case 'showField':
      mergeOverride(overrides, step.fieldSlug, { hidden: false })
      break

    case 'hideField':
      mergeOverride(overrides, step.fieldSlug, { hidden: true })
      break

    case 'setFieldRequired':
      mergeOverride(overrides, step.fieldSlug, { required: step.required })
      break

    case 'setFieldDisabled':
      mergeOverride(overrides, step.fieldSlug, { disabled: step.disabled })
      break

    case 'setFieldReadOnly':
      mergeOverride(overrides, step.fieldSlug, { readOnly: step.readOnly })
      break

    default:
      break
  }
}

/*
 * ---------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------
 */

function mergeOverride(
  map: Map<string, FieldActionPropertyOverrides>,
  slug: string,
  patch: Partial<FieldActionPropertyOverrides>,
): void {
  const existing = map.get(slug) ?? {}

  map.set(slug, { ...existing, ...patch })
}

function mapsShallowEqual(
  a: Map<string, FieldActionPropertyOverrides>,
  b: Map<string, FieldActionPropertyOverrides>,
): boolean {
  if (a.size !== b.size) return false

  for (const [slug, aVal] of a.entries()) {
    const bVal = b.get(slug)

    if (!bVal) return false

    if (
      aVal.hidden !== bVal.hidden ||
      aVal.required !== bVal.required ||
      aVal.disabled !== bVal.disabled ||
      aVal.readOnly !== bVal.readOnly
    ) {
      return false
    }
  }

  return true
}

export type { FieldActionBlockItem }
