// @ts-nocheck
/* eslint-disable */
import { type ReactNode, type Ref } from 'react'

import {
  type BasicSetupOptions,
  type ReactCodeMirrorRef,
} from '@uiw/react-codemirror'
import { type Extension } from '@codemirror/state'

import { type ContextPathInput } from '@/lib/docyrus/context-paths'

/** A single built-in or custom Handlebars helper described for IntelliSense. */
export interface HandlebarsHelper {
  /** Helper name (e.g. `if`, `each`, `formatCurrency`). */
  name: string
  /** Human-readable call signature (e.g. `{{#each list as |item|}}…{{/each}}`). */
  signature: string
  /** Category used to group completions (e.g. `Built-in`, `Logic`, `Math`). */
  category: string
  /** Short description of what the helper does. */
  description: string
  /** Ordered list of parameters. */
  params: HandlebarsHelperParam[]
  /** Return type as a string (or `'block'` for block helpers). */
  returns: string
  /** Whether the helper is a block helper (`{{#name}}…{{/name}}`). */
  block?: boolean
  /** Optional usage examples. */
  examples?: string[]
  /** Link to documentation. */
  docsUrl?: string
}

/** A single parameter of a {@link HandlebarsHelper}. */
export interface HandlebarsHelperParam {
  name: string
  type: string
  optional?: boolean
  description: string
}

/** The phase at which a Handlebars evaluation failed. */
export type HandlebarsErrorPhase = 'input' | 'parse' | 'render'

/** A normalized error produced while parsing input or rendering a template. */
export interface HandlebarsEvaluationError {
  /** Where the failure happened. */
  phase: HandlebarsErrorPhase
  /** Human-readable message. */
  message: string
  /** Handlebars error type, when available (e.g. `Parse error`). */
  code?: string
  /** Source line, when available. */
  line?: number
  /** Source column, when available. */
  column?: number
}

/** Discriminated union describing the outcome of a render. */
export type HandlebarsEvaluationState =
  | { status: 'idle' }
  | { status: 'empty' }
  | { status: 'evaluating' }
  | { status: 'success'; result: string }
  | { status: 'input-error'; error: HandlebarsEvaluationError }
  | { status: 'parse-error'; error: HandlebarsEvaluationError }
  | { status: 'render-error'; error: HandlebarsEvaluationError }

/** A ready-made input + template pair selectable from the toolbar. */
export interface HandlebarsSample {
  /** Display name shown in the samples menu. */
  name: string
  /** Optional one-line description. */
  description?: string
  /** JSON input — a string or any JSON-serializable value. */
  input: string | unknown
  /** Handlebars template to render against the input. */
  template: string
}

/**
 * A user-supplied helper function. Receives positional args followed by the
 * Handlebars options object (containing `hash`, `fn`, `inverse`, `data`).
 */
export type HandlebarsHelperFn = (...args: unknown[]) => unknown

/** Options accepted by {@link renderHandlebars} and the `useHandlebars` hook. */
export interface HandlebarsRenderOptions {
  /** Additional helpers registered before compilation, keyed by helper name. */
  helpers?: Record<string, HandlebarsHelperFn>
  /** Additional partials registered before compilation, keyed by partial name. */
  partials?: Record<string, string>
  /** Disable HTML-escaping (uses `{{{ }}}` semantics by default for all output). */
  noEscape?: boolean
  /** Treat compile-time warnings as errors. Default `false`. */
  strict?: boolean
}

/** Options for the headless `useHandlebars` hook. */
export interface UseHandlebarsOptions extends HandlebarsRenderOptions {
  /** Debounce before rendering, in ms. Default `300`. */
  debounceMs?: number
  /** When `false`, rendering is paused. Default `true`. */
  enabled?: boolean
}

/** Props for the standalone {@link HandlebarsCodeEditor}. */
export interface HandlebarsCodeEditorProps {
  /** Current template text. */
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
  /** Extra helper names to surface in autocomplete (in addition to built-ins). */
  helperNames?: string[]
  /**
   * Suggest these context paths in autocomplete. Accepts bare dotted-path
   * strings or rich {@link ContextPathInput} descriptors carrying a `type` /
   * `description` (e.g. from `jsonSchemaToContextPaths`).
   */
  contextPaths?: ContextPathInput[]
  /** `basicSetup` overrides forwarded to CodeMirror. */
  basicSetup?: BasicSetupOptions
  /** Extra CodeMirror extensions appended after the Handlebars language. */
  extensions?: Extension[]
  /** Ref to the underlying CodeMirror view, useful for imperative inserts. */
  ref?: Ref<ReactCodeMirrorRef>
}

/** Layout orientation for {@link HandlebarsEditor}. */
export type HandlebarsEditorOrientation = 'horizontal' | 'vertical'

/**
 * Context handed to {@link HandlebarsEditorProps.renderAiAssistant}. Mirrors
 * everything the built-in `HandlebarsAIAssistant` drawer needs so a custom
 * implementation can render with the same live editor state.
 */
