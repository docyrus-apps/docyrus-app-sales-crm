'use client'

// @ts-nocheck
/* eslint-disable */
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
} from 'react'

import {
  type DesignerAction,
  type DesignerState,
  type JsonSchema,
  type SchemaNode,
  type ToolboxItemDef,
} from './json-schema-designer-types'
import { schemaToTree, treeToSchema } from './lib/schema-conversion'
import {
  canAcceptChild,
  createEmptyRoot,
  createNode,
  createNodeId,
  findNode,
  findParent,
  isContainerType,
  mapTree,
  uniqueKey,
} from './lib/schema-node'

function updateNodeById(
  node: SchemaNode,
  id: string,
  updater: (node: SchemaNode) => SchemaNode,
): SchemaNode {
  if (node.id === id) return updater(node)

  let changed = false
  const children = node.children.map((child) => {
    const next = updateNodeById(child, id, updater)

    if (next !== child) changed = true

    return next
  })

  return changed ? { ...node, children } : node
}

function removeNodeById(node: SchemaNode, id: string): SchemaNode {
  let changed = false
  const children: SchemaNode[] = []

  for (const child of node.children) {
    if (child.id === id) {
      changed = true
      continue
    }

    const next = removeNodeById(child, id)

    if (next !== child) changed = true

    children.push(next)
  }

  return changed ? { ...node, children } : node
}

function insertChild(
  node: SchemaNode,
  parentId: string,
  child: SchemaNode,
  index?: number,
): SchemaNode {
  if (node.id === parentId) {
    const children = [...node.children]
    const at =
      index === undefined || index < 0 || index > children.length
        ? children.length
        : index

    children.splice(at, 0, child)

    return { ...node, children }
  }

  let changed = false
  const children = node.children.map((existing) => {
    const next = insertChild(existing, parentId, child, index)

    if (next !== existing) changed = true

    return next
  })

  return changed ? { ...node, children } : node
}

function cloneSubtree(node: SchemaNode): SchemaNode {
  return {
    ...node,
    id: createNodeId(),
    children: node.children.map(cloneSubtree),
  }
}

/** Reset children + type-specific constraints when a node's `type` changes. */
function applyTypeChange(
  node: SchemaNode,
  nextType: SchemaNode['type'],
): SchemaNode {
  return {
    id: node.id,
    key: node.key,
    type: nextType,
    title: node.title,
    description: node.description,
    required: node.required,
    nullable: node.nullable,
    collapsed: node.collapsed,
    extra: node.extra,
    children: [],
  }
}

