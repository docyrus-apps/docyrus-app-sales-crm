'use client'

// @ts-nocheck
/* eslint-disable */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
  type Ref,
} from 'react'

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronDown,
  ChevronRight,
  EllipsisVertical,
  GripVertical,
  Search,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type VariantProps, cva } from 'class-variance-authority'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

export interface TreeViewItem {
  id: string
  name: string
  type: string
  children?: TreeViewItem[]
  checked?: boolean
  draggable?: boolean
  [key: string]: unknown
}

export interface TreeViewIconMap {
  [key: string]: ReactNode | undefined
}

export interface TreeViewMenuItem {
  id: string
  label: string
  icon?: ReactNode
  action: (items: TreeViewItem[]) => void
}

export type TreeViewCheckboxPosition = 'left' | 'right'
export type TreeViewDropPosition = 'before' | 'inside' | 'after' | 'root'

export interface TreeViewMoveDetails {
  activeItem: TreeViewItem
  overItem: TreeViewItem | null
  parentItem: TreeViewItem | null
  position: TreeViewDropPosition
}

export const canTreeViewItemAcceptChildren = (item: TreeViewItem): boolean =>
  Array.isArray(item.children)

const cloneTreeItems = (items: TreeViewItem[]): TreeViewItem[] =>
  items.map((item) => ({
    ...item,
    children: Array.isArray(item.children)
      ? cloneTreeItems(item.children)
      : item.children,
  }))

export const treeItemContainsId = (
  item: TreeViewItem,
  targetId: string,
): boolean => {
  if (item.id === targetId) return true

  return (
    item.children?.some((child) => treeItemContainsId(child, targetId)) ?? false
  )
}

const findItemRecord = (
  items: TreeViewItem[],
  id: string,
  parentItem: TreeViewItem | null = null,
): {
  item: TreeViewItem
  index: number
  parentItem: TreeViewItem | null
} | null => {
  for (let index = 0; index < items.length; index++) {
    const item = items[index]

    if (!item) continue

    if (item.id === id) {
      return {
        item,
        index,
        parentItem,
      }
    }

    if (!Array.isArray(item.children)) continue

    const childRecord = findItemRecord(item.children, id, item)

    if (childRecord) return childRecord
  }

  return null
}

const removeTreeItem = (
  items: TreeViewItem[],
  id: string,
): {
  nextItems: TreeViewItem[]
  removedItem: TreeViewItem | null
} => {
  let removedItem: TreeViewItem | null = null

  const nextItems = items.flatMap((item) => {
    if (item.id === id) {
      removedItem = item

      return []
    }

    if (!Array.isArray(item.children)) return [item]

    const childResult = removeTreeItem(item.children, id)

    if (!childResult.removedItem) return [item]

    const { removedItem: childRemovedItem } = childResult

    removedItem = childRemovedItem

    return [
      {
        ...item,
        children: childResult.nextItems,
      },
    ]
  })

  return {
    nextItems,
    removedItem,
  }
}

const insertTreeItem = (
  items: TreeViewItem[],
  movedItem: TreeViewItem,
  overId: string,
  position: Exclude<TreeViewDropPosition, 'root'>,
  canDropInside: (item: TreeViewItem) => boolean,
): {
  nextItems: TreeViewItem[]
  inserted: boolean
  overItem: TreeViewItem | null
  parentItem: TreeViewItem | null
} => {
  let inserted = false
  let overItem: TreeViewItem | null = null
  let parentItem: TreeViewItem | null = null

  const visit = (
    siblings: TreeViewItem[],
    parent: TreeViewItem | null,
  ): TreeViewItem[] => {
    const nextSiblings: TreeViewItem[] = []

    for (const item of siblings) {
      if (!inserted && item.id === overId && position === 'before') {
        inserted = true
        overItem = item
        parentItem = parent
        nextSiblings.push(movedItem)
      }

      let nextItem = item

      if (
        !inserted &&
        item.id === overId &&
        position === 'inside' &&
        canDropInside(item)
      ) {
        inserted = true
        const nextChildren = [...(item.children ?? []), movedItem]

        nextItem = {
          ...item,
          children: nextChildren,
        }
        overItem = nextItem
        parentItem = nextItem
      } else if (Array.isArray(item.children)) {
        const nextChildren = visit(item.children, item)

        if (nextChildren !== item.children) {
          nextItem = {
            ...item,
            children: nextChildren,
          }
        }
      }

      nextSiblings.push(nextItem)

      if (!inserted && item.id === overId && position === 'after') {
        inserted = true
        overItem = item
        parentItem = parent
        nextSiblings.push(movedItem)
      }
    }

    return nextSiblings
  }

  return {
    nextItems: visit(items, null),
    inserted,
    overItem,
    parentItem,
  }
}

interface TreeMoveOptions {
  activeId: string
  overId: string | null
  position: TreeViewDropPosition
  canDropInside?: (item: TreeViewItem) => boolean
}

