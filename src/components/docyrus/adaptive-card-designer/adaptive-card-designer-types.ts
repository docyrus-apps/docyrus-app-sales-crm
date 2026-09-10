// @ts-nocheck
/* eslint-disable */
import { type ComponentType, type ReactNode } from 'react'

import {
  type AdaptiveCardHostConfigOverride,
  type AdaptiveCardPayload,
  type ElementRenderer,
} from '@/components/docyrus/adaptive-card'

/*
 * The designer works on its own normalized tree rather than the raw
 * `AdaptiveCardPayload` for two reasons:
 *   1. Stable per-node ids that survive JSON edits without mutating the
 *      user-authored `element.id` field.
 *   2. Every element's heterogeneous child arrays (items / columns / rows /
 *      cells / actions / inlines / facts / choices / tabs / pages) collapse
 *      into a uniform `slots` map so the tree walker, DnD flattening, and
 *      serializer don't need a case per shape.
 */

export type DesignerRootType = '__root'

export interface DesignerNode {
  /** Stable internal id — generated, never written to output JSON. */
  __designerId: string
  /**
   * Element / action / input type discriminant.
   * `'__root'` represents the `AdaptiveCard` itself.
   */
  type: string
  /**
   * Raw element fields **except** the ones mapped into `slots`. Unknown keys
   * are preserved here so forward-compat custom elements round-trip losslessly.
   */
  props: Record<string, unknown>
  /**
   * Child nodes grouped by slot name. Slot names match the JSON arrays in the
   * original element (e.g. `items`, `columns`, `rows`, `cells`, `actions`,
   * `inlines`, `facts`, `choices`, `tabs`, `pages`). The slot set per type is
   * declared in `SLOT_MAP`.
   */
  slots: Record<string, DesignerNode[]>
}

/** A snapshot pushed to the history stack on every undoable action. */
export interface HistorySnapshot {
  root: DesignerNode
  sampleData: unknown
  selection: string | null
}

export type DesignerTheme = 'light' | 'dark' | 'auto'
export type DesignerWidth = 'standard' | 'wide' | 'full'
export type DesignerFocus = 'canvas' | 'payload' | 'data'

export interface DesignerDiagnostic {
  level: 'info' | 'warning' | 'error'
  message: string
  nodeId?: string
}

export interface DesignerState {
  root: DesignerNode
  sampleData: unknown
  selection: string | null
  /** Structure-tree expansion state, keyed by `__designerId`. */
  expanded: Record<string, boolean>
  history: { past: HistorySnapshot[]; future: HistorySnapshot[] }
  preview: boolean
  theme: DesignerTheme
  width: DesignerWidth
  /** Which editor was last focused — wins on JSON ↔ tree conflict. */
  focused: DesignerFocus
  diagnostics: DesignerDiagnostic[]
  /** When true, all mutating reducer actions short-circuit. */
  readOnly: boolean
}

export type DesignerAction =
  | { type: 'SET_ROOT'; root: DesignerNode }
  | { type: 'SET_SAMPLE_DATA'; data: unknown }
  | { type: 'UPDATE_NODE'; id: string; props: Record<string, unknown> }
  | {
      type: 'INSERT_NODE'
      parentId: string
      slot: string
      index: number
      node: DesignerNode
    }
  | { type: 'REMOVE_NODE'; id: string }
  | {
      type: 'MOVE_NODE'
      id: string
      targetParentId: string
      targetSlot: string
      targetIndex: number
    }
  | { type: 'SELECT'; id: string | null }
  | { type: 'TOGGLE_EXPANDED'; id: string }
  | { type: 'SET_EXPANDED'; id: string; expanded: boolean }
  | { type: 'SET_ALL_EXPANDED'; expanded: boolean }
  | { type: 'TOGGLE_PREVIEW' }
  | { type: 'SET_PREVIEW'; preview: boolean }
  | { type: 'SET_THEME'; theme: DesignerTheme }
  | { type: 'SET_WIDTH'; width: DesignerWidth }
  | { type: 'SET_FOCUSED'; focused: DesignerFocus }
  | { type: 'SET_DIAGNOSTICS'; diagnostics: DesignerDiagnostic[] }
  | { type: 'SET_READ_ONLY'; readOnly: boolean }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET' }

