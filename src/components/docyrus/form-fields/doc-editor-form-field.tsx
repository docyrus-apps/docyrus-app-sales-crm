'use client'

import { useMemo, useEffect, useRef } from 'react'

import {
  BaselineIcon,
  BoldIcon,
  Code2Icon,
  HighlighterIcon,
  ItalicIcon,
  PaintBucketIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from 'lucide-react'
import { type Value, KEYS, TrailingBlockPlugin } from 'platejs'
import {
  Plate,
  createPlatePlugin,
  usePlateEditor,
  useEditorReadOnly,
} from 'platejs/react'

import { BasicBlocksKit } from '@/components/editor/plugins/basic-blocks-kit'
import { BasicMarksKit } from '@/components/editor/plugins/basic-marks-kit'
import { ListKit } from '@/components/editor/plugins/list-kit'
import { LinkKit } from '@/components/editor/plugins/link-kit'
import { AutoformatKit } from '@/components/editor/plugins/autoformat-kit'
import { ExitBreakKit } from '@/components/editor/plugins/exit-break-kit'
import { BlockPlaceholderKit } from '@/components/editor/plugins/block-placeholder-kit'
import { CodeBlockKit } from '@/components/editor/plugins/code-block-kit'
import { TableKit } from '@/components/editor/plugins/table-kit'
import { CalloutKit } from '@/components/editor/plugins/callout-kit'
import { ToggleKit } from '@/components/editor/plugins/toggle-kit'
import { FontKit } from '@/components/editor/plugins/font-kit'
import { AlignKit } from '@/components/editor/plugins/align-kit'
import { LineHeightKit } from '@/components/editor/plugins/line-height-kit'
import { EmojiKit } from '@/components/editor/plugins/emoji-kit'

import { ColumnKit } from '@/components/editor/plugins/column-kit'
import { MathKit } from '@/components/editor/plugins/math-kit'
import { DateKit } from '@/components/editor/plugins/date-kit'
import { TocKit } from '@/components/editor/plugins/toc-kit'
import { DiscussionKit } from '@/components/editor/plugins/discussion-kit'
import { CommentKit } from '@/components/editor/plugins/comment-kit'
import { SuggestionKit } from '@/components/editor/plugins/suggestion-kit'
import { BlockMenuKit } from '@/components/editor/plugins/block-menu-kit'
import { DndKit } from '@/components/editor/plugins/dnd-kit'
import { Editor, EditorContainer } from '@/components/editor/editor'
import { FloatingToolbar } from '@/components/editor/ui/floating-toolbar'
import { FixedToolbar } from '@/components/editor/ui/fixed-toolbar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ToolbarGroup } from '@/components/editor/ui/toolbar'
import { MarkToolbarButton } from '@/components/editor/ui/mark-toolbar-button'
import { TurnIntoToolbarButton } from '@/components/editor/ui/turn-into-toolbar-button'
import { LinkToolbarButton } from '@/components/editor/ui/link-toolbar-button'
import { InlineEquationToolbarButton } from '@/components/editor/ui/equation-toolbar-button'
import { CommentToolbarButton } from '@/components/editor/ui/comment-toolbar-button'
import { SuggestionToolbarButton } from '@/components/editor/ui/suggestion-toolbar-button'
import { MoreToolbarButton } from '@/components/editor/ui/more-toolbar-button'
import {
  UndoToolbarButton,
  RedoToolbarButton,
} from '@/components/editor/ui/history-toolbar-button'
import { InsertToolbarButton } from '@/components/editor/ui/insert-toolbar-button'
import { FontSizeToolbarButton } from '@/components/editor/ui/font-size-toolbar-button'
import { FontColorToolbarButton } from '@/components/editor/ui/font-color-toolbar-button'
import { AlignToolbarButton } from '@/components/editor/ui/align-toolbar-button'
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton,
} from '@/components/editor/ui/list-toolbar-button'
import { ToggleToolbarButton } from '@/components/editor/ui/toggle-toolbar-button'
import { TableToolbarButton } from '@/components/editor/ui/table-toolbar-button'
import { EmojiToolbarButton } from '@/components/editor/ui/emoji-toolbar-button'
import { LineHeightToolbarButton } from '@/components/editor/ui/line-height-toolbar-button'
import {
  IndentToolbarButton,
  OutdentToolbarButton,
} from '@/components/editor/ui/indent-toolbar-button'
import { ModeToolbarButton } from '@/components/editor/ui/mode-toolbar-button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/utils'

import { type DocyrusFormFieldProps } from './types'

/* Preset type */

export type DocEditorPreset = 'default' | 'rich' | 'full'