export const moveTreeViewItem = (
  items: TreeViewItem[],
  {
    activeId,
    overId,
    position,
    canDropInside = canTreeViewItemAcceptChildren,
  }: TreeMoveOptions,
): {
  nextData: TreeViewItem[]
  details: TreeViewMoveDetails
} | null => {
  const activeRecord = findItemRecord(items, activeId)

  if (!activeRecord) return null
  if (overId === activeId) return null
  if (overId && treeItemContainsId(activeRecord.item, overId)) return null

  const clonedItems = cloneTreeItems(items)
  const removal = removeTreeItem(clonedItems, activeId)

  if (!removal.removedItem) return null

  if (position === 'root') {
    const nextData = [...removal.nextItems, removal.removedItem]

    return {
      nextData,
      details: {
        activeItem: removal.removedItem,
        overItem: null,
        parentItem: null,
        position,
      },
    }
  }

  if (!overId) return null

  const insertion = insertTreeItem(
    removal.nextItems,
    removal.removedItem,
    overId,
    position,
    canDropInside,
  )

  if (!insertion.inserted) return null

  return {
    nextData: insertion.nextItems,
    details: {
      activeItem: removal.removedItem,
      overItem: insertion.overItem,
      parentItem: insertion.parentItem,
      position,
    },
  }
}

