'use client'

// @ts-nocheck
/* eslint-disable */
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronRight, Copy, GripVertical, Plus, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

import { type FlatSchemaNode } from '../json-schema-designer-types'
import { useDesignerContext } from '../json-schema-designer-context'
import { canAcceptChild, findParent, isContainerType } from '../lib/schema-node'
import { useDesignerDnd } from './designer-dnd'
import { NODE_ICONS, getNodeIconKey } from './node-icon'

interface SchemaTreeNodeProps {
  flat: FlatSchemaNode
}

/** A single sortable row in the schema tree. */
export function SchemaTreeNode({ flat }: SchemaTreeNodeProps) {
  const { node, depth } = flat
  const { state, dispatch, readOnly, selectNode, removeNode, duplicateNode } =
    useDesignerContext()
  const { activeDrag, projection, dropTargetId, indentWidth } = useDesignerDnd()

  const isRoot = node.id === state.root.id
  const isSelected = state.selectedId === node.id
  const isContainer = isContainerType(node.type)
  const hasChildren = node.children.length > 0
  const parent = isRoot ? null : findParent(state.root, node.id)
  const inArray = parent?.type === 'array'

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: node.id,
    data: { source: 'tree' },
    /*
     * The root cannot be dragged, but it stays droppable so nodes can be
     * dropped onto an empty schema.
     */
    disabled: { draggable: isRoot || readOnly, droppable: readOnly },
  })

  const isActiveDrag =
    activeDrag?.source === 'tree' && activeDrag.nodeId === node.id
  const renderDepth = isActiveDrag && projection ? projection.depth : depth
  const isDropTarget = dropTargetId === node.id

  const Icon = NODE_ICONS[getNodeIconKey(node)]
  const displayKey = isRoot
    ? node.title || 'schema'
    : inArray
      ? 'items'
      : node.key

  const toggleCollapsed = () => {
    dispatch({
      type: 'SET_COLLAPSED',
      payload: { id: node.id, collapsed: !node.collapsed },
    })
  }

  const addChild = () => {
    if (readOnly) return

    if (node.collapsed) {
      dispatch({
        type: 'SET_COLLAPSED',
        payload: { id: node.id, collapsed: false },
      })
    }

    dispatch({
      type: 'ADD_NODE',
      payload: { parentId: node.id, template: { type: 'string' } },
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        paddingLeft: renderDepth * indentWidth + 6,
      }}
      className={cn(
        'group/row relative flex items-center gap-1 rounded-md border py-1 pr-1',
        'transition-colors',
        isSelected
          ? 'border-primary/60 bg-primary/5'
          : 'border-transparent hover:bg-accent/60',
        isDropTarget && 'border-primary bg-primary/10 ring-1 ring-primary',
        isDragging && 'opacity-40',
      )}
      onClick={() => selectNode(node.id)}
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={isContainer && hasChildren ? !node.collapsed : undefined}
      tabIndex={-1}
    >
      {/* Drag handle */}
      <button
        type="button"
        className={cn(
          'flex size-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground/40',
          'hover:text-muted-foreground active:cursor-grabbing',
          (isRoot || readOnly) && 'invisible',
        )}
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>

      {/* Collapse toggle */}
      {isContainer && hasChildren ? (
        <button
          type="button"
          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation()
            toggleCollapsed()
          }}
          aria-label={node.collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronRight
            className={cn(
              'size-3.5 transition-transform',
              !node.collapsed && 'rotate-90',
            )}
          />
        </button>
      ) : (
        <span className="size-5 shrink-0" />
      )}

      {/* Type icon */}
      <Icon className="size-4 shrink-0 text-muted-foreground" />

      {/* Key */}
      <span
        className={cn(
          'truncate text-xs font-medium',
          inArray ? 'italic text-muted-foreground' : 'text-foreground',
        )}
      >
        {displayKey}
      </span>
      {node.required && !isRoot && !inArray && (
        <span
          className="shrink-0 text-xs font-bold text-destructive"
          title="Required"
        >
          *
        </span>
      )}

      {/* Type / format badges */}
      <Badge
        variant="secondary"
        className="h-4 shrink-0 px-1 text-[10px] font-normal"
      >
        {node.type}
        {node.nullable ? ' | null' : ''}
      </Badge>
      {node.enumValues && node.enumValues.length > 0 && (
        <Badge
          variant="outline"
          className="h-4 shrink-0 px-1 text-[10px] font-normal"
        >
          enum
        </Badge>
      )}
      {node.format && (
        <Badge
          variant="outline"
          className="hidden h-4 shrink-0 px-1 text-[10px] font-normal sm:inline-flex"
        >
          {node.format}
        </Badge>
      )}
      {isContainer && node.collapsed && hasChildren && (
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {node.children.length}
        </span>
      )}

      <span className="flex-1" />

      {/* Row actions */}
      {!readOnly && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100 focus-within:opacity-100">
          {canAcceptChild(node) && (
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation()
                addChild()
              }}
              aria-label="Add child"
              title="Add child"
            >
              <Plus className="size-3.5" />
            </button>
          )}
          {!isRoot && !inArray && (
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={(event) => {
                event.stopPropagation()
                duplicateNode(node.id)
              }}
              aria-label="Duplicate"
              title="Duplicate"
            >
              <Copy className="size-3.5" />
            </button>
          )}
          {!isRoot && (
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation()
                removeNode(node.id)
              }}
              aria-label="Delete"
              title="Delete"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