function designerReducer(
  state: DesignerState,
  action: DesignerAction,
): DesignerState {
  switch (action.type) {
    case 'ADD_NODE': {
      const { parentId, template, index, select } = action.payload
      const parent = findNode(state.root, parentId)

      if (!parent || !canAcceptChild(parent)) return state

      const keyBase = parent.type === 'array' ? 'item' : template.type
      const key =
        parent.type === 'array'
          ? 'item'
          : uniqueKey(
              keyBase,
              parent.children.map((child) => child.key),
            )
      const node = createNode(template, key)
      const root = insertChild(state.root, parentId, node, index)

      return {
        ...state,
        root,
        selectedId: select === false ? state.selectedId : node.id,
      }
    }

    case 'REMOVE_NODE': {
      const { id } = action.payload

      if (id === state.root.id) return state

      return {
        ...state,
        root: removeNodeById(state.root, id),
        selectedId: state.selectedId === id ? null : state.selectedId,
      }
    }

    case 'DUPLICATE_NODE': {
      const { id } = action.payload
      const parent = findParent(state.root, id)
      const original = findNode(state.root, id)

      if (!parent || !original) return state

      const originalIndex = parent.children.findIndex(
        (child) => child.id === id,
      )
      const clone = cloneSubtree(original)

      clone.key =
        parent.type === 'array'
          ? 'item'
          : uniqueKey(
              `${original.key}_copy`,
              parent.children.map((child) => child.key),
            )

      if (parent.type === 'array') return state

      return {
        ...state,
        root: insertChild(state.root, parent.id, clone, originalIndex + 1),
        selectedId: clone.id,
      }
    }

    case 'UPDATE_NODE': {
      const { id, updates } = action.payload

      const root = updateNodeById(state.root, id, (node) => {
        let next: SchemaNode = node

        if (updates.type && updates.type !== node.type) {
          next = applyTypeChange(node, updates.type)
        }

        next = { ...next, ...updates }

        if (updates.key !== undefined && id !== state.root.id) {
          const parent = findParent(state.root, id)

          if (parent && parent.type === 'object') {
            const siblingKeys = parent.children
              .filter((child) => child.id !== id)
              .map((child) => child.key)

            next = { ...next, key: uniqueKey(updates.key, siblingKeys) }
          }
        }

        return next
      })

      return { ...state, root }
    }

    case 'SET_COLLAPSED': {
      const { id, collapsed } = action.payload
      const root = updateNodeById(state.root, id, (node) => ({
        ...node,
        collapsed,
      }))

      return { ...state, root }
    }

    case 'SET_ALL_COLLAPSED': {
      const { collapsed } = action.payload
      const root = mapTree(state.root, (node) =>
        isContainerType(node.type) && node.children.length > 0
          ? { ...node, collapsed }
          : node,
      )

      return { ...state, root: { ...root, collapsed: false } }
    }

    case 'SELECT_NODE':
      return { ...state, selectedId: action.payload.id }

    case 'SET_STRICT_MODE':
      return { ...state, strictMode: action.payload.strictMode }

    case 'REPLACE_ROOT': {
      const { root } = action.payload

      return {
        ...state,
        root,
        selectedId:
          state.selectedId && findNode(root, state.selectedId)
            ? state.selectedId
            : null,
      }
    }

    case 'CLEAR_ALL':
      return { ...state, root: createEmptyRoot(), selectedId: null }

    default:
      return state
  }
}

interface HistoryState {
  past: DesignerState[]
  present: DesignerState
  future: DesignerState[]
}

const MAX_HISTORY = 80

const NON_UNDOABLE = new Set<DesignerAction['type']>([
  'SELECT_NODE',
  'SET_COLLAPSED',
  'SET_ALL_COLLAPSED',
  'SET_STRICT_MODE',
  'UNDO',
  'REDO',
])

function historyReducer(
  history: HistoryState,
  action: DesignerAction,
): HistoryState {
  const { past, present, future } = history

  if (action.type === 'UNDO') {
    const previous = past[past.length - 1]

    if (!previous) return history

    return {
      past: past.slice(0, -1),
      present: previous,
      future: [present, ...future],
    }
  }

  if (action.type === 'REDO') {
    const next = future[0]

    if (!next) return history

    return {
      past: [...past, present],
      present: next,
      future: future.slice(1),
    }
  }

  const nextPresent = designerReducer(present, action)

  if (nextPresent === present) return history

  if (NON_UNDOABLE.has(action.type)) {
    return { ...history, present: nextPresent }
  }

  return {
    past: [...past.slice(-(MAX_HISTORY - 1)), present],
    present: nextPresent,
    future: [],
  }
}

interface DesignerContextValue {
  state: DesignerState
  dispatch: Dispatch<DesignerAction>
  selectedNode: SchemaNode | null
  readOnly: boolean
  canUndo: boolean
  canRedo: boolean
  addNode: (
    parentId: string,
    template: ToolboxItemDef['template'],
    index?: number,
  ) => void
  removeNode: (id: string) => void
  duplicateNode: (id: string) => void
  selectNode: (id: string | null) => void
  updateNode: (id: string, updates: Partial<SchemaNode>) => void
  setStrictMode: (strictMode: boolean) => void
}

const DesignerContext = createContext<DesignerContextValue | null>(null)

