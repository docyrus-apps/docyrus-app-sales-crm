// @ts-nocheck
/* eslint-disable */
import { type ReactNode, type Ref } from 'react'

import {
  type BasicSetupOptions,
  type ReactCodeMirrorRef,
} from '@uiw/react-codemirror'
import { type Extension } from '@codemirror/state'

import { type ContextPathInput } from '@/lib/docyrus/context-paths'

/** A single built-in JSONata function described for IntelliSense. */
export interface JsonataFunction {
  /** Function name including the `$` prefix (e.g. `$map`). */
  name: string
  /** Human-readable call signature (e.g. `$map(array, function)`). */
  signature: string
  /** Category used to group completions (e.g. `String`, `Numeric`). */
  category: string
  /** Short description of what the function does. */
  description: string
  /** Ordered list of parameters. */
  params: JsonataFunctionParam[]
  /** Return type as a string. */
  returns: string
  /** Optional usage examples. */
  examples?: string[]
  /** Link to the official documentation. */
  docsUrl?: string
}

/** A single parameter of a {@link JsonataFunction}. */
export interface JsonataFunctionParam {
  name: string
  type: string
  optional?: boolean
  description: string
}

/** The phase at which a JSONata evaluation failed. */
export type JsonataErrorPhase = 'input' | 'parse' | 'evaluate'

/** A normalized error produced while parsing input or running an expression. */
export interface JsonataEvaluationError {
  /** Where the failure happened. */
  phase: JsonataErrorPhase
  /** Human-readable message. */
  message: string
  /** JSONata error code (e.g. `S0203`), when available. */
  code?: string
  /** Character offset of the error within the expression, when available. */
  position?: number
  /** Offending token, when available. */
  token?: string
}

/** Discriminated union describing the outcome of an evaluation. */
export type JsonataEvaluationState =
  | { status: 'idle' }
  | { status: 'empty' }
  | { status: 'evaluating' }
  | { status: 'success'; result: unknown }
  | { status: 'input-error'; error: JsonataEvaluationError }
  | { status: 'parse-error'; error: JsonataEvaluationError }
  | { status: 'evaluate-error'; error: JsonataEvaluationError }

/** A ready-made input + expression pair selectable from the toolbar. */
export interface JsonataSample {
  /** Display name shown in the samples menu. */
  name: string
  /** Optional one-line description. */
  description?: string
  /** JSON input — a string or any JSON-serializable value. */
  input: string | unknown
  /** JSONata expression to evaluate against the input. */
  expression: string
}

/** Options accepted by {@link evaluateJsonata} and the `useJsonata` hook. */
export interface JsonataEvaluateOptions {
  /** Variable bindings injected into `evaluate()` (accessible as `$name`). */
  bindings?: Record<string, unknown>
  /** Evaluation timeout in ms. `0` disables the timebox. Default `1000`. */
  timeout?: number
  /** Maximum recursion depth before aborting. Default `500`. */
  maxDepth?: number
}

/** Options for the headless `useJsonata` hook. */
export interface UseJsonataOptions extends JsonataEvaluateOptions {
  /** Debounce before evaluating, in ms. Default `300`. */
  debounceMs?: number
  /** When `false`, evaluation is paused. Default `true`. */
  enabled?: boolean
}

/** Props for the standalone {@link JsonataCodeEditor}. */
export interface JsonataCodeEditorProps {
  /** Current expression text. */
  value: string
  /** Fired on every edit. */
  onChange?: (value: string) => void
  /** Disables editing. */
  readOnly?: boolean
  /** Placeholder shown when empty. */
  placeholder?: string
  /** Focus the editor on mount. */
  autoFocus?: boolean
  /** Minimum editor height (CSS value). Default `'2.5rem'`. */
  minHeight?: string
  /** Maximum editor height (CSS value). Default `'12rem'`. */
  maxHeight?: string
  /** Fixed editor height (CSS value) — overrides min/max when set. */
  height?: string
  /** Wrapper className. */
  className?: string
  /** Show line numbers. Default `false`. */
  lineNumbers?: boolean
  /** Enable the parse-error linter (inline squiggles). Default `true`. */
  lint?: boolean
  /**
   * Suggest these context paths in autocomplete. Accepts bare dotted-path
   * strings or rich {@link ContextPathInput} descriptors carrying a `type` /
   * `description` (e.g. from `jsonSchemaToContextPaths`).
   */
  contextPaths?: ContextPathInput[]
  /** `basicSetup` overrides forwarded to CodeMirror. */
  basicSetup?: BasicSetupOptions
  /** Extra CodeMirror extensions appended after the JSONata language. */
  extensions?: Extension[]
  /** Ref to the underlying CodeMirror view, useful for imperative inserts. */
  ref?: Ref<ReactCodeMirrorRef>
}

/** Layout orientation for {@link JsonataEditor}. */
export type JsonataEditorOrientation = 'horizontal' | 'vertical'

/**
 * Context handed to {@link JsonataEditorProps.renderAiAssistant}. Mirrors
 * everything the built-in `JsonataAIAssistant` drawer needs so a custom
 * implementation can render with the same live editor state.
 */
export interface IJsonataAiAssistantRenderContext {
  /** Whether the drawer is currently open. */
  open: boolean
  /** Width the drawer animates to when open, in pixels. */
  width: number
  /** Call to close the drawer from inside the slot. */
  onClose: () => void
  /** Current JSONata expression text in the editor. */
  expression: string
  /** Current JSON input text in the editor. */
  input: string
}

