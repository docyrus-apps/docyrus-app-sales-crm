'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useMemo, useState } from 'react'

import { type AdaptiveCardPayload } from '@/components/docyrus/adaptive-card'
import { type IEditorAgentClientTool } from '@/components/docyrus/editor-agent'
import { buildResultPreview } from '@/components/docyrus/editor-agent/preview-utils'
import { isPlainObject } from '@/components/docyrus/json-schema-designer'

const TOOL_NAME = 'applyAdaptiveCard'

interface IApplyAdaptiveCardInput {
  payload?: unknown
  sampleData?: unknown
  explanation?: unknown
}

interface IApplyAdaptiveCardOutput {
  applied: boolean
  ok: boolean
  payloadPreview?: string
  truncated?: boolean
  sampleDataApplied?: boolean
  error?: { message: string }
}

export interface IUseApplyAdaptiveCardResult {
  payload: AdaptiveCardPayload | null
  setPayload: (next: AdaptiveCardPayload) => void
  sampleData: unknown
  setSampleData: (next: unknown) => void
  tools: ReadonlyArray<IEditorAgentClientTool>
}

/**
 * Owns the controlled state for `<AdaptiveCardDesigner>` and the
 * `applyAdaptiveCard` client-side tool. The tool replaces the designer's
 * payload (and optionally sample data) with the agent's draft. Refuses
 * primitives / arrays / null so a bad LLM call cannot crash the designer.
 */
export function useApplyAdaptiveCard(): IUseApplyAdaptiveCardResult {
  const [payload, setPayload] = useState<AdaptiveCardPayload | null>(null)
  const [sampleData, setSampleData] = useState<unknown>(undefined)

  const execute = useCallback<IEditorAgentClientTool['execute']>(
    async (toolInput) => {
      const { payload: providedPayload, sampleData: providedSampleData } =
        (toolInput ?? {}) as IApplyAdaptiveCardInput

      if (!isPlainObject(providedPayload)) {
        return {
          applied: false,
          ok: false,
          error: {
            message:
              'payload is required and must be an Adaptive Card object (got a primitive, array, or null)',
          },
        } satisfies IApplyAdaptiveCardOutput
      }

      const payloadObj = providedPayload as Record<string, unknown>

      if (payloadObj.type !== 'AdaptiveCard') {
        return {
          applied: false,
          ok: false,
          error: {
            message: 'payload must have `type: "AdaptiveCard"` at the root',
          },
        } satisfies IApplyAdaptiveCardOutput
      }

      setPayload(payloadObj as unknown as AdaptiveCardPayload)

      let sampleDataApplied = false

      if (providedSampleData !== undefined) {
        setSampleData(providedSampleData)
        sampleDataApplied = true
      }

      const { preview, truncated } = buildResultPreview(payloadObj)

      return {
        applied: true,
        ok: true,
        payloadPreview: preview,
        truncated,
        sampleDataApplied,
      } satisfies IApplyAdaptiveCardOutput
    },
    [],
  )

  const tools = useMemo<ReadonlyArray<IEditorAgentClientTool>>(
    () => [{ name: TOOL_NAME, execute }],
    [execute],
  )

  return {
    payload,
    setPayload,
    sampleData,
    setSampleData,
    tools,
  }
}