export interface IHandlebarsAiAssistantRenderContext {
  /** Whether the drawer is currently open. */
  open: boolean
  /** Width the drawer animates to when open, in pixels. */
  width: number
  /** Call to close the drawer from inside the slot. */
  onClose: () => void
  /** Current Handlebars template text in the editor. */
  template: string
  /** Current JSON input text in the editor. */
  input: string
}

/** How the rendered output is displayed in the OUTPUT tab. The PREVIEW tab is a separate, always-iframe view. */
export type HandlebarsOutputMode = 'text' | 'html'

/** A single chat message in the AI Assistant drawer. */
export interface HandlebarsChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

/** Context handed to the AI Assistant `onSendMessage` callback. */
export interface HandlebarsAIMessageContext {
  /** Current template text in the editor. */
  template: string
  /** Current JSON input text in the editor. */
  input: string
  /** Conversation so far (including the new user message). */
  history: HandlebarsChatMessage[]
}

/** Configuration for the AI Assistant drawer mounted inside `HandlebarsEditor`. */
export interface HandlebarsAIAssistantConfig {
  /**
   * Send handler. Receives the user prompt and the current editor context, and
   * returns the assistant's reply (sync or async). When omitted, the chat UI
   * still mounts but never produces a reply — useful while wiring a backend.
   */
  onSendMessage?: (
    message: string,
    context: HandlebarsAIMessageContext,
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

/** Props for the full three-pane {@link HandlebarsEditor}. */
export interface HandlebarsEditorProps {
  /** Controlled Handlebars template. */
  template?: string
  /** Initial template for uncontrolled usage. */
  defaultTemplate?: string
  /** Fired whenever the template changes. */
  onTemplateChange?: (template: string) => void
  /** Controlled JSON input — a string or any JSON-serializable value. */
  input?: string | unknown
  /** Initial JSON input for uncontrolled usage. */
  defaultInput?: string | unknown
  /** Fired whenever the input text changes. */
  onInputChange?: (input: string) => void
  /** Custom helpers registered before compilation. */
  helpers?: Record<string, HandlebarsHelperFn>
  /** Custom partials registered before compilation. */
  partials?: Record<string, string>
  /** Disable HTML-escaping for all `{{ }}` interpolations. */
  noEscape?: boolean
  /** Fired after a successful render. */
  onResult?: (result: string) => void
  /** Fired when parsing the input or rendering the template fails. */
  onError?: (error: HandlebarsEvaluationError) => void
  /** Fired after every render, regardless of outcome. */
  onEvaluate?: (state: HandlebarsEvaluationState) => void
  /** Pre-defined input + template pairs for the samples menu. */
  samples?: HandlebarsSample[]
  /**
   * When provided, the toolbar shows an **AI Assistant** button that slides
   * open a chat drawer on the left of the editor. Pass `true` for a
   * UI-only drawer (no replies) or a config object to wire `onSendMessage`.
   */
  aiAssistant?: boolean | HandlebarsAIAssistantConfig
  /**
   * Controlled open state for the AI Assistant drawer. When provided, the
   * editor no longer manages the drawer's open state internally — pair with
   * `onAiAssistantOpenChange` to wire it to your own state.
   */
  aiAssistantOpen?: boolean
  /** Fired when the AI Assistant button toggles. */
  onAiAssistantOpenChange?: (open: boolean) => void
  /**
   * Replaces the built-in `HandlebarsAIAssistant` drawer body. When set, the
   * toolbar button is shown even if `aiAssistant` is omitted, the drawer
   * animates in as usual, and this render fn provides the body. Use this
   * to mount a custom agent (e.g. `DocyrusAgent`) inside the drawer.
   */
  renderAiAssistant?: (ctx: IHandlebarsAiAssistantRenderContext) => ReactNode
  /** Show the JSON input pane. Default `true`. */
  showInput?: boolean
  /** Show the output pane. Default `true`. */
  showResult?: boolean
  /** Show the header toolbar. Default `true`. */
  showToolbar?: boolean
  /** Title shown in the toolbar. Default `'Handlebars'`. */
  title?: string
  /** Pane arrangement. Default `'horizontal'`. */
  orientation?: HandlebarsEditorOrientation
  /** How the rendered output is displayed. Default `'html'`. */
  outputMode?: HandlebarsOutputMode
  /** Debounce before rendering, in ms. Default `300`. */
  debounceMs?: number
  /** Disables editing of both panes. */
  readOnly?: boolean
  /** Overall editor height (CSS value). Default `'28rem'`. */
  height?: number | string
  /** Placeholder shown in the empty template pane. */
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
   * Render only the template editor with an expand button. The full
   * template / data / output / preview workbench opens in a centered dialog.
   * Default `false`.
   */
  compactMode?: boolean
  /** Minimum height of the template editor in compact mode. Default `'8rem'`. */
  compactMinHeight?: string
  /** Maximum height of the template editor in compact mode. Default `'20rem'`. */
  compactMaxHeight?: string
  /** Root element className. */
  className?: string
}
