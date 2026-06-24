'use client'

// @ts-nocheck
/* eslint-disable */
import { cn } from '@/lib/utils'

import {
  type AdaptiveCardCitationRun,
  type AdaptiveCardIconRun,
  type AdaptiveCardImageRun,
  type AdaptiveCardInline,
  type AdaptiveCardRichTextBlock,
  type AdaptiveCardSelectAction,
  type AdaptiveCardTextRun,
} from '../adaptive-card-types'

import { useAdaptiveCardContext } from '../adaptive-card-context'
import { HIGHLIGHT_CLASS, getTextColorClass } from '../lib/color-tokens'
import {
  FONT_SIZE_CLASS,
  FONT_TYPE_CLASS,
  FONT_WEIGHT_CLASS,
  HORIZONTAL_ALIGN_CLASS,
} from '../lib/size-tokens'
import { renderLucideIcon } from './icon-element'

function dispatchSelect(
  ctx: ReturnType<typeof useAdaptiveCardContext>,
  action: AdaptiveCardSelectAction,
): void {
  if (action.type === 'Action.OpenUrl') ctx.openUrl(action)
  else if (action.type === 'Action.Submit') ctx.submit(action)
  else if (action.type === 'Action.Execute') ctx.execute(action)
  else if (action.type === 'Action.ToggleVisibility')
    ctx.toggleVisibility(action)
  else if (action.type === 'Action.ResetInputs') ctx.resetInputs(action)
}

function TextRunSpan({ run }: { run: AdaptiveCardTextRun }) {
  const ctx = useAdaptiveCardContext()

  const className = cn(
    FONT_SIZE_CLASS[run.size ?? 'default'],
    FONT_WEIGHT_CLASS[run.weight ?? 'default'],
    FONT_TYPE_CLASS[run.fontType ?? 'default'],
    getTextColorClass(run.color, run.isSubtle),
    run.highlight ? HIGHLIGHT_CLASS : '',
    run.italic ? 'italic' : '',
    run.strikethrough ? 'line-through' : '',
    run.underline ? 'underline' : '',
  )

  if (run.selectAction) {
    const action = run.selectAction

    return (
      <button
        type="button"
        className={cn(
          className,
          'cursor-pointer underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm',
        )}
        onClick={() => dispatchSelect(ctx, action)}
      >
        {run.text}
      </button>
    )
  }

  return <span className={className}>{run.text}</span>
}

const IMAGE_RUN_SIZE: Record<string, string> = {
  auto: 'inline-block align-middle h-[1.2em]',
  stretch: 'inline-block align-middle h-[1.2em]',
  small: 'inline-block align-middle h-4',
  medium: 'inline-block align-middle h-6',
  large: 'inline-block align-middle h-8',
}

function ImageRunSpan({ run }: { run: AdaptiveCardImageRun }) {
  const ctx = useAdaptiveCardContext()
  const sizeClass = IMAGE_RUN_SIZE[run.size ?? 'small']

  const img = (
    <img
      src={run.url}
      alt=""
      aria-hidden="true"
      className={cn(
        sizeClass,
        'mx-0.5',
        run.style === 'person' ? 'rounded-full' : '',
      )}
    />
  )

  const { selectAction } = run

  if (selectAction) {
    return (
      <button
        type="button"
        onClick={() => dispatchSelect(ctx, selectAction)}
        className="inline cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {img}
      </button>
    )
  }

  return img
}

function IconRunSpan({ run }: { run: AdaptiveCardIconRun }) {
  const ctx = useAdaptiveCardContext()
  const colorClass = getTextColorClass(run.color)
  const iconNode = renderLucideIcon(
    run.name,
    cn(
      'inline-block align-middle mx-0.5 size-4',
      colorClass,
      run.style === 'filled' ? 'fill-current' : '',
    ),
  )

  const { selectAction } = run

  if (selectAction) {
    return (
      <button
        type="button"
        onClick={() => dispatchSelect(ctx, selectAction)}
        className="inline cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {iconNode}
      </button>
    )
  }

  return iconNode
}

function CitationRunSpan({ run }: { run: AdaptiveCardCitationRun }) {
  return (
    <sup className="mx-0.5 rounded bg-muted px-1 text-[10px] font-medium text-muted-foreground">
      [{run.referenceIndex ?? '?'}]
    </sup>
  )
}

function renderInline(inline: AdaptiveCardInline, key: string | number) {
  if (typeof inline === 'string') {
    return <span key={key}>{inline}</span>
  }

  switch (inline.type) {
    case 'TextRun':
      return <TextRunSpan key={key} run={inline} />

    case 'ImageRun':
      return <ImageRunSpan key={key} run={inline} />

    case 'IconRun':
      return <IconRunSpan key={key} run={inline} />

    case 'CitationRun':
      return <CitationRunSpan key={key} run={inline} />

    default:
      return null
  }
}

export function RichTextBlockElement({
  element,
}: {
  element: AdaptiveCardRichTextBlock
}) {
  const alignClass =
    HORIZONTAL_ALIGN_CLASS[element.horizontalAlignment ?? 'left']

  return (
    <p className={cn('text-sm leading-relaxed break-words', alignClass)}>
      {element.inlines.map((inline, index) => renderInline(inline, index))}
    </p>
  )
}