export const treeViewVariants = cva('rounded-lg border bg-card', {
  variants: {
    variant: {
      default: 'border-border',
      outline: 'border-2 border-border',
      ghost: 'border-transparent shadow-none',
    },
    size: {
      sm: 'text-xs',
      default: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export interface TreeViewProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof treeViewVariants> {
  ref?: Ref<HTMLDivElement>
  /** Tree data. */
  data: TreeViewItem[]
  /** Show expand / collapse all buttons. */
  showExpandAll?: boolean
  /** Show checkboxes next to items. */
  showCheckboxes?: boolean
  /** Position of checkboxes. */
  checkboxPosition?: TreeViewCheckboxPosition
  /** Search input placeholder text. */
  searchPlaceholder?: string
  /** Text appended after selection count, e.g. "3 selected". */
  selectionText?: string
  /** Labels for bulk check / uncheck buttons. */
  checkboxLabels?: { check: string; uncheck: string }
  /** Custom icon renderer. */
  getIcon?: (item: TreeViewItem, depth: number) => ReactNode
  /** Called when the set of selected items changes. */
  onSelectionChange?: (selectedItems: TreeViewItem[]) => void
  /** Called when a context-menu action fires. */
  onAction?: (action: string, items: TreeViewItem[]) => void
  /** Called when a checkbox state changes. */
  onCheckChange?: (item: TreeViewItem, checked: boolean) => void
  /** Called when tree data changes due to drag-and-drop. */
  onDataChange?: (
    nextData: TreeViewItem[],
    details: TreeViewMoveDetails,
  ) => void
  /** Enable drag-and-drop reorder and moving between parents. */
  draggable?: boolean
  /** Custom logic for whether an item can accept child items. */
  canDropInside?: (item: TreeViewItem) => boolean
  /** Map of item type → icon node. */
  iconMap?: TreeViewIconMap
  /** Context-menu items. */
  menuItems?: TreeViewMenuItem[]
  /** Show hover-card info tooltips on items. */
  showInfo?: boolean
  /** Maximum height before scrolling (e.g. "400px"). */
  maxHeight?: string
  /** Ids to expand on initial mount (uncontrolled). Subsequent changes do not re-seed expansion. */
  defaultExpandedIds?: ReadonlyArray<string>
  /**
   * When `true`, clicking a folder row toggles its expansion on the very first click —
   * not only when the folder is already selected. Useful for picker-style usages where
   * a parent click should drill into the folder instead of committing it as a value.
   */
  expandFolderOnRowClick?: boolean
  /**
   * Fired when a row is activated by click. Use for navigation/activation that
   * is independent of selection — always called regardless of `selectOnRowClick`.
   */
  onItemClick?: (item: TreeViewItem) => void
  /**
   * When `false`, clicking a row never mutates the selection (no highlight, no
   * "N selected" toolbar); it only expands folders and fires `onItemClick`.
   * Selection is then driven solely by checkboxes (shown when `showCheckboxes`).
   * Defaults to `true`, preserving the existing row-click selection behavior.
   */
  selectOnRowClick?: boolean
}

interface TreeDropTargetData {
  type: 'tree-drop-target'
  overId: string | null
  position: TreeViewDropPosition
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const buildItemMap = (items: TreeViewItem[]): Map<string, TreeViewItem> => {
  const map = new Map<string, TreeViewItem>()
  const walk = (item: TreeViewItem) => {
    map.set(item.id, item)
    item.children?.forEach(walk)
  }

  items.forEach(walk)

  return map
}

const getCheckState = (
  item: TreeViewItem,
  itemMap: Map<string, TreeViewItem>,
): 'checked' | 'unchecked' | 'indeterminate' => {
  const orig = itemMap.get(item.id)

  if (!orig) return 'unchecked'
  if (!orig.children || orig.children.length === 0) {
    return orig.checked ? 'checked' : 'unchecked'
  }

  let checkedCount = 0
  let indeterminateCount = 0

  orig.children.forEach((child) => {
    const state = getCheckState(child, itemMap)

    if (state === 'checked') checkedCount++
    if (state === 'indeterminate') indeterminateCount++
  })

  if (checkedCount === orig.children.length) return 'checked'
  if (checkedCount > 0 || indeterminateCount > 0) return 'indeterminate'

  return 'unchecked'
}

const getAllFolderIds = (items: TreeViewItem[]): string[] => {
  const ids: string[] = []
  const walk = (item: TreeViewItem) => {
    if (Array.isArray(item.children)) {
      ids.push(item.id)
      item.children.forEach(walk)
    }
  }

  items.forEach(walk)

  return ids
}

const getItemPath = (item: TreeViewItem, rootItems: TreeViewItem[]): string => {
  const path: string[] = [item.name]
  const findParent = (cur: TreeViewItem, list: TreeViewItem[]) => {
    for (const parent of list) {
      if (parent.children?.some((child) => child.id === cur.id)) {
        path.unshift(parent.name)
        findParent(parent, rootItems)

        return
      }
      if (parent.children) findParent(cur, parent.children)
    }
  }

  findParent(item, rootItems)

  return path.join(' \u2192 ')
}

const defaultCollisionDetection: CollisionDetection = (args) => {
  const pointerMatches = pointerWithin(args)

  return pointerMatches.length > 0 ? pointerMatches : closestCenter(args)
}

const defaultIconMap: TreeViewIconMap = {}

const getTreeDropTargetId = (
  overId: string | null,
  position: TreeViewDropPosition,
  depth: number,
) => `tree-drop:${overId ?? 'root'}:${position}:${depth}`

/* ------------------------------------------------------------------ */
/*  Drop spacer                                                        */
/* ------------------------------------------------------------------ */

interface TreeDropSpacerProps {
  depth: number
  overId: string | null
  position: TreeViewDropPosition
  activeDragItem: TreeViewItem | null
}

function TreeDropSpacer({
  depth,
  overId,
  position,
  activeDragItem,
}: TreeDropSpacerProps) {
  const disabled =
    !activeDragItem ||
    (overId !== null &&
      (overId === activeDragItem.id ||
        treeItemContainsId(activeDragItem, overId)))

  const { isOver, setNodeRef } = useDroppable({
    id: getTreeDropTargetId(overId, position, depth),
    disabled,
    data: {
      type: 'tree-drop-target',
      overId,
      position,
    } satisfies TreeDropTargetData,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative h-1.5 transition-[height,opacity]',
        activeDragItem ? 'opacity-100' : 'opacity-0 pointer-events-none',
        isOver && 'h-2.5',
      )}
    >
      <div
        className={cn(
          'absolute left-0 right-2 top-1/2 -translate-y-1/2 rounded-full transition-all',
          isOver
            ? 'h-0.5 bg-primary shadow-[0_0_0_2px_hsl(var(--background))]'
            : 'h-px bg-transparent',
        )}
        style={{ marginLeft: `${depth * 20 + 18}px` }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  TreeItem (internal)                                                */
/* ------------------------------------------------------------------ */

interface TreeItemInternalProps {
  item: TreeViewItem
  depth: number
  selectedIds: Set<string>
  lastSelectedIdRef: RefObject<string | null>
  onSelect: (ids: Set<string>) => void
  expandedIds: Set<string>
  onToggleExpand: (id: string, open: boolean) => void
  getIcon?: (item: TreeViewItem, depth: number) => ReactNode
  onAction?: (action: string, items: TreeViewItem[]) => void
  onCheckChange?: (item: TreeViewItem, checked: boolean) => void
  allItems: TreeViewItem[]
  showCheckboxes: boolean
  checkboxPosition: TreeViewCheckboxPosition
  itemMap: Map<string, TreeViewItem>
  iconMap: TreeViewIconMap
  menuItems?: TreeViewMenuItem[]
  getSelectedItems: () => TreeViewItem[]
  showInfo: boolean
  itemSize: 'sm' | 'default' | 'lg'
  draggable: boolean
  canDropInside: (item: TreeViewItem) => boolean
  activeDragItem: TreeViewItem | null
  expandFolderOnRowClick: boolean
  onItemClick?: (item: TreeViewItem) => void
  selectOnRowClick: boolean
}

function TreeItemInternal({
  item,
  depth,
  selectedIds,
  lastSelectedIdRef,
  onSelect,
  expandedIds,
  onToggleExpand,
  getIcon,
  onAction,
  onCheckChange,
  allItems,
  showCheckboxes,
  checkboxPosition,
  itemMap,
  iconMap,
  menuItems,
  getSelectedItems,
  showInfo,
  itemSize,
  draggable,
  canDropInside,
  activeDragItem,
  expandFolderOnRowClick,
  onItemClick,
  selectOnRowClick,
}: TreeItemInternalProps) {
  const isOpen = expandedIds.has(item.id)
  const isSelected = selectedIds.has(item.id)
  const isFolder = Array.isArray(item.children)
  const itemRef = useRef<HTMLDivElement>(null)

  const canDragItem = draggable && item.draggable !== false
  const canDropIntoItem =
    draggable &&
    !!activeDragItem &&
    activeDragItem.id !== item.id &&
    !treeItemContainsId(activeDragItem, item.id) &&
    canDropInside(item)

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: item.id,
    disabled: !canDragItem,
    data: {
      type: 'tree-item',
      itemId: item.id,
    },
  })

  const { isOver: isOverInside, setNodeRef: setDroppableNodeRef } =
    useDroppable({
      id: getTreeDropTargetId(item.id, 'inside', depth),
      disabled: !canDropIntoItem,
      data: {
        type: 'tree-drop-target',
        overId: item.id,
        position: 'inside',
      } satisfies TreeDropTargetData,
    })

  const setNodeRef = useCallback(
    (node: HTMLDivElement | null) => {
      setDraggableNodeRef(node)
      setDroppableNodeRef(node)
    },
    [setDraggableNodeRef, setDroppableNodeRef],
  )

  const getVisibleItems = useCallback(
    (items: TreeViewItem[]): TreeViewItem[] => {
      const visible: TreeViewItem[] = []

      for (const current of items) {
        visible.push(current)
        if (Array.isArray(current.children) && expandedIds.has(current.id)) {
          visible.push(...getVisibleItems(current.children))
        }
      }

      return visible
    },
    [expandedIds],
  )

  const selectionStyle = useMemo(() => {
    if (!isSelected) return ''

    const visibleItems = getVisibleItems(allItems)
    const currentIndex = visibleItems.findIndex(
      (visibleItem) => visibleItem.id === item.id,
    )
    const previousItem = visibleItems[currentIndex - 1]
    const nextItem = visibleItems[currentIndex + 1]
    const previousSelected = previousItem && selectedIds.has(previousItem.id)
    const nextSelected = nextItem && selectedIds.has(nextItem.id)

    return `${!previousSelected ? 'rounded-t-md' : ''} ${!nextSelected ? 'rounded-b-md' : ''}`
  }, [allItems, getVisibleItems, isSelected, item.id, selectedIds])

  const handleClick = (event: ReactMouseEvent) => {
    event.stopPropagation()
    event.preventDefault()

    if (!itemRef.current) return

    onItemClick?.(item)

    if (isFolder && (isSelected || expandFolderOnRowClick || !selectOnRowClick))
      onToggleExpand(item.id, !isOpen)

    if (!selectOnRowClick) return

    let nextSelected = new Set(selectedIds)

    if (event.shiftKey && lastSelectedIdRef.current !== null) {
      const items = Array.from(
        document.querySelectorAll('[data-tree-item]'),
      ) as HTMLElement[]
      const lastIndex = items.findIndex(
        (element) =>
          element.getAttribute('data-id') === lastSelectedIdRef.current,
      )
      const currentIndex = items.findIndex(
        (element) => element === itemRef.current,
      )
      const [start, end] = [
        Math.min(lastIndex, currentIndex),
        Math.max(lastIndex, currentIndex),
      ]

      items.slice(start, end + 1).forEach((element) => {
        const id = element.getAttribute('data-id')
        const parentClosed = element.closest('[data-folder-closed="true"]')
        const closedFolder =
          element.getAttribute('data-folder-closed') === 'true'

        if (id && (closedFolder || !parentClosed)) nextSelected.add(id)
      })
    } else if (event.ctrlKey || event.metaKey) {
      if (nextSelected.has(item.id)) nextSelected.delete(item.id)
      else nextSelected.add(item.id)
    } else {
      nextSelected = new Set([item.id])
    }

    lastSelectedIdRef.current = item.id
    onSelect(nextSelected)
  }

  const handleCheckClick = (event: ReactMouseEvent) => {
    event.stopPropagation()
    if (!onCheckChange) return

    const state = getCheckState(item, itemMap)
    const nextChecked = state !== 'checked'

    onCheckChange(item, nextChecked)
  }

  const renderIcon = () => {
    if (getIcon) return getIcon(item, depth)

    return iconMap[item.type] || null
  }

  const getSelectedChildrenCount = (current: TreeViewItem): number => {
    if (!current.children) return 0

    let count = 0

    current.children.forEach((child) => {
      if (selectedIds.has(child.id)) count++
      if (child.children) count += getSelectedChildrenCount(child)
    })

    return count
  }

  const selectedCount =
    isFolder && !isOpen ? getSelectedChildrenCount(item) : null

  const heightClass =
    itemSize === 'sm' ? 'h-7' : itemSize === 'lg' ? 'h-10' : 'h-8'
  const iconSize =
    itemSize === 'sm' ? 'size-3.5' : itemSize === 'lg' ? 'size-5' : 'size-4'
  const chevronButtonSize =
    itemSize === 'sm' ? 'h-5 w-5' : itemSize === 'lg' ? 'h-7 w-7' : 'h-6 w-6'

  const parentCheckState = isFolder ? getCheckState(item, itemMap) : null

  const checkboxElement = showCheckboxes ? (
    <div
      className="flex shrink-0 items-center justify-center"
      onClick={handleCheckClick}
      role="button"
      tabIndex={-1}
    >
      {isFolder ? (
        <Checkbox
          checked={
            parentCheckState === 'checked'
              ? true
              : parentCheckState === 'indeterminate'
                ? 'indeterminate'
                : false
          }
          className="pointer-events-none"
        />
      ) : (
        <Checkbox checked={!!item.checked} className="pointer-events-none" />
      )}
    </div>
  ) : null

  const dragHandle = canDragItem ? (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        chevronButtonSize,
        'shrink-0 opacity-0 transition-opacity group-hover/item:opacity-100',
        isDragging && 'opacity-100',
      )}
      aria-label={`Drag ${item.name}`}
      onClick={(event) => event.stopPropagation()}
      {...attributes}
      {...listeners}
    >
      <GripVertical className={cn(iconSize, 'text-muted-foreground')} />
    </Button>
  ) : null

  const infoElement = showInfo ? (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            chevronButtonSize,
            'p-0 opacity-0 group-hover/item:opacity-100',
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(iconSize, 'text-muted-foreground')}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-72" side="right">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{item.name}</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Type:</span>{' '}
              {item.type.charAt(0).toUpperCase() +
                item.type.slice(1).replace('_', ' ')}
            </div>
            <div>
              <span className="font-medium">ID:</span> {item.id}
            </div>
            <div>
              <span className="font-medium">Location:</span>{' '}
              {getItemPath(item, allItems)}
            </div>
            {isFolder ? (
              <div>
                <span className="font-medium">Items:</span>{' '}
                {item.children?.length ?? 0} direct items
              </div>
            ) : null}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ) : null

  const content = (
    <div
      ref={setNodeRef}
      style={
        transform ? { transform: CSS.Translate.toString(transform) } : undefined
      }
      className={cn('relative', isDragging && 'z-20 opacity-60')}
    >
      <div
        ref={itemRef}
        data-tree-item
        data-id={item.id}
        data-depth={depth}
        data-folder-closed={isFolder && !isOpen}
        className={cn(
          'group/item select-none cursor-pointer px-1 transition-colors',
          isSelected ? `bg-primary/10 ${selectionStyle}` : 'hover:bg-muted/50',
          isOverInside && 'bg-primary/5 ring-1 ring-inset ring-primary',
        )}
        style={{ paddingLeft: `${depth * 20}px` }}
        onClick={handleClick}
      >
        <div className={cn('flex items-center gap-1', heightClass)}>
          {isFolder ? (
            <>
              <Collapsible
                open={isOpen}
                onOpenChange={(open) => onToggleExpand(item.id, open)}
              >
                <CollapsibleTrigger
                  asChild
                  onClick={(event) => event.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(chevronButtonSize, 'shrink-0')}
                  >
                    <motion.div
                      initial={false}
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      <ChevronRight className={iconSize} />
                    </motion.div>
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
              {checkboxPosition === 'left' && checkboxElement}
              <span className="shrink-0">{renderIcon()}</span>
              <span className="flex-1 truncate">{item.name}</span>
              {selectedCount != null && selectedCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="mr-1 px-1.5 py-0 text-[10px]"
                >
                  {selectedCount}
                </Badge>
              ) : null}
              {checkboxPosition === 'right' && checkboxElement}
              {dragHandle}
              {infoElement}
            </>
          ) : (
            <>
              <span className={cn(chevronButtonSize, 'shrink-0')} />
              {checkboxPosition === 'left' && checkboxElement}
              <span className="shrink-0">{renderIcon()}</span>
              <span className="flex-1 truncate">{item.name}</span>
              {checkboxPosition === 'right' && checkboxElement}
              {dragHandle}
              {infoElement}
            </>
          )}
        </div>
      </div>
    </div>
  )

  if (menuItems && menuItems.length > 0) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{content}</ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          {menuItems.map((menuItem) => (
            <ContextMenuItem
              key={menuItem.id}
              onClick={() => {
                const items = selectedIds.has(item.id)
                  ? getSelectedItems()
                  : [item]

                menuItem.action(items)
                onAction?.(menuItem.id, items)
              }}
            >
              {menuItem.icon ? (
                <span className="mr-2 size-4">{menuItem.icon}</span>
              ) : null}
              {menuItem.label}
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>
    )
  }

  return content
}

/* ------------------------------------------------------------------ */
/*  TreeView (main exported component)                                 */
/* ------------------------------------------------------------------ */

function TreeView({
  className,
  variant,
  size,
  data,
  showExpandAll = true,
  showCheckboxes = false,
  checkboxPosition = 'left',
  searchPlaceholder,
  selectionText,
  checkboxLabels,
  getIcon,
  onSelectionChange,
  onAction,
  onCheckChange,
  onDataChange,
  draggable = false,
  canDropInside = canTreeViewItemAcceptChildren,
  iconMap = defaultIconMap,
  menuItems,
  showInfo = true,
  maxHeight,
  defaultExpandedIds,
  expandFolderOnRowClick = false,
  onItemClick,
  selectOnRowClick = true,
  ref,
  ...props
}: TreeViewProps) {
  const { t } = useUiTranslation()
  const [treeData, setTreeData] = useState(data)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(defaultExpandedIds ?? []),
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [isDraggingSelection, setIsDraggingSelection] = useState(false)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [dragStartPosition, setDragStartPosition] = useState<{
    x: number
    y: number
  } | null>(null)
  const [currentMousePos, setCurrentMousePos] = useState(0)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const lastSelectedIdRef = useRef<string | null>(null)
  const treeRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  )

  const dragEnabled = draggable && !searchQuery.trim()
  const DRAG_THRESHOLD = 10
  const itemSize = (size || 'default') as 'sm' | 'default' | 'lg'

  const resolvedSearchPlaceholder =
    searchPlaceholder ?? t('ui.treeView.searchPlaceholder', 'Search...')
  const resolvedSelectionText =
    selectionText ?? t('ui.treeView.selected', 'selected')
  const resolvedCheckboxLabels = checkboxLabels ?? {
    check: t('ui.treeView.check', 'Check'),
    uncheck: t('ui.treeView.uncheck', 'Uncheck'),
  }

  useEffect(() => {
    queueMicrotask(() => setTreeData(data))
  }, [data])

  const itemMap = useMemo(() => buildItemMap(treeData), [treeData])
  const activeDragItem = useMemo(
    () => (activeDragId ? (itemMap.get(activeDragId) ?? null) : null),
    [activeDragId, itemMap],
  )

  const { filteredData, searchExpandedIds } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { filteredData: treeData, searchExpandedIds: new Set<string>() }
    }

    const query = searchQuery.toLowerCase()
    const expanded = new Set<string>()

    const matches = (item: TreeViewItem): boolean => {
      if (item.name.toLowerCase().includes(query)) return true

      return !!item.children?.some((child) => matches(child))
    }

    const filter = (items: TreeViewItem[]): TreeViewItem[] =>
      items
        .map((item) => {
          if (!item.children) return matches(item) ? item : null

          const filteredChildren = filter(item.children)

          if (
            filteredChildren.length > 0 ||
            item.name.toLowerCase().includes(query)
          ) {
            expanded.add(item.id)

            return {
              ...item,
              children: filteredChildren,
            }
          }

          return null
        })
        .filter((item): item is TreeViewItem => item !== null)

    return {
      filteredData: filter(treeData),
      searchExpandedIds: expanded,
    }
  }, [searchQuery, treeData])

  useEffect(() => {
    if (searchQuery.trim()) {
      queueMicrotask(() =>
        setExpandedIds((prev) => new Set([...prev, ...searchExpandedIds])),
      )
    }
  }, [searchExpandedIds, searchQuery])

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Element
      const inside =
        treeRef.current?.contains(target) ||
        dragRef.current?.contains(target) ||
        target.closest('[role="menu"]') ||
        target.closest('[data-radix-popper-content-wrapper]')

      if (!inside) {
        setSelectedIds(new Set())
        lastSelectedIdRef.current = null
      }
    }

    document.addEventListener('mousedown', handler)

    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleExpandAll = () =>
    setExpandedIds(new Set(getAllFolderIds(treeData)))
  const handleCollapseAll = () => setExpandedIds(new Set())
  const handleToggleExpand = (id: string, open: boolean) => {
    setExpandedIds((previous) => {
      const next = new Set(previous)

      if (open) next.add(id)
      else next.delete(id)

      return next
    })
  }

  const getSelectedItems = useCallback((): TreeViewItem[] => {
    const items: TreeViewItem[] = []
    const walk = (item: TreeViewItem) => {
      if (selectedIds.has(item.id)) items.push(item)
      item.children?.forEach(walk)
    }

    treeData.forEach(walk)

    return items
  }, [selectedIds, treeData])

  const getEffectiveSelectedItems = useCallback((): TreeViewItem[] => {
    const selectedItems = getSelectedItems()
    const idSet = new Set(selectedItems.map((item) => item.id))

    return selectedItems.filter((item) => {
      if (!item.children) return true

      return !item.children.some((child) => idSet.has(child.id))
    })
  }, [getSelectedItems])

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent) => {
      /*
       * Marquee drag-selection is part of row selection; skip it entirely when
       * row selection is disabled.
       */
      if (!selectOnRowClick) return
      if (event.button !== 0 || (event.target as HTMLElement).closest('button'))
        return
      setDragStartPosition({ x: event.clientX, y: event.clientY })
    },
    [selectOnRowClick],
  )

  const handleMouseMove = useCallback(
    (event: ReactMouseEvent) => {
      if (!(event.buttons & 1)) {
        setIsDraggingSelection(false)
        setDragStart(null)
        setDragStartPosition(null)

        return
      }

      if (!dragStartPosition) return

      const deltaX = event.clientX - dragStartPosition.x
      const deltaY = event.clientY - dragStartPosition.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      if (!isDraggingSelection) {
        if (distance > DRAG_THRESHOLD) {
          setIsDraggingSelection(true)
          setDragStart(dragStartPosition.y)
          if (!event.shiftKey && !event.ctrlKey) {
            setSelectedIds(new Set())
            lastSelectedIdRef.current = null
          }
        }

        return
      }

      if (!dragRef.current) return

      const items = Array.from(
        dragRef.current.querySelectorAll('[data-tree-item]'),
      ) as HTMLElement[]
      const startY = dragStart
      const currentY = event.clientY
      const [selectionStart, selectionEnd] = [
        Math.min(startY || 0, currentY),
        Math.max(startY || 0, currentY),
      ]

      const nextSelected = new Set(
        event.shiftKey || event.ctrlKey
          ? Array.from(selectedIds)
          : ([] as string[]),
      )

      items.forEach((element) => {
        const rect = element.getBoundingClientRect()

        if (rect.bottom >= selectionStart && rect.top <= selectionEnd) {
          const id = element.getAttribute('data-id')
          const isClosed = element.getAttribute('data-folder-closed') === 'true'
          const parentClosed = element.closest('[data-folder-closed="true"]')

          if (id && (isClosed || !parentClosed)) nextSelected.add(id)
        }
      })

      setSelectedIds(nextSelected)
      setCurrentMousePos(event.clientY)
    },
    [dragStart, dragStartPosition, isDraggingSelection, selectedIds],
  )

  const handleMouseUp = useCallback(() => {
    setIsDraggingSelection(false)
    setDragStart(null)
    setDragStartPosition(null)
  }, [])

  useEffect(() => {
    if (isDraggingSelection) {
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('mouseleave', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseUp)
    }
  }, [handleMouseUp, isDraggingSelection])

  useEffect(() => {
    onSelectionChange?.(getSelectedItems())
  }, [getSelectedItems, onSelectionChange, selectedIds])

  const handleDragStartEvent = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }, [])

  const handleDragEndEvent = useCallback(
    (event: DragEndEvent) => {
      const target = event.over?.data.current as TreeDropTargetData | undefined
      const activeId = String(event.active.id)

      setActiveDragId(null)

      if (!target || target.type !== 'tree-drop-target') return

      const moveResult = moveTreeViewItem(treeData, {
        activeId,
        overId: target.overId,
        position: target.position,
        canDropInside,
      })

      if (!moveResult) return

      setTreeData(moveResult.nextData)
      onDataChange?.(moveResult.nextData, moveResult.details)
    },
    [canDropInside, onDataChange, treeData],
  )

  const renderTreeItems = useCallback(
    (items: TreeViewItem[], depth = 0): ReactNode =>
      items.map((item, index) => (
        <div key={item.id}>
          {dragEnabled ? (
            <TreeDropSpacer
              depth={depth}
              overId={item.id}
              position="before"
              activeDragItem={activeDragItem}
            />
          ) : null}
          <TreeItemInternal
            item={item}
            depth={depth}
            selectedIds={selectedIds}
            lastSelectedIdRef={lastSelectedIdRef}
            onSelect={setSelectedIds}
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
            getIcon={getIcon}
            onAction={onAction}
            onCheckChange={onCheckChange}
            allItems={treeData}
            showCheckboxes={showCheckboxes}
            checkboxPosition={checkboxPosition}
            itemMap={itemMap}
            iconMap={iconMap}
            menuItems={menuItems}
            getSelectedItems={getSelectedItems}
            showInfo={showInfo}
            itemSize={itemSize}
            draggable={dragEnabled}
            canDropInside={canDropInside}
            activeDragItem={activeDragItem}
            expandFolderOnRowClick={expandFolderOnRowClick}
            onItemClick={onItemClick}
            selectOnRowClick={selectOnRowClick}
          />
          {Array.isArray(item.children) && expandedIds.has(item.id)
            ? renderTreeItems(item.children, depth + 1)
            : null}
          {dragEnabled && index === items.length - 1 ? (
            <TreeDropSpacer
              depth={depth}
              overId={item.id}
              position="after"
              activeDragItem={activeDragItem}
            />
          ) : null}
        </div>
      )),
    [
      activeDragItem,
      canDropInside,
      checkboxPosition,
      dragEnabled,
      expandFolderOnRowClick,
      expandedIds,
      getIcon,
      getSelectedItems,
      iconMap,
      itemMap,
      itemSize,
      menuItems,
      onAction,
      onCheckChange,
      selectedIds,
      showCheckboxes,
      showInfo,
      treeData,
      onItemClick,
      selectOnRowClick,
    ],
  )

  const toolbarHeight =
    itemSize === 'sm' ? 'h-8' : itemSize === 'lg' ? 'h-12' : 'h-10'
  const inputHeight =
    itemSize === 'sm' ? 'h-7' : itemSize === 'lg' ? 'h-10' : 'h-8'

  const renderedTreeItems =
    filteredData.length > 0 ? renderTreeItems(filteredData) : null

  const treeBody = (
    <div
      ref={dragRef}
      className="relative select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      {isDraggingSelection ? (
        <div
          className="pointer-events-none absolute inset-x-0 bg-primary/5"
          style={{
            top: Math.min(dragStart || 0, currentMousePos),
            height: Math.abs((dragStart || 0) - currentMousePos),
          }}
        />
      ) : null}
      {renderedTreeItems}
      {filteredData.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          {t('ui.treeView.noItemsFound', 'No items found')}
        </div>
      ) : null}
    </div>
  )

  const treeContent = dragEnabled ? (
    <DndContext
      sensors={sensors}
      collisionDetection={defaultCollisionDetection}
      onDragStart={handleDragStartEvent}
      onDragEnd={handleDragEndEvent}
      onDragCancel={() => setActiveDragId(null)}
    >
      {treeBody}
      <DragOverlay dropAnimation={null}>
        {activeDragItem ? (
          <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-lg">
            <GripVertical className="size-4 text-muted-foreground" />
            <span className="font-medium">{activeDragItem.name}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  ) : (
    treeBody
  )

  const toolbar = (
    <AnimatePresence mode="wait">
      {selectedIds.size > 0 ? (
        <motion.div
          key="selection"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            toolbarHeight,
            'flex items-center justify-between rounded-md border bg-background px-3',
          )}
        >
          <div
            className="flex cursor-pointer items-center gap-1.5 font-medium"
            title={t('ui.treeView.clearSelection', 'Clear selection')}
            onClick={() => {
              setSelectedIds(new Set())
              lastSelectedIdRef.current = null
            }}
            role="button"
            tabIndex={0}
          >
            <X className="size-4" />
            <span>
              {selectedIds.size} {resolvedSelectionText}
            </span>
          </div>
          {showCheckboxes ? (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const items = getEffectiveSelectedItems()
                  const walk = (item: TreeViewItem) => {
                    onCheckChange?.(item, true)
                    item.children?.forEach(walk)
                  }

                  items.forEach(walk)
                }}
                className="text-green-600 hover:bg-green-50 hover:text-green-700"
              >
                {resolvedCheckboxLabels.check}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const items = getEffectiveSelectedItems()
                  const walk = (item: TreeViewItem) => {
                    onCheckChange?.(item, false)
                    item.children?.forEach(walk)
                  }

                  items.forEach(walk)
                }}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                {resolvedCheckboxLabels.uncheck}
              </Button>
            </div>
          ) : null}
        </motion.div>
      ) : (
        <motion.div
          key="search"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={cn(toolbarHeight, 'flex items-center gap-2')}
        >
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={resolvedSearchPlaceholder}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={cn(inputHeight, 'pl-8 text-xs')}
            />
          </div>
          {showExpandAll ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(inputHeight, 'shrink-0')}
                >
                  <EllipsisVertical className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExpandAll}>
                  <ChevronDown className="mr-2 size-4" />
                  Expand All
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCollapseAll}>
                  <ChevronRight className="mr-2 size-4" />
                  Collapse All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div
      ref={(node) => {
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
        ;(treeRef as RefObject<HTMLDivElement | null>).current = node
      }}
      className={cn(
        treeViewVariants({ variant, size }),
        'flex flex-col p-3',
        className,
      )}
      style={maxHeight ? { maxHeight } : undefined}
      {...props}
    >
      <div className="shrink-0 pb-2">{toolbar}</div>
      {maxHeight ? (
        <div className="min-h-0 flex-1 overflow-y-auto rounded-md">
          {treeContent}
        </div>
      ) : (
        treeContent
      )}
    </div>
  )
}

export { TreeView }
