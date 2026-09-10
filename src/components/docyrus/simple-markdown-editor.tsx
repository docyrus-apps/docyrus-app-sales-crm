'use client'

// @ts-nocheck
/* eslint-disable */
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from 'react'

import { cva, type VariantProps } from 'class-variance-authority'

import OverType, {
  type Options as OverTypeOptions,
  type OverTypeInstance,
} from 'overtype'

import { GripHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
/*
 * OverType ships its own toolbar styles (32px buttons, 20px icons, solid-blue
 * active state) that read noticeably bolder/bigger than the Plate editor
 * toolbars used elsewhere in the app. We re-skin the toolbar to match Plate's
 * `ToolbarButton` (sm size: 2rem button, 1rem icon, rounded-md, muted hover,
 * accent active) by:
 *  - mapping OverType's color CSS vars to our theme tokens, and
 *  - overriding sizing/spacing rules under the `.dy-simple-md` scope class
 *    (two-class specificity beats OverType's single-class rules; `!important`
 *    is needed only where OverType itself uses `!important`).
 */
const TOOLBAR_SCOPE_CLASS = 'dy-simple-md'

const TOOLBAR_PLATE_CSS = `
  .${TOOLBAR_SCOPE_CLASS} {
    --toolbar-bg: var(--background);
    --toolbar-border: var(--border);
    --toolbar-icon: var(--muted-foreground);
    --toolbar-hover: var(--muted);
    --toolbar-active: var(--accent);
  }
  .${TOOLBAR_SCOPE_CLASS} .overtype-toolbar {
    gap: 0.125rem !important;
    padding: 0.25rem !important;
  }
  .${TOOLBAR_SCOPE_CLASS} .overtype-toolbar-button {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.375rem;
  }
  .${TOOLBAR_SCOPE_CLASS} .overtype-toolbar-button svg {
    width: 1.125rem;
    height: 1.125rem;
  }
  /*
   * OverType icons draw stroke-width="2" on an 18×18 viewBox; Lucide (Plate)
   * uses stroke-width="2" on 24×24, so OverType lines read ~30% heavier.
   * Thin them to the Lucide-equivalent (2 × 18/24 = 1.5). CSS overrides the
   * inline presentation attribute, so this reaches the stroked shapes.
   */
  .${TOOLBAR_SCOPE_CLASS} .overtype-toolbar-button svg [stroke-width] {
    stroke-width: 1.5;
  }
  .${TOOLBAR_SCOPE_CLASS} .overtype-toolbar-button.active {
    color: var(--accent-foreground);
  }
  .${TOOLBAR_SCOPE_CLASS} .overtype-toolbar-separator {
    height: 1.5rem;
    margin: 0 0.25rem;
  }
`

const simpleMarkdownEditorVariants = cva(
  'w-full overflow-hidden rounded-lg border bg-background',
  {
    variants: {
      variant: {
        default: 'border-border',
        muted: 'border-border/70 bg-muted/20',
      },
      size: {
        sm: 'text-sm',
        default: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

type EditorOptions = Pick<
  OverTypeOptions,
  | 'toolbar'
  | 'showStats'
  | 'autoResize'
  | 'minHeight'
  | 'maxHeight'
  | 'lineHeight'
  | 'fontSize'
  | 'placeholder'
  | 'spellcheck'
>

export interface SimpleMarkdownEditorProps
  extends
    Omit<ComponentPropsWithoutRef<'div'>, 'defaultValue' | 'onChange'>,
    VariantProps<typeof simpleMarkdownEditorVariants>,
    EditorOptions {
  ref?: Ref<SimpleMarkdownEditorRef>
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Show a bottom resize handle to allow vertical resizing */
  resizable?: boolean
  textareaProps?: OverTypeOptions['textareaProps']
}

export interface SimpleMarkdownEditorRef {
  focus: () => void
  blur: () => void
  getValue: () => string
  setValue: (value: string) => void
}

function getMinHeight(size: NonNullable<SimpleMarkdownEditorProps['size']>) {
  if (size === 'sm') return '180px'
  if (size === 'lg') return '320px'

  return '240px'
}

const MIN_EDITOR_HEIGHT = 100

function SimpleMarkdownEditor({
  className,
  variant,
  size = 'default',
  value,
  defaultValue,
  onValueChange,
  toolbar = true,
  showStats = false,
  autoResize = false,
  minHeight,
  maxHeight = null,
  placeholder = 'Write markdown…',
  spellcheck = false,
  lineHeight = 1.6,
  fontSize,
  resizable = false,
  textareaProps,
  ref,
  ...props
}: SimpleMarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mountRef = useRef<HTMLDivElement | null>(null)
  const instanceRef = useRef<OverTypeInstance | null>(null)
  const latestOnChangeRef = useRef<typeof onValueChange>(onValueChange)
  const isControlled = value !== undefined
  const effectiveSize = size ?? 'default'
  const initialValueRef = useRef(value ?? defaultValue ?? '')
  const [height, setHeight] = useState<number | null>(null)
  const dragStateRef = useRef<{ startY: number; startHeight: number } | null>(
    null,
  )

  const parsePx = useCallback(
    (v: string | number | null | undefined): number | null => {
      if (v == null) return null
      if (typeof v === 'number') return v

      const n = parseFloat(v)

      return Number.isNaN(n) ? null : n
    },
    [],
  )

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const container = containerRef.current

    if (!container) return

    dragStateRef.current = {
      startY: e.clientY,
      startHeight: container.offsetHeight,
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const drag = dragStateRef.current

      if (!drag) return

      const delta = e.clientY - drag.startY
      const minPx = parsePx(minHeight) ?? MIN_EDITOR_HEIGHT
      const maxPx = parsePx(maxHeight)
      let next = drag.startHeight + delta

      next = Math.max(next, minPx)

      if (maxPx != null) next = Math.min(next, maxPx)

      setHeight(next)
    },
    [maxHeight, minHeight, parsePx],
  )

  const onPointerUp = useCallback(() => {
    dragStateRef.current = null
  }, [])

  latestOnChangeRef.current = onValueChange

  useEffect(() => {
    const mountElement = mountRef.current

    if (!mountElement) return

    const [instance] = new OverType(mountElement, {
      value: initialValueRef.current,
      toolbar,
      showStats,
      autoResize,
      minHeight: minHeight ?? getMinHeight(effectiveSize),
      maxHeight,
      placeholder,
      spellcheck,
      lineHeight,
      fontSize,
      textareaProps,
      onChange(nextValue) {
        latestOnChangeRef.current?.(nextValue)
      },
    })

    instanceRef.current = instance ?? null

    return () => {
      instanceRef.current?.destroy()
      instanceRef.current = null
    }
  }, [
    autoResize,
    fontSize,
    isControlled,
    lineHeight,
    maxHeight,
    minHeight,
    placeholder,
    showStats,
    effectiveSize,
    spellcheck,
    toolbar,
    textareaProps,
  ])

  useEffect(() => {
    if (!isControlled || !instanceRef.current) return

    const currentValue = instanceRef.current.getValue()

    if (currentValue !== value) {
      instanceRef.current.setValue(value)
    }
  }, [isControlled, value])

  useImperativeHandle(
    ref,
    () => ({
      focus() {
        instanceRef.current?.focus()
      },
      blur() {
        instanceRef.current?.blur()
      },
      getValue() {
        return instanceRef.current?.getValue() ?? ''
      },
      setValue(nextValue: string) {
        instanceRef.current?.setValue(nextValue)
      },
    }),
    [],
  )

  return (
    <div
      ref={containerRef}
      className={cn(
        simpleMarkdownEditorVariants({ variant, size: effectiveSize }),
        TOOLBAR_SCOPE_CLASS,
        resizable && 'flex flex-col',
        className,
      )}
      style={height != null ? { height } : undefined}
      {...(props as HTMLAttributes<HTMLDivElement>)}
    >
      <style>{TOOLBAR_PLATE_CSS}</style>
      <div
        ref={mountRef}
        className={resizable ? 'flex-1 overflow-auto' : undefined}
      />
      {resizable && (
        <div
          role="separator"
          aria-orientation="horizontal"
          className="flex h-3 cursor-row-resize items-center justify-center border-t border-border/50 bg-muted/30 transition-colors select-none hover:bg-muted/60"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <GripHorizontal className="size-3.5 text-muted-foreground/60" />
        </div>
      )}
    </div>
  )
}

export { SimpleMarkdownEditor }