/* Plugin builder */

export function getPresetPlugins(preset: DocEditorPreset): any[] {
  const base = [
    ...BasicBlocksKit,
    ...BasicMarksKit,
    ...ListKit,
    ...LinkKit,
    ...AutoformatKit,
    ...ExitBreakKit,
    ...BlockPlaceholderKit,
    TrailingBlockPlugin,
  ]

  if (preset === 'default') return base

  const rich = [
    ...base,
    ...CodeBlockKit,
    ...TableKit,
    ...CalloutKit,
    ...ToggleKit,
    ...FontKit,
    ...AlignKit,
    ...LineHeightKit,
    ...EmojiKit,
  ]

  if (preset === 'rich') return rich

  return [
    ...rich,
    ...ColumnKit,
    ...MathKit,
    ...DateKit,
    ...TocKit,
    ...DiscussionKit,
    ...CommentKit,
    ...SuggestionKit,
    ...BlockMenuKit,
    ...DndKit,
  ]
}

/* Floating toolbar buttons (per preset) */

function DocEditorFloatingButtons({ preset }: { preset: DocEditorPreset }) {
  const readOnly = useEditorReadOnly()

  return (
    <>
      {!readOnly && (
        <ToolbarGroup>
          <TurnIntoToolbarButton />

          <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
            <BoldIcon />
          </MarkToolbarButton>

          <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
            <ItalicIcon />
          </MarkToolbarButton>

          <MarkToolbarButton
            nodeType={KEYS.underline}
            tooltip="Underline (⌘+U)"
          >
            <UnderlineIcon />
          </MarkToolbarButton>

          <MarkToolbarButton
            nodeType={KEYS.strikethrough}
            tooltip="Strikethrough (⌘+⇧+M)"
          >
            <StrikethroughIcon />
          </MarkToolbarButton>

          <MarkToolbarButton nodeType={KEYS.code} tooltip="Code (⌘+E)">
            <Code2Icon />
          </MarkToolbarButton>

          {preset === 'full' && <InlineEquationToolbarButton />}

          <LinkToolbarButton />
        </ToolbarGroup>
      )}

      {preset === 'full' && (
        <ToolbarGroup>
          <CommentToolbarButton />
          <SuggestionToolbarButton />
          {!readOnly && <MoreToolbarButton />}
        </ToolbarGroup>
      )}
    </>
  )
}

/* Fixed toolbar buttons (rich+ presets only) */

function DocEditorFixedButtons({ preset }: { preset: DocEditorPreset }) {
  const readOnly = useEditorReadOnly()

  return (
    <div className="flex w-full">
      {!readOnly && (
        <>
          <ToolbarGroup>
            <UndoToolbarButton />
            <RedoToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <InsertToolbarButton />
            <TurnIntoToolbarButton />
            <FontSizeToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.underline}
              tooltip="Underline (⌘+U)"
            >
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.strikethrough}
              tooltip="Strikethrough (⌘+⇧+M)"
            >
              <StrikethroughIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.code} tooltip="Code (⌘+E)">
              <Code2Icon />
            </MarkToolbarButton>

            <FontColorToolbarButton nodeType={KEYS.color} tooltip="Text color">
              <BaselineIcon />
            </FontColorToolbarButton>

            <FontColorToolbarButton
              nodeType={KEYS.backgroundColor}
              tooltip="Background color"
            >
              <PaintBucketIcon />
            </FontColorToolbarButton>
          </ToolbarGroup>

          <ToolbarGroup>
            <AlignToolbarButton />
            <NumberedListToolbarButton />
            <BulletedListToolbarButton />
            <TodoListToolbarButton />
            <ToggleToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <LinkToolbarButton />
            <TableToolbarButton />
            <EmojiToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <LineHeightToolbarButton />
            <OutdentToolbarButton />
            <IndentToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <MoreToolbarButton />
          </ToolbarGroup>
        </>
      )}

      <div className="grow" />

      {preset === 'full' && (
        <ToolbarGroup>
          <MarkToolbarButton nodeType={KEYS.highlight} tooltip="Highlight">
            <HighlighterIcon />
          </MarkToolbarButton>
          <CommentToolbarButton />
        </ToolbarGroup>
      )}

      {preset === 'full' && (
        <ToolbarGroup>
          <ModeToolbarButton />
        </ToolbarGroup>
      )}
    </div>
  )
}

/* Toolbar plugins (rendered via Plate render hooks) */

