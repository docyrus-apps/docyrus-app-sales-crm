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
  type FieldAction,
  type FieldActionBlockItem,
  type FieldActionCondition,
  type FieldActionPropertyOverrides,
  type FieldActionStep,
  type IField,
} from '@/components/docyrus/form-fields/types'

/*
 * ---------------------------------------------------------------------------
 * Public interface
 * ---------------------------------------------------------------------------
 */

export interface FieldEntry {
  slug: string
  field: IField
}

export interface UseFieldActionsOptions {
  /** All fields in the form — used to build the slug → actions lookup */
  fields: FieldEntry[]
  /**
   * Per-field action overrides from `fieldLayout` — take priority over
   * `IField.fieldActions` when both are present.
   */
  fieldLayoutActions?: Partial<Record<string, FieldAction[]>>
  /**
   * Called when an action step writes a new value to a field.
   * Should be wired to `setValueExternal` in use-docyrus-form-view.
   */
  onSetValue: (slug: string, value: unknown) => void
}

export interface UseFieldActionsResult {
  /**
   * Call this from `onFieldChange` whenever a field's value changes.
   * `formValues` must be the current snapshot of all form values so
   * conditions are evaluated against live data.
   */
  triggerFieldChange: (
    changedSlug: string,
    newValue: unknown,
    formValues: Record<string, unknown>,
  ) => void
  /**
   * Accumulated property overrides produced by past action runs.
   * Stateful — overrides persist until explicitly changed by another action.
   * Merge into `resolvedFields` at lower priority than computed formulas.
   */
  propertyOverrides: Map<string, FieldActionPropertyOverrides>
  /** Clear all accumulated property overrides (hidden/readOnly/disabled/required). */
  resetPropertyOverrides: () => void
}

/*
 * ---------------------------------------------------------------------------
 * Hook
 * ---------------------------------------------------------------------------
 */

/**
 * Evaluates field-level actions in response to field change events.
 *
 * Unlike `useComputedFieldEvaluator` (which re-evaluates reactively on every
 * value change), this hook is **imperative + stateful**:
 *   - Actions only run when `triggerFieldChange` is called.
 *   - Property overrides accumulate and persist until another action changes them.
 *   - Blocks execute serially in `sortOrder` order.
 *   - Conditions use the same JSONata / QB-JSON evaluation pipeline as computed fields.
 *
 * Circular action protection: if triggerFieldChange is called recursively
 * (e.g. action A sets field B which triggers action B which sets field A),
 * execution stops after MAX_ACTION_DEPTH nested calls.
 */

const MAX_ACTION_DEPTH = 5

export function useFieldActionsEvaluator({
  fields,
  fieldLayoutActions,
  onSetValue,
}: UseFieldActionsOptions): UseFieldActionsResult {
  const actionMapRef = useRef<Map<string, FieldAction[]>>(new Map())

  const helperBindingsRef = useRef<Record<string, unknown>>(
    createHelperBindings() as Record<string, unknown>,
  )

  const propertyOverridesRef = useRef<
    Map<string, FieldActionPropertyOverrides>
  >(new Map())
  const [propertyOverrides, setPropertyOverrides] = useState<
    Map<string, FieldActionPropertyOverrides>
  >(() => new Map())

  const depthRef = useRef(0)

  const onSetValueRef = useRef(onSetValue)

  useEffect(() => {
    onSetValueRef.current = onSetValue
  })

  useEffect(() => {
    const map = new Map<string, FieldAction[]>()

    for (const { slug, field } of fields) {
      const actions = fieldLayoutActions?.[slug] ?? field.fieldActions

      if (actions && actions.length > 0) {
        map.set(slug, actions)
      }
    }

    actionMapRef.current = map
  }, [fields, fieldLayoutActions])

  const triggerFieldChange = useCallback(
    (
      changedSlug: string,
      newValue: unknown,
      formValues: Record<string, unknown>,
    ) => {
      const actions = actionMapRef.current.get(changedSlug)

      if (!actions || actions.length === 0) return

      if (depthRef.current >= MAX_ACTION_DEPTH) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(
            `[useFieldActionsEvaluator] Max action depth (${MAX_ACTION_DEPTH}) reached while processing field "${changedSlug}". Possible circular action chain.`,
          )
        }

        return
      }

      depthRef.current += 1

      const context: Record<string, unknown> = {
        ...formValues,
        [changedSlug]: newValue,
      }

      void runActions(actions, context)
        .then(({ valueChanges, nextOverrides }) => {
          depthRef.current = Math.max(0, depthRef.current - 1)

          for (const { slug, value } of valueChanges) {
            onSetValueRef.current(slug, value)
          }

          if (!mapsShallowEqual(propertyOverridesRef.current, nextOverrides)) {
            propertyOverridesRef.current = nextOverrides
            setPropertyOverrides(new Map(nextOverrides))
          }
        })
        .catch(() => {
          depthRef.current = Math.max(0, depthRef.current - 1)
        })
    },
    [],
  )

  /*
   * ---------------------------------------------------------------------------
   * Internal: run all FieldAction[] for a trigger, return mutations
   * ---------------------------------------------------------------------------
   */

  async function runActions(
    actions: FieldAction[],
    context: Record<string, unknown>,
  ): Promise<{
    valueChanges: Array<{ slug: string; value: unknown }>
    nextOverrides: Map<string, FieldActionPropertyOverrides>
  }> {
    const valueChanges: Array<{ slug: string; value: unknown }> = []
    const nextOverrides = new Map(propertyOverridesRef.current)
    const nowMs = Date.now()
    const helperBindings = helperBindingsRef.current

    for (const action of actions) {
      if (action.triggerType !== 'onFieldChange') continue

      const sortedBlocks = [...action.blocks].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      )

      for (const block of sortedBlocks) {
        let matchedSteps: FieldActionStep[] | null = null

        for (const item of block.conditionalItems) {
          const condMet = await evaluateCondition(
            item.condition,
            context,
            nowMs,
            helperBindings,
          )

          if (condMet) {
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

    return { valueChanges, nextOverrides }
  }

  const resetPropertyOverrides = useCallback(() => {
    propertyOverridesRef.current = new Map()
    setPropertyOverrides(new Map())
  }, [])

  return { triggerFieldChange, propertyOverrides, resetPropertyOverrides }
}

/*
 * ---------------------------------------------------------------------------
 * Condition evaluation
 * ---------------------------------------------------------------------------
 */

/**
 * Evaluates a FieldActionCondition against the current form context.
 * - null / undefined / empty → always true (unconditional)
 * - string → direct JSONata expression
 * - QB JSON object → converted to JSONata first
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

/** Shallow-equal check on Map<string, FieldActionPropertyOverrides> to avoid unnecessary re-renders */
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
