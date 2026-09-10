'use client'

// @ts-nocheck
/* eslint-disable */
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { Braces, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CodyAgentToggle } from '@/components/docyrus/editor-agent'
import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import { type JsonSchema } from './json-schema-designer-types'
import {
  type SchemaBuilderSchema,
  SchemaBuilderPanel,
} from './vendor/schema-builder'
import {
  builderToJsonSchema,
  jsonSchemaToBuilder,
} from './vendor/schema-builder-adapter'

/**
 * Context handed to {@link JsonSchemaDesignerProps.renderAiAssistant}. Mirrors
 * the live editor state so a custom drawer can shape its prompts/tools to the
 * current schema + strict-mode setting.
 */
export interface IJsonSchemaAiAssistantRenderContext {
  /** Whether the drawer is currently open. */
  open: boolean
  /** Width the drawer animates to when open, in pixels. */
  width: number
  /** Call to close the drawer from inside the slot. */
  onClose: () => void
  /** Current JSON Schema in the designer. */
  schema: JsonSchema
  /** Whether OpenAI Structured Outputs strict-mode is on. */
  strictMode: boolean
}

function DesignerToolbar({
  title,
  schemaPropertyCount,
  strictMode,
  onStrictModeChange,
  onClear,
  readOnly,
  showAiAssistantButton,
  aiOpen,
  onAiToggle,
}: {
  title: string
  schemaPropertyCount: number
  strictMode: boolean
  onStrictModeChange: (strict: boolean) => void
  onClear: () => void
  readOnly: boolean
  showAiAssistantButton: boolean
  aiOpen: boolean
  onAiToggle: () => void
}) {
  const { t } = useUiTranslation()

  return (
    <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3">
      <div className="flex min-w-0 items-center gap-2">
        {showAiAssistantButton && (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <CodyAgentToggle
                  active={aiOpen}
                  aria-label={t(
                    'ui.jsonSchemaDesigner.aiAssistant',
                    'AI Assistant',
                  )}
                  onClick={onAiToggle}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={6}>
                {t('ui.jsonSchemaDesigner.aiAssistant', 'AI Assistant')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <Braces className="size-4 shrink-0 text-muted-foreground" />
        <h1 className="truncate text-sm font-semibold text-foreground">
          {title}
        </h1>
        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
          {schemaPropertyCount}{' '}
          {schemaPropertyCount === 1
            ? t('ui.jsonSchemaDesigner.property', 'property')
            : t('ui.jsonSchemaDesigner.properties', 'properties')}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <label
          className="mr-1 flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1"
          title={t(
            'ui.jsonSchemaDesigner.strictModeHint',
            'Constrain output to OpenAI Structured Outputs strict-mode rules',
          )}
        >
          <Switch
            checked={strictMode}
            onCheckedChange={onStrictModeChange}
            className="scale-90"
          />
          <span className="text-xs font-medium text-foreground">
            {t('ui.jsonSchemaDesigner.strictMode', 'Strict Mode')}
          </span>
        </label>

        {!readOnly && (
          <>
            <span className="mx-1 h-5 w-px bg-border" />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={onClear}
              title={t('ui.jsonSchemaDesigner.clear', 'Clear schema')}
            >
              <Trash2 className="size-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export interface JsonSchemaDesignerProps {
  /** Controlled JSON Schema document. */
  value?: JsonSchema
  /** Initial JSON Schema for uncontrolled use. */
  defaultValue?: JsonSchema
  /** Called with the updated JSON Schema after every edit. */
  onChange?: (schema: JsonSchema) => void
  /** Disable all editing — the designer becomes a read-only viewer. */
  readOnly?: boolean
  /**
   * Initial state of the **Strict Mode** switch (defaults to `false`). When on,
   * the designer constrains editing and output to OpenAI Structured Outputs
   * strict-mode rules (every object emits `additionalProperties: false` and
   * lists every property in `required`).
   */
  defaultStrictMode?: boolean
  /** Fired when the Strict Mode switch toggles. */
  onStrictModeChange?: (strictMode: boolean) => void
  /** Header title. */
  title?: string
  /** Extra classes for the root container (overrides the default height). */
  className?: string
  /** Controlled open state for the AI Assistant drawer. */
  aiAssistantOpen?: boolean
  /** Fired when the AI Assistant button toggles. */
  onAiAssistantOpenChange?: (open: boolean) => void
  /**
   * Renders a custom AI Assistant drawer body inside the designer. When set,
   * the toolbar shows an AI button that toggles the drawer; the render fn
   * receives the live schema + strict-mode state.
   */
  renderAiAssistant?: (ctx: IJsonSchemaAiAssistantRenderContext) => ReactNode
}

const EMPTY_BUILDER: SchemaBuilderSchema = { properties: [] }

/**
 * Row-based JSON Schema designer ported from the extend-hq schema-builder
 * pattern. Replaces the legacy toolbox + tree-view + properties three-pane
 * layout with an inline editable table — properties are added from a `+ Add
 * property` button at the end of each container, type/name/description are
 * edited in place, and nested objects/arrays expand into a sub-table below
 * the parent row.
 *
 * Strict mode + clear stay on the toolbar; the existing AI Assistant slot is
 * preserved unchanged. The component is controlled via `value` / `onChange`
 * just like the previous version, so consumers including
 * `useApplyJsonSchema` keep working without any wiring change.
 */
export function JsonSchemaDesigner({
  value,
  defaultValue,
  onChange,
  readOnly = false,
  defaultStrictMode = false,
  onStrictModeChange,
  title = 'JSON Schema',
  className,
  aiAssistantOpen,
  onAiAssistantOpenChange,
  renderAiAssistant,
}: JsonSchemaDesignerProps = {}) {
  const isControlled = value !== undefined

  /*
   * The builder owns the row-level state (property ids, expanded enum rows,
   * partially-typed names). We re-derive it from the controlled `value` only
   * when the parent feeds in a brand-new schema (initial mount, AI tool call,
   * external paste). The `lastEmittedRef` guard skips re-deriving on the
   * echo-back of our own emitted onChange so user input never gets reset
   * mid-typing.
   */
  const [builderState, setBuilderState] = useState<SchemaBuilderSchema>(() =>
    jsonSchemaToBuilder(value ?? defaultValue),
  )

  const [strictMode, setStrictMode] = useState(defaultStrictMode)

  const [aiOpenInternal, setAiOpenInternal] = useState(false)
  const isAiOpenControlled = aiAssistantOpen !== undefined
  const aiOpen = isAiOpenControlled ? aiAssistantOpen : aiOpenInternal
  const setAiOpen = useCallback(
    (next: boolean) => {
      if (!isAiOpenControlled) setAiOpenInternal(next)
      onAiAssistantOpenChange?.(next)
    },
    [isAiOpenControlled, onAiAssistantOpenChange],
  )
  const handleAiToggle = useCallback(
    () => setAiOpen(!aiOpen),
    [aiOpen, setAiOpen],
  )
  const handleAiClose = useCallback(() => setAiOpen(false), [setAiOpen])

  const onChangeRef = useRef(onChange)

  onChangeRef.current = onChange

  const lastEmittedRef = useRef<string>(
    JSON.stringify(builderToJsonSchema(builderState, strictMode)),
  )

  const emit = useCallback(
    (nextBuilder: SchemaBuilderSchema, nextStrict: boolean) => {
      const jsonSchema = builderToJsonSchema(nextBuilder, nextStrict)
      const serialized = JSON.stringify(jsonSchema)

      if (serialized === lastEmittedRef.current) return
      lastEmittedRef.current = serialized
      onChangeRef.current?.(jsonSchema)
    },
    [],
  )

  /*
   * Re-import when a controlled `value` changes from outside (initial mount
   * covered, AI tool writes, external `setSchema` from parent).
   */
  useEffect(() => {
    if (!isControlled || value === undefined) return
    const incoming = JSON.stringify(value)

    if (incoming === lastEmittedRef.current) return
    lastEmittedRef.current = incoming
    // eslint-disable-next-line @eslint-react/set-state-in-effect
    setBuilderState(jsonSchemaToBuilder(value))
  }, [isControlled, value])

  const handleBuilderChange = useCallback(
    (next: SchemaBuilderSchema) => {
      setBuilderState(next)
      emit(next, strictMode)
    },
    [emit, strictMode],
  )

  const handleStrictModeChange = useCallback(
    (next: boolean) => {
      setStrictMode(next)
      onStrictModeChange?.(next)
      emit(builderState, next)
    },
    [builderState, emit, onStrictModeChange],
  )

  const handleClear = useCallback(() => {
    setBuilderState(EMPTY_BUILDER)
    emit(EMPTY_BUILDER, strictMode)
  }, [emit, strictMode])

  const showAiAssistantButton = typeof renderAiAssistant === 'function'
  const aiAssistantSlot = renderAiAssistant ? (
    <>
      {renderAiAssistant({
        open: aiOpen,
        width: 320,
        onClose: handleAiClose,
        schema: builderToJsonSchema(builderState, strictMode),
        strictMode,
      })}
    </>
  ) : null

  const builderForPanel = useMemo<SchemaBuilderSchema>(
    () => builderState,
    [builderState],
  )

  return (
    <div
      className={cn(
        'relative flex h-[640px] min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background',
        className,
      )}
    >
      <DesignerToolbar
        title={title}
        schemaPropertyCount={builderState.properties.length}
        strictMode={strictMode}
        onStrictModeChange={handleStrictModeChange}
        onClear={handleClear}
        readOnly={readOnly}
        showAiAssistantButton={showAiAssistantButton}
        aiOpen={aiOpen}
        onAiToggle={handleAiToggle}
      />
      <div className="min-h-0 flex-1">
        <SchemaBuilderPanel
          schema={builderForPanel}
          onSchemaChange={handleBuilderChange}
          className="h-full"
        />
      </div>
      {aiAssistantSlot}
    </div>
  )
}