export function useDesignerContext(): DesignerContextValue {
  const ctx = use(DesignerContext)

  if (!ctx)
    throw new Error('useDesignerContext must be used within <DesignerProvider>')

  return ctx
}

export interface DesignerProviderProps {
  children: ReactNode
  /** Controlled JSON Schema. Re-imports the tree when it changes externally. */
  value?: JsonSchema
  /** Initial JSON Schema for uncontrolled use. */
  defaultValue?: JsonSchema
  /** Fired with the updated JSON Schema after every edit. */
  onChange?: (schema: JsonSchema) => void
  readOnly?: boolean
  /** Initial value of OpenAI strict-mode (defaults to `false`). */
  defaultStrictMode?: boolean
}

export function DesignerProvider({
  children,
  value,
  defaultValue,
  onChange,
  readOnly = false,
  defaultStrictMode = false,
}: DesignerProviderProps) {
  /*
   * Computed once on mount — later controlled `value` changes flow through the
   * sync effect below rather than recomputing this initial tree.
   */
  const [initialRoot] = useState(() =>
    schemaToTree(value ?? defaultValue ?? null),
  )

  const [history, dispatch] = useReducer(historyReducer, undefined, () => ({
    past: [],
    present: {
      root: initialRoot,
      selectedId: null,
      strictMode: defaultStrictMode,
    } satisfies DesignerState,
    future: [],
  }))

  const state = history.present

  const onChangeRef = useRef(onChange)

  onChangeRef.current = onChange

  const lastSyncedRef = useRef<string>(
    JSON.stringify(treeToSchema(initialRoot, defaultStrictMode)),
  )
  const isFirstSyncRef = useRef(true)

  useEffect(() => {
    const compact = JSON.stringify(treeToSchema(state.root, state.strictMode))

    if (compact === lastSyncedRef.current) return

    lastSyncedRef.current = compact
    onChangeRef.current?.(treeToSchema(state.root, state.strictMode))
  }, [state.root, state.strictMode])

  useEffect(() => {
    if (isFirstSyncRef.current) {
      isFirstSyncRef.current = false

      return
    }

    if (value === undefined) return

    const compact = JSON.stringify(value)

    if (compact === lastSyncedRef.current) return

    lastSyncedRef.current = compact
    dispatch({ type: 'REPLACE_ROOT', payload: { root: schemaToTree(value) } })
  }, [value])

  const selectedNode = useMemo(
    () => (state.selectedId ? findNode(state.root, state.selectedId) : null),
    [state.root, state.selectedId],
  )

  const addNode = useCallback(
    (
      parentId: string,
      template: ToolboxItemDef['template'],
      index?: number,
    ) => {
      dispatch({
        type: 'ADD_NODE',
        payload: { parentId, template, index },
      })
    },
    [],
  )

  const removeNode = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NODE', payload: { id } })
  }, [])

  const duplicateNode = useCallback((id: string) => {
    dispatch({ type: 'DUPLICATE_NODE', payload: { id } })
  }, [])

  const selectNode = useCallback((id: string | null) => {
    dispatch({ type: 'SELECT_NODE', payload: { id } })
  }, [])

  const updateNode = useCallback((id: string, updates: Partial<SchemaNode>) => {
    dispatch({ type: 'UPDATE_NODE', payload: { id, updates } })
  }, [])

  const setStrictMode = useCallback((strictMode: boolean) => {
    dispatch({ type: 'SET_STRICT_MODE', payload: { strictMode } })
  }, [])

  const contextValue = useMemo<DesignerContextValue>(
    () => ({
      state,
      dispatch,
      selectedNode,
      readOnly,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
      addNode,
      removeNode,
      duplicateNode,
      selectNode,
      updateNode,
      setStrictMode,
    }),
    [
      state,
      selectedNode,
      readOnly,
      history.past.length,
      history.future.length,
      addNode,
      removeNode,
      duplicateNode,
      selectNode,
      updateNode,
      setStrictMode,
    ],
  )

  return <DesignerContext value={contextValue}>{children}</DesignerContext>
}
