'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useMemo, useRef } from 'react'

import jsonata from 'jsonata'
import { type Field, type RuleGroupTypeAny } from 'react-querybuilder'

import { type DocyrusQBField } from './query-builder'
import { getFilterGroupForFieldType, type FilterGroup } from './query-operators'
import {
  computeDateBindings,
  convertQueryToJsonata,
  createHelperBindings,
  type ConvertQueryOptions,
  type DateBindingSpec,
} from './lib/query-to-jsonata'

type CompiledExpression = ReturnType<typeof jsonata>

/** External context referenced by user-scoped operators (`active_user`, …). */
export interface QueryJsonataContext {
  /** Current user id — used by `active_user` / `contains_active_user`. */
  activeUserId?: string
  /** Member ids of the current user's teams — used by follower team checks. */
  activeUserTeamMemberIds?: string[]
  /** Any additional `$name` bindings referenced by `operatorOverrides`. */
  [key: string]: unknown
}

export interface UseQuery2JsonataConverterOptions extends Pick<
  ConvertQueryOptions,
  'fieldResolver' | 'operatorOverrides' | 'unsupportedFallback' | 'weekStartsOn'
> {
  /** The query authored by <QueryBuilderDocyrus>. */
  query?: RuleGroupTypeAny | null
  /**
   * The same `fields` passed to the builder. Used to resolve each field's
   * Docyrus filter group so ambiguous operators (`=`, `between`, …) get the
   * correct date / numeric / text semantics.
   */
  fields?: Array<DocyrusQBField | Field>
  /** Bindings for user-scoped operators. */
  context?: QueryJsonataContext
}

export interface EvaluateOptions {
  /** Reference "now" for relative-date operators. Defaults to `Date.now()`. */
  now?: Date | number
  /** Extra one-off JSONata bindings merged on top of the standing ones. */
  bindings?: Record<string, unknown>
}

export interface UseQuery2JsonataConverterResult {
  /** The generated JSONata expression string. */
  expression: string
  /** Relative-date specs recomputed against "now" on every evaluation. */
  dateBindings: DateBindingSpec[]
  /** Operators emitted as the unsupported fallback. */
  unsupportedOperators: string[]
  /** Notes about lossy / skipped conversions. */
  warnings: string[]
  /** `true` when the expression compiled successfully. */
  isValid: boolean
  /** Compile error, if any. */
  error: Error | null
  /** Evaluate the predicate against a record. Resolves to `false` on any error. */
  evaluate: (data: unknown, options?: EvaluateOptions) => Promise<boolean>
}

function buildGroupResolver(
  fields: Array<DocyrusQBField | Field> | undefined,
): (field: string) => FilterGroup | undefined {
  const map = new Map<string, FilterGroup>()

  for (const field of fields ?? []) {
    const docField = field as DocyrusQBField
    const group =
      docField.filterGroup ??
      (docField.fieldType
        ? getFilterGroupForFieldType(docField.fieldType)
        : undefined)

    if (group) map.set(String(field.value ?? field.name), group)
  }

  return (name: string) => map.get(name)
}

/**
 * Converts a <QueryBuilderDocyrus> query into a JSONata boolean predicate and
 * returns a memoized `evaluate(record)` helper.
 *
 * Relative-date operators (`today`, `last_7_days`, `x_days_ago`, …) are
 * recomputed against the current time on every `evaluate()` call, so the same
 * converter stays correct as the clock advances.
 */
export function useQuery2JsonataConverter(
  options: UseQuery2JsonataConverterOptions,
): UseQuery2JsonataConverterResult {
  const {
    query,
    fields,
    context,
    fieldResolver,
    operatorOverrides,
    unsupportedFallback,
    weekStartsOn = 1,
  } = options

  const resolveGroup = useMemo(() => buildGroupResolver(fields), [fields])

  const conversion = useMemo(
    () =>
      convertQueryToJsonata(query, {
        resolveGroup,
        fieldResolver,
        operatorOverrides,
        unsupportedFallback,
        weekStartsOn,
      }),
    [
      query,
      resolveGroup,
      fieldResolver,
      operatorOverrides,
      unsupportedFallback,
      weekStartsOn,
    ],
  )

  const compiled = useMemo<{
    expr: CompiledExpression | null
    error: Error | null
  }>(() => {
    try {
      return { expr: jsonata(conversion.expression), error: null }
    } catch (err) {
      return {
        expr: null,
        error: err instanceof Error ? err : new Error(String(err)),
      }
    }
  }, [conversion.expression])

  const helperBindings = useRef(createHelperBindings()).current

  const contextBindings = useMemo<Record<string, unknown>>(
    () => ({ ...context }),
    [context],
  )

  const evaluate = useCallback(
    async (
      data: unknown,
      evaluateOptions?: EvaluateOptions,
    ): Promise<boolean> => {
      if (!compiled.expr) return false

      const nowSource = evaluateOptions?.now
      const nowMs =
        nowSource === undefined
          ? Date.now()
          : nowSource instanceof Date
            ? nowSource.getTime()
            : nowSource

      const dateBindings = computeDateBindings(
        conversion.dateBindings,
        nowMs,
        weekStartsOn,
      )
      const bindings = {
        ...helperBindings,
        ...contextBindings,
        ...dateBindings,
        ...evaluateOptions?.bindings,
      }

      try {
        const result = await compiled.expr.evaluate(data, bindings)

        return result === true
      } catch {
        return false
      }
    },
    [
      compiled,
      conversion.dateBindings,
      contextBindings,
      helperBindings,
      weekStartsOn,
    ],
  )

  return {
    expression: conversion.expression,
    dateBindings: conversion.dateBindings,
    unsupportedOperators: conversion.unsupportedOperators,
    warnings: conversion.warnings,
    isValid: compiled.error === null,
    error: compiled.error,
    evaluate,
  }
}
