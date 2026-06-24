'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo } from 'react'

import { AlertCircle, AlertTriangle, Info } from 'lucide-react'

import { cn } from '@/lib/utils'

import { isAdaptiveCard } from '@/components/docyrus/adaptive-card'

import { useDesignerContext } from '../adaptive-card-designer-context'
import { type DesignerDiagnostic } from '../adaptive-card-designer-types'

/**
 * Above-canvas thin strip showing live parse + designer diagnostics. Phase 1
 * only surfaces top-level payload sanity checks; richer designer-validators
 * land in Phase 4.
 */
export function ValidationStrip() {
  const { payload, state } = useDesignerContext()

  const builtins = useMemo<DesignerDiagnostic[]>(() => {
    const out: DesignerDiagnostic[] = []

    if (!isAdaptiveCard(payload)) {
      out.push({
        level: 'error',
        message: 'Payload is not a valid AdaptiveCard.',
      })
    } else if (!payload.version) {
      out.push({
        level: 'warning',
        message: 'Payload is missing a `version` field — defaulting to 1.5.',
      })
    }

    return out
  }, [payload])

  const all = useMemo(
    () => [...builtins, ...state.diagnostics],
    [builtins, state.diagnostics],
  )

  if (all.length === 0) return null

  return (
    <div className="flex flex-col gap-px border-b border-border bg-card">
      {all.map((diag) => (
        <DiagnosticRow
          key={`${diag.level}-${diag.nodeId ?? ''}-${diag.message}`}
          diagnostic={diag}
        />
      ))}
    </div>
  )
}

function DiagnosticRow({ diagnostic }: { diagnostic: DesignerDiagnostic }) {
  const { dispatch } = useDesignerContext()
  const Icon =
    diagnostic.level === 'error'
      ? AlertCircle
      : diagnostic.level === 'warning'
        ? AlertTriangle
        : Info

  const color =
    diagnostic.level === 'error'
      ? 'text-destructive bg-destructive/10'
      : diagnostic.level === 'warning'
        ? 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40'
        : 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40'

  return (
    <button
      type="button"
      disabled={!diagnostic.nodeId}
      onClick={() =>
        diagnostic.nodeId && dispatch({ type: 'SELECT', id: diagnostic.nodeId })
      }
      className={cn(
        'flex w-full items-start gap-1.5 px-3 py-1 text-left text-[11px]',
        color,
        diagnostic.nodeId && 'hover:underline',
      )}
    >
      <Icon className="mt-0.5 size-3 shrink-0" />
      <span className="flex-1 break-words">{diagnostic.message}</span>
    </button>
  )
}