/** A draggable element-type entry shown in the left toolbox pane. */
export interface ToolboxItem {
  /** Unique identifier — equal to `type` for built-ins, free-form for extras. */
  id: string
  /** Element / action / input type the toolbox item produces. */
  type: string
  /** Display label. */
  label: string
  /** Lucide icon component. */
  icon: ComponentType<{ className?: string }>
  /** Display group. Built-ins use `'elements' | 'inputs' | 'actions' | 'advanced'`. */
  group: ToolboxGroup | string
  /** Lowercase search terms. */
  keywords: string[]
  /** Returns a fresh node — called each time the user drops the item. */
  factory: () => DesignerNode
}

export type ToolboxGroup = 'elements' | 'inputs' | 'actions' | 'advanced'

/** Buttons that can be hidden via the `hideToolbarButtons` prop. */
export type ToolbarButtonKey =
  | 'new'
  | 'theme'
  | 'width'
  | 'undo'
  | 'redo'
  | 'copy'
  | 'preview'

/**
 * Context handed to {@link AdaptiveCardDesignerProps.renderAiAssistant}.
 * Mirrors the live designer state so a custom drawer can shape its prompts
 * to the current payload + sample data.
 */
export interface IAdaptiveCardAiAssistantRenderContext {
  /** Whether the drawer is currently open. */
  open: boolean
  /** Width the drawer animates to when open, in pixels. */
  width: number
  /** Call to close the drawer from inside the slot. */
  onClose: () => void
  /** Current Adaptive Card payload in the designer. */
  payload: AdaptiveCardPayload
  /** Current sample data used for template binding. */
  sampleData: unknown
}

export interface AdaptiveCardDesignerProps {
  /** Current card payload (controlled). */
  payload?: AdaptiveCardPayload
  /** Default payload when uncontrolled. */
  defaultPayload?: AdaptiveCardPayload
  /** Sample data used for templating in the preview canvas (controlled). */
  sampleData?: unknown
  /** Default sample data when uncontrolled. */
  defaultSampleData?: unknown
  /** Fires after every payload or sample-data edit. */
  onChange?: (next: {
    payload: AdaptiveCardPayload
    sampleData: unknown
  }) => void
  /** Forwarded to the inner `<AdaptiveCard hostConfig />`. */
  hostConfig?: AdaptiveCardHostConfigOverride
  /** Forwarded to the inner `<AdaptiveCard customElements />`. */
  customElements?: Record<string, ElementRenderer>
  /** Initial preview-mode state. */
  defaultPreview?: boolean
  /** Initial theme. */
  defaultTheme?: DesignerTheme
  /** Initial canvas width. */
  defaultWidth?: DesignerWidth
  /** Hide specific toolbar buttons. */
  hideToolbarButtons?: ToolbarButtonKey[]
  /** Append additional toolbox items (alongside the built-ins). */
  extraToolboxItems?: ToolboxItem[]
  /** Designer chrome height. Defaults to `'70vh'`. */
  height?: string
  className?: string
  /**
   * When true, disables all mutations: toolbox drag, drop zones, property
   * edits, JSON / sample-data panel edits, undo / redo / new toolbar buttons,
   * keyboard shortcuts. Theme / width / preview / copy stay active. Selection
   * (click in canvas / structure tree) remains enabled so users can navigate
   * and inspect properties in read-only form.
   */
  readOnly?: boolean
  /** Controlled open state for the AI Assistant drawer. */
  aiAssistantOpen?: boolean
  /** Fired when the AI Assistant toolbar button toggles. */
  onAiAssistantOpenChange?: (open: boolean) => void
  /**
   * Renders a custom AI Assistant drawer body inside the designer. When set,
   * the toolbar shows a Bot button that toggles the drawer; the render fn
   * receives the live payload + sample data.
   */
  renderAiAssistant?: (ctx: IAdaptiveCardAiAssistantRenderContext) => ReactNode
}
