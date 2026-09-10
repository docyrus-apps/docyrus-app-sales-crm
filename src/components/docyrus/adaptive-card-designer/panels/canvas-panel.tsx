'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo, useRef, useState, type MouseEvent } from 'react'

import { useDroppable } from '@dnd-kit/core'
import { Sparkles } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useDocyTheme } from '@/lib/docyrus/theme'

import {
  AdaptiveCard,
  type AdaptiveCardActionEvent,
  type AdaptiveCardHostConfigOverride,
  type ElementRenderer,
} from '@/components/docyrus/adaptive-card'

import { useDesignerContext } from '../adaptive-card-designer-context'
import { CanvasErrorBoundary } from '../canvas/canvas-error-boundary'
import { CanvasOverlay } from '../canvas/canvas-overlay'
import { useCanvasNodeRects } from '../canvas/use-canvas-rects'
import { slotDropId, useDesignerDnd } from '../dnd/designer-dnd'
import { canAccept } from '../dnd/drop-rules'
import { treeToCard } from '../lib/node-tree'
import { ValidationStrip } from './validation-strip'

const WIDTH_PX: Record<string, number | string> = {
  standard: 320,
  wide: 480,
  full: '100%',
}

interface CanvasPanelProps {
  hostConfig?: AdaptiveCardHostConfigOverride
  customElements?: Record<string, ElementRenderer>
}

export function CanvasPanel({ hostConfig, customElements }: CanvasPanelProps) {
  const { state, dispatch } = useDesignerContext()
  const { isDark } = useDocyTheme()

  const themedDark = state.theme === 'auto' ? isDark : state.theme === 'dark'

  const width = WIDTH_PX[state.width] ?? 320

  /*
   * The canvas needs the `_designerId` field on every element so we can
   * recover the designer-tree node from clicks + drop targets via
   * `data-ac-designer-id`. `onChange` keeps using the clean payload.
   */
  const enrichedPayload = useMemo(
    () => treeToCard(state.root, { includeDesignerIds: true }),
    [state.root],
  )

  const frameRef = useRef<HTMLDivElement | null>(null)
  const rects = useCanvasNodeRects(frameRef, state.root)

  const [actionLog, setActionLog] = useState<
    Array<{ at: string; event: AdaptiveCardActionEvent }>
  >([])

  function handleAction(event: AdaptiveCardActionEvent) {
    setActionLog((prev) =>
      [{ at: new Date().toISOString(), event }, ...prev].slice(0, 20),
    )
  }

  function handleFrameClick(event: MouseEvent<HTMLDivElement>) {
    if (state.preview) return

    let target: HTMLElement | null = event.target as HTMLElement

    while (target && target !== event.currentTarget) {
      const id = target.dataset?.acDesignerId

      if (id) {
        dispatch({ type: 'SELECT', id })

        return
      }

      target = target.parentElement
    }

    dispatch({ type: 'SELECT', id: null })
  }

  const isPreview = state.preview
  const { readOnly } = state
  const hasBody = (state.root.slots.body?.length ?? 0) > 0

  return (
    <div
      className={cn(
        'flex h-full min-h-0 flex-col bg-muted/20',
        themedDark && 'dark',
      )}
    >
      <ValidationStrip />

      <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto p-6">
        <div
          ref={frameRef}
          onClick={isPreview ? undefined : handleFrameClick}
          className={cn(
            'relative rounded-lg bg-background shadow-sm transition-colors',
            themedDark ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900',
          )}
          style={
            typeof width === 'number'
              ? { width: `${width}px` }
              : { width: '100%' }
          }
        >
          <CanvasErrorBoundary resetKey={enrichedPayload}>
            <AdaptiveCard
              payload={enrichedPayload}
              data={state.sampleData}
              hostConfig={hostConfig}
              customElements={customElements}
              onAction={handleAction}
            />
          </CanvasErrorBoundary>

          {!isPreview && !readOnly && !hasBody ? (
            <RootBodyDropPlaceholder
              parentId={state.root.__designerId}
              parentType="__root"
            />
          ) : null}

          {!isPreview ? <CanvasOverlay rects={rects} /> : null}
        </div>
      </div>

      {state.preview ? null : actionLog.length > 0 ? (
        <ActionLog log={actionLog} onClear={() => setActionLog([])} />
      ) : null}
    </div>
  )
}

/**
 * Rendered inside the card when `body` is empty — gives the user a
 * full-width drop target since there are no children to position
 * inline drop zones around.
 */
function RootBodyDropPlaceholder({
  parentId,
  parentType,
}: {
  parentId: string
  parentType: string
}) {
  const { activeDrag } = useDesignerDnd()
  const childType =
    activeDrag?.source === 'toolbox'
      ? activeDrag.item.type
      : activeDrag?.source === 'node'
        ? activeDrag.node.type
        : null
  const accepts = childType ? canAccept(parentType, 'body', childType) : false

  const { setNodeRef, isOver } = useDroppable({
    id: slotDropId(parentId, 'body', 0),
    disabled: !!activeDrag && !accepts,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'mx-4 my-6 flex h-32 items-center justify-center rounded-md border-2 border-dashed text-xs',
        activeDrag && accepts
          ? isOver
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-primary/50 bg-primary/5 text-primary/70'
          : 'border-border text-muted-foreground',
      )}
    >
      {activeDrag
        ? accepts
          ? 'Drop here to add to card body'
          : 'Cannot drop here'
        : 'Drag an element from the toolbox to begin'}
    </div>
  )
}

function ActionLog({
  log,
  onClear,
}: {
  log: Array<{ at: string; event: AdaptiveCardActionEvent }>
  onClear: () => void
}) {
  const entries = useMemo(() => log.slice(0, 5), [log])

  return (
    <div className="border-t border-border bg-card">
      <div className="flex h-7 items-center justify-between gap-2 px-3">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3" />
          Action log ({log.length})
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
        >
          Clear
        </button>
      </div>
      <ul className="max-h-24 overflow-auto px-3 pb-2">
        {entries.map((entry, idx) => (
          <li
            // eslint-disable-next-line @eslint-react/no-array-index-key -- append-only action log; entries never reorder and share no stable id
            key={`${entry.at}-${idx}`}
            className="font-mono text-[10px] leading-snug text-foreground"
          >
            <span className="text-muted-foreground">
              {entry.at.slice(11, 19)}
            </span>{' '}
            <span className="font-semibold">{entry.event.type}</span>{' '}
            <span className="break-all text-muted-foreground">
              {entry.event.type === 'openUrl' ? entry.event.url : ''}
              {entry.event.type === 'submit' || entry.event.type === 'execute'
                ? JSON.stringify(entry.event.data)
                : ''}
              {entry.event.type === 'showCard'
                ? entry.event.isOpen
                  ? 'opened'
                  : 'closed'
                : ''}
              {entry.event.type === 'toggleVisibility' ? 'toggled' : ''}
              {entry.event.type === 'resetInputs' ? 'inputs reset' : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
