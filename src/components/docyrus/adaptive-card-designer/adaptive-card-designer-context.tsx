'use client'

// @ts-nocheck
/* eslint-disable */
import {
  createContext,
  use,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'

import { type AdaptiveCardPayload } from '@/components/docyrus/adaptive-card'

import {
  type DesignerAction,
  type DesignerFocus,
  type DesignerNode,
  type DesignerState,
  type DesignerTheme,
  type DesignerWidth,
  type HistorySnapshot,
} from './adaptive-card-designer-types'
import { createDefaultNode } from './lib/node-factories'
import { cardToTree, treeToCard } from './lib/node-tree'
import {
  findLocation,
  findNode,
  insertNode,
  isAncestor,
  moveNode,
  removeNode,
  updateNode,
} from './lib/node-traversal'

const MAX_HISTORY = 50

function snapshot(state: DesignerState): HistorySnapshot {
  return {
    root: state.root,
    sampleData: state.sampleData,
    selection: state.selection,
  }
}

function applySnapshot(
  state: DesignerState,
  snap: HistorySnapshot,
): DesignerState {
  return {
    ...state,
    root: snap.root,
    sampleData: snap.sampleData,
    selection: snap.selection,
  }
}

/*
 * History tracking is opt-in: each reducer case that mutates the canonical
 * tree calls `pushHistory()` explicitly. UI-only actions (selection, theme,
 * expansion state) skip the call and stay out of the undo stack.
 */
function pushHistory(state: DesignerState): DesignerState['history'] {
  const past = [...state.history.past, snapshot(state)]

  return {
    past: past.slice(-MAX_HISTORY),
    future: [],
  }
}

const MUTATING_ACTION_TYPES = new Set<DesignerAction['type']>([
  'SET_ROOT',
  'SET_SAMPLE_DATA',
  'UPDATE_NODE',
  'INSERT_NODE',
  'REMOVE_NODE',
  'MOVE_NODE',
  'UNDO',
  'REDO',
  'RESET',
])

function designerReducer(
  state: DesignerState,
  action: DesignerAction,
): DesignerState {
  if (state.readOnly && MUTATING_ACTION_TYPES.has(action.type)) return state

  switch (action.type) {
    case 'SET_ROOT': {
      if (action.root === state.root) return state

      const next: DesignerState = { ...state, root: action.root }

      if (state.selection && !findNode(action.root, state.selection)) {
        next.selection = null
      }

      return { ...next, history: pushHistory(state) }
    }

    case 'SET_SAMPLE_DATA': {
      if (action.data === state.sampleData) return state

      return {
        ...state,
        sampleData: action.data,
        history: pushHistory(state),
      }
    }

    case 'UPDATE_NODE': {
      const nextRoot = updateNode(state.root, action.id, (node) => ({
        ...node,
        props: { ...node.props, ...action.props },
      }))

      if (nextRoot === state.root) return state

      return {
        ...state,
        root: nextRoot,
        history: pushHistory(state),
      }
    }

    case 'INSERT_NODE': {
      const nextRoot = insertNode(
        state.root,
        action.parentId,
        action.slot,
        action.index,
        action.node,
      )

      if (nextRoot === state.root) return state

      return {
        ...state,
        root: nextRoot,
        selection: action.node.__designerId,
        history: pushHistory(state),
      }
    }

    case 'REMOVE_NODE': {
      if (action.id === state.root.__designerId) return state

      const nextRoot = removeNode(state.root, action.id)

      if (nextRoot === state.root) return state

      return {
        ...state,
        root: nextRoot,
        selection: state.selection === action.id ? null : state.selection,
        history: pushHistory(state),
      }
    }

    case 'MOVE_NODE': {
      if (action.id === state.root.__designerId) return state
      if (isAncestor(state.root, action.id, action.targetParentId)) return state

      const nextRoot = moveNode(
        state.root,
        action.id,
        action.targetParentId,
        action.targetSlot,
        action.targetIndex,
      )

      if (nextRoot === state.root) return state

      return {
        ...state,
        root: nextRoot,
        history: pushHistory(state),
      }
    }

    case 'SELECT':
      if (state.selection === action.id) return state

      return { ...state, selection: action.id }

    case 'TOGGLE_EXPANDED': {
      const current = state.expanded[action.id] ?? true

      return {
        ...state,
        expanded: { ...state.expanded, [action.id]: !current },
      }
    }

    case 'SET_EXPANDED':
      return {
        ...state,
        expanded: { ...state.expanded, [action.id]: action.expanded },
      }

    case 'SET_ALL_EXPANDED': {
      const expanded: Record<string, boolean> = {}

      const walk = (node: DesignerNode) => {
        expanded[node.__designerId] = action.expanded
        for (const children of Object.values(node.slots)) {
          for (const child of children) walk(child)
        }
      }

      walk(state.root)

      return { ...state, expanded }
    }

    case 'TOGGLE_PREVIEW':
      return { ...state, preview: !state.preview }

    case 'SET_PREVIEW':
      return { ...state, preview: action.preview }

    case 'SET_THEME':
      return { ...state, theme: action.theme }

    case 'SET_WIDTH':
      return { ...state, width: action.width }

    case 'SET_FOCUSED':
      return { ...state, focused: action.focused }

    case 'SET_DIAGNOSTICS':
      return { ...state, diagnostics: action.diagnostics }

    case 'SET_READ_ONLY':
      if (state.readOnly === action.readOnly) return state

      return { ...state, readOnly: action.readOnly }

    case 'UNDO': {
      const prev = state.history.past[state.history.past.length - 1]

      if (!prev) return state

      const past = state.history.past.slice(0, -1)
      const future = [snapshot(state), ...state.history.future]

      return applySnapshot({ ...state, history: { past, future } }, prev)
    }

    case 'REDO': {
      const next = state.history.future[0]

      if (!next) return state

      const past = [...state.history.past, snapshot(state)]
      const future = state.history.future.slice(1)

      return applySnapshot({ ...state, history: { past, future } }, next)
    }

    case 'RESET': {
      const root = createDefaultNode('__root')

      return {
        ...state,
        root,
        sampleData: undefined,
        selection: null,
        expanded: {},
        history: {
          past: [...state.history.past, snapshot(state)].slice(-MAX_HISTORY),
          future: [],
        },
      }
    }

    default:
      return state
  }
}

/* ─── Context value ───────────────────────────────────────────── */

interface DesignerContextValue {
  state: DesignerState
  dispatch: Dispatch<DesignerAction>
  selectedNode: DesignerNode | null
  /** Convenience: location of the selected node (parent + slot + index). */
  selectedLocation: ReturnType<typeof findLocation>
  canUndo: boolean
  canRedo: boolean
  payload: AdaptiveCardPayload
}

const DesignerContext = createContext<DesignerContextValue | null>(null)

export function useDesignerContext(): DesignerContextValue {
  const ctx = use(DesignerContext)

  if (!ctx)
    throw new Error('useDesignerContext must be used within <DesignerProvider>')

  return ctx
}

/* ─── Provider ────────────────────────────────────────────────── */

export interface DesignerProviderProps {
  children: ReactNode
  payload?: AdaptiveCardPayload
  defaultPayload?: AdaptiveCardPayload
  sampleData?: unknown
  defaultSampleData?: unknown
  defaultPreview?: boolean
  defaultTheme?: DesignerTheme
  defaultWidth?: DesignerWidth
  readOnly?: boolean
  onChange?: (next: {
    payload: AdaptiveCardPayload
    sampleData: unknown
  }) => void
}

function initialRoot(
  controlled: AdaptiveCardPayload | undefined,
  fallback: AdaptiveCardPayload | undefined,
): DesignerNode {
  const source = controlled ?? fallback

  if (!source) return createDefaultNode('__root')

  return cardToTree(source)
}

export function DesignerProvider({
  children,
  payload,
  defaultPayload,
  sampleData,
  defaultSampleData,
  defaultPreview = false,
  defaultTheme = 'auto',
  defaultWidth = 'standard',
  readOnly = false,
  onChange,
}: DesignerProviderProps) {
  /*
   * Computed once on mount — controlled prop changes flow through the sync
   * effect below instead.
   */
  const [seed] = useState<DesignerNode>(() =>
    initialRoot(payload, defaultPayload),
  )
  const [seedData] = useState<unknown>(() => sampleData ?? defaultSampleData)

  const [state, dispatch] = useReducer(
    designerReducer,
    undefined,
    () =>
      ({
        root: seed,
        sampleData: seedData,
        selection: null,
        expanded: {},
        history: { past: [], future: [] },
        preview: defaultPreview,
        theme: defaultTheme,
        width: defaultWidth,
        focused: 'canvas' as DesignerFocus,
        diagnostics: [],
        readOnly,
      }) satisfies DesignerState,
  )

  /*
   * Keep `state.readOnly` synced with the prop after mount so toggling the
   * `<AdaptiveCardDesigner readOnly>` prop at runtime takes effect without
   * remounting the whole tree.
   */
  useEffect(() => {
    if (state.readOnly === readOnly) return

    dispatch({ type: 'SET_READ_ONLY', readOnly })
  }, [readOnly, state.readOnly])

  const onChangeRef = useRef(onChange)

  onChangeRef.current = onChange

  const lastEmittedRef = useRef<string>('')

  useEffect(() => {
    const emittedPayload = treeToCard(state.root)
    const compact = JSON.stringify({
      payload: emittedPayload,
      sampleData: state.sampleData,
    })

    if (compact === lastEmittedRef.current) return

    lastEmittedRef.current = compact
    onChangeRef.current?.({
      payload: emittedPayload,
      sampleData: state.sampleData,
    })
  }, [state.root, state.sampleData])

  /*
   * Sync controlled `payload` back into the tree on external changes. Skip
   * the very first render (we already seeded from the same value).
   */
  const isFirstPayloadSyncRef = useRef(true)

  useEffect(() => {
    if (isFirstPayloadSyncRef.current) {
      isFirstPayloadSyncRef.current = false

      return
    }

    if (payload === undefined) return

    const compactExternal = JSON.stringify(payload)
    const compactCurrent = JSON.stringify(treeToCard(state.root))

    if (compactExternal === compactCurrent) return

    dispatch({ type: 'SET_ROOT', root: cardToTree(payload) })
  }, [payload, state.root])

  const isFirstDataSyncRef = useRef(true)

  useEffect(() => {
    if (isFirstDataSyncRef.current) {
      isFirstDataSyncRef.current = false

      return
    }

    if (sampleData === undefined) return
    if (sampleData === state.sampleData) return

    dispatch({ type: 'SET_SAMPLE_DATA', data: sampleData })
  }, [sampleData, state.sampleData])

  const selectedNode = useMemo(
    () => (state.selection ? findNode(state.root, state.selection) : null),
    [state.root, state.selection],
  )

  const selectedLocation = useMemo(
    () => (state.selection ? findLocation(state.root, state.selection) : null),
    [state.root, state.selection],
  )

  const payloadOut = useMemo(() => treeToCard(state.root), [state.root])

  const value = useMemo<DesignerContextValue>(
    () => ({
      state,
      dispatch,
      selectedNode,
      selectedLocation,
      canUndo: state.history.past.length > 0,
      canRedo: state.history.future.length > 0,
      payload: payloadOut,
    }),
    [state, selectedNode, selectedLocation, payloadOut],
  )

  return <DesignerContext value={value}>{children}</DesignerContext>
}
