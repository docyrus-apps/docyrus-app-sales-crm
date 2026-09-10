'use client'

// @ts-nocheck
/* eslint-disable */
import { type ReactNode, useMemo } from 'react'

import {
  BracesIcon,
  ChevronRightIcon,
  DatabaseIcon,
  ListIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import { useHbsContext } from '../lib/hbs-context'
import { findDataArrayPaths, findDataObjectPaths } from '../lib/data-paths'
import { type HandlebarsBlockHelper } from '../types'

interface BlockHelperFormProps {
  helper: HandlebarsBlockHelper
  expression: string
  onExpressionChange: (next: string) => void
  onSubmit: () => void
  /** Optional cancel — when omitted the form has no Cancel button. */
  onCancel?: () => void
  /** Label for the primary action button (e.g. "Insert Block" / "Save"). */
  submitLabel: string
  /** Optional back action to return to the helper picker (insert flow only). */
  onBack?: () => void
}

/**
 * Shared form rendered after a block helper has been chosen. The expression
 * input is keyed off `helper.name`: `each` / `with` get a data-driven picker
 * (array / object paths discovered in the JSON Data tab); `if` / `unless`
 * stay free-form text.
 */
export function BlockHelperForm({
  helper,
  expression,
  onExpressionChange,
  onSubmit,
  onCancel,
  submitLabel,
  onBack,
}: BlockHelperFormProps) {
  const { data } = useHbsContext()
  const arrayPaths = useMemo(
    () => (helper.name === 'each' ? findDataArrayPaths(data) : []),
    [data, helper.name],
  )
  const objectPaths = useMemo(
    () => (helper.name === 'with' ? findDataObjectPaths(data) : []),
    [data, helper.name],
  )

  const showArrayPicker = helper.name === 'each' && arrayPaths.length > 0
  const showObjectPicker = helper.name === 'with' && objectPaths.length > 0
  const showPicker = showArrayPicker || showObjectPicker
  const canSubmit = !!expression.trim() || !!helper.defaultExpression
  const trimmedExpression = expression.trim()

  /*
   * A path "matches" the current expression when it's an exact hit OR when
   * the expression is a trailing suffix of the path (so `contacts` lights up
   * `customer.contacts` after the user has typed inside `{{#with customer}}`).
   * Matching the leading segment after a dot prevents `tasks` from matching
   * `customer.tasks` *and* `branches.employees.tasks` simultaneously without
   * any anchoring — required because identical key names recur at multiple
   * depths in real schemas.
   */
  const matchesExpression = (candidatePath: string): boolean => {
    if (!trimmedExpression) return false
    if (candidatePath === trimmedExpression) return true

    return candidatePath.endsWith(`.${trimmedExpression}`)
  }

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold">
          {`{{#${helper.name}}}`}
        </span>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            ← back
          </button>
        )}
      </div>

      {helper.description && (
        <p className="text-xs text-muted-foreground">{helper.description}</p>
      )}

      {showPicker && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <DatabaseIcon className="size-3" />
            {helper.name === 'each'
              ? 'Pick an array from data'
              : 'Pick an object from data'}
          </div>
          <ScrollArea className="h-40 rounded-md border bg-muted/20">
            <div className="flex flex-col gap-0.5 p-1.5">
              {showArrayPicker &&
                arrayPaths.map((p) => (
                  <PathRow
                    key={p.path}
                    path={p.path}
                    depth={p.depth}
                    secondary={`${p.itemCount} item${p.itemCount === 1 ? '' : 's'}`}
                    icon={<ListIcon className="size-3 shrink-0 opacity-60" />}
                    selected={matchesExpression(p.path)}
                    onSelect={() => onExpressionChange(p.path)}
                    tooltip={
                      p.itemKeys.length > 0 ? p.itemKeys.join(', ') : undefined
                    }
                  />
                ))}
              {showObjectPicker &&
                objectPaths.map((p) => (
                  <PathRow
                    key={p.path}
                    path={p.path}
                    depth={p.depth}
                    secondary={`${p.keyCount} key${p.keyCount === 1 ? '' : 's'}`}
                    icon={<BracesIcon className="size-3 shrink-0 opacity-60" />}
                    selected={matchesExpression(p.path)}
                    onSelect={() => onExpressionChange(p.path)}
                    tooltip={p.keys.join(', ')}
                  />
                ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Expression
        </label>
        <Input
          value={expression}
          onChange={(e) => onExpressionChange(e.target.value)}
          placeholder={helper.defaultExpression ?? 'expression'}
          className="h-8 font-mono text-xs"
          autoFocus={!showPicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onSubmit()
            }
            if (e.key === 'Escape') onCancel?.()
          }}
        />
        <p className="text-xs text-muted-foreground">
          Preview:{' '}
          <code className="text-xs">{`{{#${helper.name}${expression.trim() ? ` ${expression.trim()}` : ''}}}`}</code>
        </p>
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button size="sm" onClick={onSubmit} disabled={!canSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}

interface PathRowProps {
  path: string
  depth: number
  secondary: string
  icon: ReactNode
  selected: boolean
  onSelect: () => void
  tooltip?: string
}

function PathRow({
  path,
  depth,
  secondary,
  icon,
  selected,
  onSelect,
  tooltip,
}: PathRowProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      title={tooltip}
      className={cn(
        'flex items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        selected && 'bg-primary/10 text-primary',
      )}
      style={{ paddingLeft: 8 + depth * 10 }}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <ChevronRightIcon className="size-3 shrink-0 opacity-50" />
        {icon}
        <span className="truncate font-mono">{path}</span>
      </span>
      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
        {secondary}
      </span>
    </button>
  )
}
