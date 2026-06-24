'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useEffect, useMemo, useRef } from 'react'

import {
  BaselineIcon,
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  PaintBucketIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from 'lucide-react'
import { type Value, KEYS, createSlateEditor } from 'platejs'
import {
  Plate,
  createPlatePlugin,
  usePlateEditor,
  useEditorReadOnly,
} from 'platejs/react'
import { serializeHtml, getEditorDOMFromHtmlString } from 'platejs/static'

import { BaseEditorKit } from '@/components/editor/editor-base-kit'
import { Editor, EditorContainer } from '@/components/editor/editor'
import { EditorStatic } from '@/components/editor/editor-static'
import { AlignToolbarButton } from '@/components/editor/ui/align-toolbar-button'
import { EmojiToolbarButton } from '@/components/editor/ui/emoji-toolbar-button'
import { FixedToolbar } from '@/components/editor/ui/fixed-toolbar'
import { FloatingToolbar } from '@/components/editor/ui/floating-toolbar'
import { FontColorToolbarButton } from '@/components/editor/ui/font-color-toolbar-button'
import { FontSizeToolbarButton } from '@/components/editor/ui/font-size-toolbar-button'
import {
  UndoToolbarButton,
  RedoToolbarButton,
} from '@/components/editor/ui/history-toolbar-button'
import {
  IndentToolbarButton,
  OutdentToolbarButton,
} from '@/components/editor/ui/indent-toolbar-button'
import { InsertToolbarButton } from '@/components/editor/ui/insert-toolbar-button'
import { LineHeightToolbarButton } from '@/components/editor/ui/line-height-toolbar-button'
import { LinkToolbarButton } from '@/components/editor/ui/link-toolbar-button'
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton,
} from '@/components/editor/ui/list-toolbar-button'
import { MarkToolbarButton } from '@/components/editor/ui/mark-toolbar-button'
import { MoreToolbarButton } from '@/components/editor/ui/more-toolbar-button'
import { TableToolbarButton } from '@/components/editor/ui/table-toolbar-button'
import { ToggleToolbarButton } from '@/components/editor/ui/toggle-toolbar-button'
import { ToolbarGroup } from '@/components/editor/ui/toolbar'
import { TurnIntoToolbarButton } from '@/components/editor/ui/turn-into-toolbar-button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { TooltipProvider } from '@/components/ui/tooltip'

import { type DocEditorPreset, getPresetPlugins } from './doc-editor-form-field'
import { type DocyrusFormFieldProps } from './types'

export { type DocEditorPreset } from './doc-editor-form-field'

export interface HtmlEditorFormFieldProps extends DocyrusFormFieldProps {
  /** Plate.js preset for the editor */
  preset?: DocEditorPreset
}

/* ── Toolbar butonları ── */

function HtmlEditorFloatingButtons() {
  const readOnly = useEditorReadOnly()

  if (readOnly) return null

  return (
    <ToolbarGroup>
      <TurnIntoToolbarButton />

      <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
        <BoldIcon />
      </MarkToolbarButton>

      <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
        <ItalicIcon />
      </MarkToolbarButton>

      <MarkToolbarButton nodeType={KEYS.underline} tooltip="Underline (⌘+U)">
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

      <LinkToolbarButton />
    </ToolbarGroup>
  )
}

function HtmlEditorFixedButtons() {
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
    </div>
  )
}

/* ── Toolbar plugins ── */

function buildHtmlToolbarPlugins(preset: DocEditorPreset) {
  const floatingPlugin = createPlatePlugin({
    key: 'html-editor-floating-toolbar',
    render: {
      afterEditable: () => (
        <FloatingToolbar>
          <HtmlEditorFloatingButtons />
        </FloatingToolbar>
      ),
    },
  })

  if (preset === 'default') return [floatingPlugin]

  const fixedPlugin = createPlatePlugin({
    key: 'html-editor-fixed-toolbar',
    render: {
      beforeEditable: () => (
        <FixedToolbar>
          <HtmlEditorFixedButtons />
        </FixedToolbar>
      ),
    },
  })

  return [fixedPlugin, floatingPlugin]
}

/* ── HTML serialize/deserialize ── */

const createEmptyValue = (): Value => [{ type: 'p', children: [{ text: '' }] }]

function htmlToPlateValue(editor: any, html: string): Value {
  if (!html || !html.trim()) return createEmptyValue()

  try {
    const element = getEditorDOMFromHtmlString(html)
    const nodes = editor.api.html.deserialize({ element })

    return nodes && nodes.length > 0 ? (nodes as Value) : createEmptyValue()
  } catch {
    return createEmptyValue()
  }
}

async function plateValueToHtml(value: Value): Promise<string> {
  try {
    const staticEditor = createSlateEditor({
      plugins: BaseEditorKit,
      value,
    })

    return await serializeHtml(staticEditor, {
      editorComponent: EditorStatic,
      props: { style: { padding: '0', paddingBottom: '' } },
    })
  } catch {
    return ''
  }
}

/* ── Editor input ── */

function HtmlEditorInput({
  field,
  fieldConfig,
  disabled,
  className,
  preset = 'rich',
}: {
  field: any
  fieldConfig: DocyrusFormFieldProps['field']
  disabled?: boolean
  className?: string
  preset?: DocEditorPreset
}) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
  const isReadOnly = disabled || fieldConfig.readOnly === true
  const serializeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastHtmlRef = useRef<string>(field.state.value ?? '')

  const plugins = useMemo(
    () => [...getPresetPlugins(preset), ...buildHtmlToolbarPlugins(preset)],
    [preset],
  )

  const initialValueRef = useRef<Value>(createEmptyValue())
  const editor = usePlateEditor({ plugins, value: initialValueRef.current }, [
    preset,
  ])

  useEffect(() => {
    const html = lastHtmlRef.current

    if (!html.trim()) return

    const nodes = htmlToPlateValue(editor, html)

    editor.tf.replaceNodes(nodes, { at: [], children: true })
  }, [editor])

  const serializePlateToHtml = useCallback(
    (value: Value) => {
      if (serializeTimerRef.current) {
        clearTimeout(serializeTimerRef.current)
      }

      serializeTimerRef.current = setTimeout(async () => {
        const html = await plateValueToHtml(value)

        if (html === lastHtmlRef.current) return

        lastHtmlRef.current = html
        field.handleChange(html)
      }, 300)
    },
    [field],
  )

  useEffect(
    () => () => {
      if (serializeTimerRef.current) {
        clearTimeout(serializeTimerRef.current)
      }
    },
    [],
  )

  return (
    <Field data-invalid={isInvalid} className={className}>
      <FieldLabel htmlFor={field.name}>{fieldConfig.name}</FieldLabel>
      <TooltipProvider>
        <Plate
          editor={editor}
          readOnly={isReadOnly}
          onValueChange={({ value }) => {
            serializePlateToHtml(value)
          }}
        >
          <EditorContainer
            variant="select"
            aria-invalid={isInvalid}
            className="min-h-55"
          >
            <Editor
              id={field.name}
              variant="select"
              className="min-h-55 text-sm"
              placeholder="Write your content..."
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

export function HtmlEditorFormField({
  field: fieldConfig,
  form,
  disabled,
  className,
  preset = 'rich',
}: HtmlEditorFormFieldProps) {
  return (
    <form.Field name={fieldConfig.slug}>
      {(field: any) => (
        <HtmlEditorInput
          field={field}
          fieldConfig={fieldConfig}
          disabled={disabled}
          className={className}
          preset={preset}
        />
      )}
    </form.Field>
  )
}