/** A single chat message in the AI Assistant drawer. */
export interface JsonataChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

/** Context handed to the AI Assistant `onSendMessage` callback. */
export interface JsonataAIMessageContext {
  /** Current expression text in the editor. */
  expression: string
  /** Current JSON input text in the editor. */
  input: string
  /** Conversation so far (including the new user message). */
  history: JsonataChatMessage[]
}

/** Configuration for the AI Assistant drawer mounted inside `JsonataEditor`. */
export interface JsonataAIAssistantConfig {
  /**
   * Send handler. Receives the user prompt and the current editor context, and
   * returns the assistant's reply (sync or async). When omitted, the chat UI
   * still mounts but never produces a reply — useful while wiring a backend.
   */
  onSendMessage?: (
    message: string,
    context: JsonataAIMessageContext,
  ) => Promise<string> | string
  /** Suggestion chips shown above the prompt while the chat is empty. */
  suggestions?: string[]
  /** Drawer header title. Default `'AI Assistant'`. */
  title?: string
  /** Empty-state description text. */
  emptyStateDescription?: string
  /** Open the drawer on first render. Default `false`. */
  defaultOpen?: boolean
  /** Drawer width in pixels. Default `320`. */
  width?: number
  /** Placeholder shown inside the prompt textarea. */
  placeholder?: string
}

/** Props for the full three-pane {@link JsonataEditor}. */
export interface JsonataEditorProps {
  /** Controlled JSONata expression. */
  expression?: string
  /** Initial expression for uncontrolled usage. */
  defaultExpression?: string
  /** Fired whenever the expression changes. */
  onExpressionChange?: (expression: string) => void
  /** Controlled JSON input — a string or any JSON-serializable value. */
  input?: string | unknown
  /** Initial JSON input for uncontrolled usage. */
  defaultInput?: string | unknown
  /** Fired whenever the input text changes. */
  onInputChange?: (input: string) => void
  /** Variable bindings injected into `evaluate()` (accessible as `$name`). */
  bindings?: Record<string, unknown>
  /** Fired after a successful evaluation. */
  onResult?: (result: unknown) => void
  /** Fired when parsing the input or running the expression fails. */
  onError?: (error: JsonataEvaluationError) => void
  /** Fired after every evaluation, regardless of outcome. */
  onEvaluate?: (state: JsonataEvaluationState) => void
  /** Pre-defined input + expression pairs for the samples menu. */
  samples?: JsonataSample[]
  /**
   * When provided, the toolbar shows an **AI Assistant** button that slides
   * open a chat drawer on the left of the editor. Pass `true` for a
   * UI-only drawer (no replies) or a config object to wire `onSendMessage`.
   */
  aiAssistant?: boolean | JsonataAIAssistantConfig
  /**
   * Controlled open state for the AI Assistant drawer. When provided, the
   * editor no longer manages the drawer's open state internally — pair with
   * `onAiAssistantOpenChange` to wire it to your own state.
   */
  aiAssistantOpen?: boolean
  /** Fired when the AI Assistant button toggles. */
  onAiAssistantOpenChange?: (open: boolean) => void
  /**
   * Replaces the built-in `JsonataAIAssistant` drawer body. When set, the
   * toolbar button is shown even if `aiAssistant` is omitted, the drawer
   * animates in as usual, and this render fn provides the body. Use this
   * to mount a custom agent (e.g. `DocyrusAgent`) inside the drawer.
   */
  renderAiAssistant?: (ctx: IJsonataAiAssistantRenderContext) => ReactNode
  /** Show the JSON input pane. Default `true`. */
  showInput?: boolean
  /** Show the result pane. Default `true`. */
  showResult?: boolean
  /** Show the header toolbar. Default `true`. */
  showToolbar?: boolean
  /** Title shown in the toolbar. Default `'JSONata'`. */
  title?: string
  /** Pane arrangement. Default `'horizontal'`. */
  orientation?: JsonataEditorOrientation
  /** Debounce before evaluating, in ms. Default `300`. */
  debounceMs?: number
  /** Evaluation timeout in ms. `0` disables the timebox. Default `1000`. */
  evaluationTimeout?: number
  /** Disables editing of both panes. */
  readOnly?: boolean
  /** Overall editor height (CSS value). Default `'28rem'`. */
  height?: number | string
  /** Placeholder shown in the empty expression pane. */
  placeholder?: string
  /**
   * Suggest these context paths in autocomplete in addition to those
   * auto-extracted from `input`. Pass paths from a known schema when the
   * input alone doesn't describe the full shape of the data — bare strings or
   * rich {@link ContextPathInput} descriptors (e.g. from
   * `jsonSchemaToContextPaths`) whose `type` / `description` surface in the
   * autocomplete dropdown.
   */
  contextPaths?: ContextPathInput[]
  /**
   * Render only the expression editor with an expand button. The full
   * input / expression / result workbench opens in a centered dialog.
   * Default `false`.
   */
  compactMode?: boolean
  /** Minimum height of the expression editor in compact mode. Default `'8rem'`. */
  compactMinHeight?: string
  /** Maximum height of the expression editor in compact mode. Default `'20rem'`. */
  compactMaxHeight?: string
  /** Root element className. */
  className?: string
}