export function buildToolbarPlugins(preset: DocEditorPreset) {
  const floatingPlugin = createPlatePlugin({
    key: 'doc-editor-floating-toolbar',
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <DocEditorFloatingButtons preset={preset} />
        </FloatingToolbar>
      ),
    },
  })

  if (preset === 'default') return [floatingPlugin]

  const fixedPlugin = createPlatePlugin({
    key: 'doc-editor-fixed-toolbar',
    render: {
      beforeEditable: () => (
        <FixedToolbar>
          <DocEditorFixedButtons preset={preset} />
        </FixedToolbar>
      ),
    },
  })

  return [fixedPlugin, floatingPlugin]
}

const createEmptyDocValue = (): Value => [
  {
    type: 'p',
    children: [{ text: '' }],
  },
]

const isElementNode = (value: unknown): value is { children: Array<unknown> } =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as { children?: unknown }).children)

const parseTextToValue = (text: string): Value => {
  const lines = text.split(/\r?\n/)

  if (lines.length === 0) return createEmptyDocValue()

  return lines.map((line) => ({
    type: 'p',
    children: [{ text: line }],
  }))
}

const toDocValue = (input: unknown): Value => {
  if (Array.isArray(input)) {
    return input.length > 0 ? (input as Value) : createEmptyDocValue()
  }

  if (isElementNode(input)) {
    return [input as Value[number]]
  }

  if (typeof input === 'string') {
    const trimmed = input.trim()

    if (!trimmed) return createEmptyDocValue()

    try {
      const parsed = JSON.parse(trimmed) as unknown

      if (Array.isArray(parsed)) {
        return parsed.length > 0 ? (parsed as Value) : createEmptyDocValue()
      }

      if (isElementNode(parsed)) {
        return [parsed as Value[number]]
      }
    } catch {
      return parseTextToValue(input)
    }

    return parseTextToValue(input)
  }

  return createEmptyDocValue()
}

const serializeDocValue = (value: Value): string => {
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

function DocEditorInput({
  field,
  fieldConfig,
  disabled,
  className,
  preset = 'default',
}: {
  field: any
  fieldConfig: DocyrusFormFieldProps['field']
  disabled?: boolean
  className?: string
  preset?: DocEditorPreset
}) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const isReadOnly = disabled || fieldConfig.readOnly === true

  const initialValueRef = useRef<Value>(toDocValue(field.state.value))
  const serializedValueRef = useRef(serializeDocValue(initialValueRef.current))

  const plugins = useMemo(
    () => [...getPresetPlugins(preset), ...buildToolbarPlugins(preset)],
    [preset],
  )

  const editor = usePlateEditor(
    {
      plugins,
      value: initialValueRef.current,
    },
    [preset],
  )

  useEffect(() => {
    const nextValue = toDocValue(field.state.value)
    const nextSerialized = serializeDocValue(nextValue)

    if (nextSerialized === serializedValueRef.current) {
      return
    }

    editor.tf.replaceNodes(nextValue, {
      at: [],
      children: true,
    })
    serializedValueRef.current = nextSerialized
  }, [editor, field.state.value])

  return (
    <Field data-invalid={isInvalid} className={className}>
      <FieldLabel htmlFor={field.name}>{fieldConfig.name}</FieldLabel>
      <TooltipProvider>
        <Plate
          editor={editor}
          readOnly={isReadOnly}
          onValueChange={({ value }) => {
            const nextValue = value
            const nextSerialized = serializeDocValue(nextValue)

            if (nextSerialized === serializedValueRef.current) {
              return
            }

            serializedValueRef.current = nextSerialized
            field.handleChange(nextValue)
          }}
        >
          <EditorContainer
            variant="select"
            aria-invalid={isInvalid}
            className={cn(
              'min-h-55',
              isInvalid &&
                'border-destructive focus-within:ring-destructive/20 dark:focus-within:ring-destructive/40',
            )}
          >
            <Editor
              id={field.name}
              variant="select"
              className="min-h-55 text-sm"
              placeholder="Write your document..."
              onBlur={() => field.handleBlur()}
              disabled={isReadOnly}
              readOnly={isReadOnly}
              aria-invalid={isInvalid}
            />
          </EditorContainer>
        </Plate>
      </TooltipProvider>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  )
}

export function DocEditorFormField({
  field: fieldConfig,
  form,
  disabled,
  className,
  preset = 'default',
}: DocyrusFormFieldProps & { preset?: DocEditorPreset }) {
  return (
    <form.Field
      name={fieldConfig.slug}
      children={(field: any) => (
        <DocEditorInput
          field={field}
          fieldConfig={fieldConfig}
          disabled={disabled}
          className={className}
          preset={preset}
        />
      )}
    />
  )
}
