'use client'

// @ts-nocheck
/* eslint-disable */
import { useCallback, useMemo, useState, type ReactNode, type Ref } from 'react'

import { ChevronRight, ChevronsUpDown, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation'

import {
  TreeView,
  type TreeViewIconMap,
  type TreeViewItem,
} from '@/components/docyrus/tree-view'

/** DFS lookup for a single tree item by id. */
function findTreeItem(items: TreeViewItem[], id: string): TreeViewItem | null {
  for (const item of items) {
    if (item.id === id) return item
    if (Array.isArray(item.children)) {
      const match = findTreeItem(item.children, id)

      if (match) return match
    }
  }

  return null
}

/** Return ids for this item and all descendants. */
function collectAllIds(item: TreeViewItem): string[] {
  const ids = [item.id]

  if (Array.isArray(item.children)) {
    item.children.forEach((child) => {
      ids.push(...collectAllIds(child))
    })
  }

  return ids
}

/** Return ids for descendant leaves only (excluding folders). */
function collectLeafIds(item: TreeViewItem): string[] {
  if (!Array.isArray(item.children) || item.children.length === 0) {
    return [item.id]
  }

  const ids: string[] = []

  item.children.forEach((child) => {
    ids.push(...collectLeafIds(child))
  })

  return ids
}

/** Whether `item` itself is a folder (has at least one child). */
function isFolderItem(item: TreeViewItem): boolean {
  return Array.isArray(item.children) && item.children.length > 0
}

/** Clone the tree, setting `checked: true` on items whose id is in `selectedIds`. */
function decorateChecked(
  items: TreeViewItem[],
  selectedIds: Set<string>,
): TreeViewItem[] {
  return items.map((item) => ({
    ...item,
    checked: selectedIds.has(item.id),
    ...(Array.isArray(item.children)
      ? { children: decorateChecked(item.children, selectedIds) }
      : {}),
  }))
}

/** All folder ids in the tree (depth-first, parent-before-children). */
function collectAllFolderIds(items: TreeViewItem[]): string[] {
  const ids: string[] = []
  const walk = (item: TreeViewItem) => {
    if (Array.isArray(item.children) && item.children.length > 0) {
      ids.push(item.id)
      item.children.forEach(walk)
    }
  }

  items.forEach(walk)

  return ids
}

/** Path of items from root → target (inclusive). Returns null when not found. */
function getItemChain(
  items: TreeViewItem[],
  targetId: string,
  parents: TreeViewItem[] = [],
): TreeViewItem[] | null {
  for (const item of items) {
    if (item.id === targetId) return [...parents, item]
    if (Array.isArray(item.children)) {
      const childChain = getItemChain(item.children, targetId, [
        ...parents,
        item,
      ])

      if (childChain) return childChain
    }
  }

  return null
}

/** Union of ancestor ids for every id in `selectedIds` (excludes the ids themselves). */
function collectAncestorIds(
  items: TreeViewItem[],
  selectedIds: Set<string>,
): string[] {
  if (selectedIds.size === 0) return []
  const result = new Set<string>()

  for (const id of selectedIds) {
    const chain = getItemChain(items, id)

    if (!chain) continue
    for (let i = 0; i < chain.length - 1; i++) {
      const ancestor = chain[i]

      if (ancestor) result.add(ancestor.id)
    }
  }

  return [...result]
}

export type TreeSelectValue = string | Array<string> | null | undefined

/** Initial expansion strategy for the tree inside the dropdown. */
export type TreeSelectDefaultExpanded =
  | 'none'
  | 'all'
  | 'selected'
  | ReadonlyArray<string>

export interface TreeSelectProps {
  ref?: Ref<HTMLButtonElement>
  /** Tree data displayed inside the dropdown. */
  data: TreeViewItem[]
  /** Currently selected value(s). String for single mode, array of strings for multi mode. */
  value?: TreeSelectValue
  /** Called when the selection changes. Returns string in single mode, array in multi mode. */
  onValueChange?: (value: TreeSelectValue) => void
  /** Enable multi-select mode. Defaults to false (single-select). */
  multiple?: boolean
  /** Placeholder text when nothing is selected. */
  placeholder?: string
  /** Disable the control. */
  disabled?: boolean
  /** Additional class for the trigger button. */
  className?: string
  /** Trigger id (for label htmlFor). */
  id?: string
  /** Name attribute (for form association). */
  name?: string
  /** Blur handler — forwarded to the trigger button. */
  onBlur?: () => void
  /** Show invalid styling on the trigger. */
  'aria-invalid'?: boolean
  /** Maximum height of the tree view inside the dropdown (default '320px'). */
  maxHeight?: string
  /** Custom icon renderer for tree items (forwarded to TreeView.getIcon). */
  getIcon?: (item: TreeViewItem, depth: number) => ReactNode
  /** Map of item.type → icon node (forwarded to TreeView.iconMap). */
  iconMap?: TreeViewIconMap
  /** Hide the tree view's hover-card info button (default true to keep the dropdown clean). */
  hideInfo?: boolean
  /** Search input placeholder text inside the dropdown. */
  searchPlaceholder?: string
  /**
   * Restrict selection to leaf nodes (folders are not selectable values).
   * - **Single mode** — clicking a folder row expands / collapses it instead of committing; the value never becomes a folder id.
   * - **Multi mode** — checking a folder cascades to its **leaf** descendants only; the folder id itself never enters `value`. Clicking a folder row (outside the checkbox) also expands / collapses it.
   *
   * Default `false` — folders are selectable and a checked folder cascades to the parent id **and** every descendant.
   */
  leafOnly?: boolean
  /**
   * Which ids should be expanded each time the dropdown opens.
   * - `'none'` — start fully collapsed.
   * - `'all'` — expand every folder.
   * - `'selected'` (default) — expand ancestors of currently-selected items so the value is always visible.
   * - `string[]` — expand exactly these ids.
   */
  defaultExpanded?: TreeSelectDefaultExpanded
  /**
   * When `true`, render a breadcrumb (`Group › Subgroup › Item`) inside the trigger for each selected item.
   * Ancestor names are muted; the leaf name keeps the foreground color.
   * `renderSelected` takes precedence when both are supplied.
   */
  showBreadcrumb?: boolean
  /** Render override for a selected item inside the trigger. Overrides `showBreadcrumb` when supplied. */
  renderSelected?: (item: TreeViewItem) => ReactNode
  /** Open state — controlled mode. */
  open?: boolean
  /** Called when the open state changes. */
  onOpenChange?: (open: boolean) => void
}

export function TreeSelect({
  ref,
  data,
  value,
  onValueChange,
  multiple = false,
  placeholder,
  disabled,
  className,
  id,
  name,
  onBlur,
  'aria-invalid': ariaInvalid,
  maxHeight = '320px',
  getIcon,
  iconMap,
  hideInfo = true,
  searchPlaceholder,
  leafOnly = false,
  defaultExpanded = 'selected',
  showBreadcrumb = false,
  renderSelected,
  open: openProp,
  onOpenChange,
}: TreeSelectProps) {
  const { t } = useUiTranslation()

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const open = openProp ?? uncontrolledOpen
  const setOpen = useCallback(
    (next: boolean) => {
      if (openProp === undefined) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange, openProp],
  )

  const selectedIdSet = useMemo<Set<string>>(() => {
    if (multiple) {
      return new Set(Array.isArray(value) ? value : [])
    }
    if (typeof value === 'string' && value.length > 0) {
      return new Set([value])
    }

    return new Set()
  }, [multiple, value])

  const selectedItems = useMemo<TreeViewItem[]>(
    () =>
      [...selectedIdSet]
        .map((idValue) => findTreeItem(data, idValue))
        .filter((item): item is TreeViewItem => item !== null),
    [data, selectedIdSet],
  )

  const singleSelectedItem =
    !multiple && selectedItems.length > 0 ? (selectedItems[0] ?? null) : null

  const treeData = useMemo<TreeViewItem[]>(
    () => (multiple ? decorateChecked(data, selectedIdSet) : data),
    [data, multiple, selectedIdSet],
  )

  /*
   * Resolve `defaultExpanded` into a concrete id list. Recomputed at every popover
   * mount because the tree-view remounts on each open.
   */
  const expandedIdsSeed = useMemo<string[]>(() => {
    if (defaultExpanded === 'none') return []
    if (defaultExpanded === 'all') return collectAllFolderIds(data)
    if (defaultExpanded === 'selected')
      return collectAncestorIds(data, selectedIdSet)
    if (Array.isArray(defaultExpanded)) return [...defaultExpanded]

    return []
  }, [data, defaultExpanded, selectedIdSet])

  const commitMulti = useCallback(
    (nextSet: Set<string>) => {
      onValueChange?.([...nextSet])
    },
    [onValueChange],
  )

  const handleSelectionChange = useCallback(
    (items: TreeViewItem[]) => {
      if (multiple || items.length === 0) return
      const picked = items[items.length - 1]

      if (!picked) return
      /*
       * In leaf-only mode, folder clicks are non-committing — TreeView still
       * handles expand/collapse, we just refuse to commit the value.
       */
      if (leafOnly && isFolderItem(picked)) return
      onValueChange?.(picked.id)
      setOpen(false)
    },
    [leafOnly, multiple, onValueChange, setOpen],
  )

  const handleCheckChange = useCallback(
    (item: TreeViewItem, checked: boolean) => {
      if (!multiple) return
      const ids = isFolderItem(item)
        ? leafOnly
          ? collectLeafIds(item)
          : collectAllIds(item)
        : [item.id]
      const next = new Set(selectedIdSet)

      if (checked) ids.forEach((idValue) => next.add(idValue))
      else ids.forEach((idValue) => next.delete(idValue))

      commitMulti(next)
    },
    [commitMulti, leafOnly, multiple, selectedIdSet],
  )

  const removeSelected = useCallback(
    (idToRemove: string) => {
      if (!multiple) {
        onValueChange?.(null)

        return
      }
      const item = findTreeItem(data, idToRemove)
      const ids =
        item && isFolderItem(item)
          ? leafOnly
            ? collectLeafIds(item)
            : collectAllIds(item)
          : [idToRemove]
      const next = new Set(selectedIdSet)

      ids.forEach((idValue) => next.delete(idValue))
      commitMulti(next)
    },
    [commitMulti, data, leafOnly, multiple, onValueChange, selectedIdSet],
  )

  const resolvedPlaceholder =
    placeholder ??
    t(
      multiple ? 'ui.treeSelect.multiPlaceholder' : 'ui.treeSelect.placeholder',
      multiple ? 'Select items...' : 'Select...',
    )

  /** Renders a selected item — applies `renderSelected` → `showBreadcrumb` → default name fallback. */
  const renderItemForTrigger = (item: TreeViewItem): ReactNode => {
    if (renderSelected) return renderSelected(item)
    if (!showBreadcrumb) return <span className="truncate">{item.name}</span>

    const chain = getItemChain(data, item.id) ?? [item]

    if (chain.length === 1) {
      return <span className="truncate">{item.name}</span>
    }

    return (
      <span className="flex min-w-0 items-center gap-1">
        {chain.map((node, index) => {
          const isLast = index === chain.length - 1

          return (
            <span key={node.id} className="flex min-w-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="size-3 shrink-0 text-muted-foreground/60" />
              ) : null}
              <span
                className={cn('truncate', !isLast && 'text-muted-foreground')}
              >
                {node.name}
              </span>
            </span>
          )
        })}
      </span>
    )
  }

  const triggerContent = multiple ? (
    <span className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden">
      {selectedItems.length === 0 && (
        <span className="text-muted-foreground">{resolvedPlaceholder}</span>
      )}
      {selectedItems.map((item) => (
        <Badge key={item.id} variant="outline" className="gap-1">
          {renderItemForTrigger(item)}
          <span
            role="button"
            tabIndex={-1}
            aria-label={t('ui.treeSelect.removeItem', 'Remove item')}
            className="ml-0.5 cursor-pointer rounded-full outline-none hover:opacity-70"
            onPointerDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
              removeSelected(item.id)
            }}
          >
            <X className="size-3" />
          </span>
        </Badge>
      ))}
    </span>
  ) : (
    <span className="flex flex-1 items-center gap-2 overflow-hidden">
      {singleSelectedItem ? (
        renderItemForTrigger(singleSelectedItem)
      ) : (
        <span className="text-muted-foreground">{resolvedPlaceholder}</span>
      )}
    </span>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          id={id}
          name={name}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          onBlur={onBlur}
          disabled={!!disabled}
          className={cn(
            'h-auto min-h-9 w-full justify-between gap-2 px-3 py-1.5 font-normal',
            className,
          )}
        >
          {triggerContent}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <TreeView
          data={treeData}
          variant="ghost"
          showCheckboxes={multiple}
          checkboxPosition="left"
          showInfo={!hideInfo}
          showExpandAll
          maxHeight={maxHeight}
          searchPlaceholder={searchPlaceholder}
          getIcon={getIcon}
          iconMap={iconMap}
          defaultExpandedIds={expandedIdsSeed}
          expandFolderOnRowClick={leafOnly}
          onSelectionChange={handleSelectionChange}
          onCheckChange={handleCheckChange}
          className="rounded-md border-0 shadow-none"
        />
      </PopoverContent>
    </Popover>
  )
}
