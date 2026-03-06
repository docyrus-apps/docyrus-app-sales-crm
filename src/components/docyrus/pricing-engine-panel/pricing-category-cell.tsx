'use client'

import { useCallback, useId, useMemo, useState } from 'react'

import { Check, ChevronRight, ChevronsUpDown, FolderTree } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import { tUi } from '@/lib/ui-i18n'

import { usePricingEngine } from './contexts/pricing-context'
import { type ICategoryCatalogItem } from './interfaces'

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Build nested tree from a flat list with parentId references. */
function buildCategoryTree(
  items: ICategoryCatalogItem[],
): ICategoryCatalogItem[] {
  if (items.some((item) => item.children && item.children.length > 0)) {
    return items.filter(
      (item) => item.parentId === null || item.parentId === undefined,
    )
  }

  const map = new Map<string, ICategoryCatalogItem>()
  const roots: ICategoryCatalogItem[] = []

  for (const item of items) {
    map.set(item.id, { ...item, children: [] })
  }

  for (const item of items) {
    const node = map.get(item.id)!

    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

/** Recursively check if a node or any descendant matches the search. */
function matchesSearch(node: ICategoryCatalogItem, query: string): boolean {
  if (node.name.toLowerCase().includes(query)) return true

  return node.children?.some((child) => matchesSearch(child, query)) ?? false
}

/** Collect all ancestor IDs of nodes matching the search query. */
function getExpandedIdsForSearch(
  nodes: ICategoryCatalogItem[],
  query: string,
): Set<string> {
  const result = new Set<string>()

  const walk = (node: ICategoryCatalogItem): boolean => {
    const nameMatch = node.name.toLowerCase().includes(query)
    let childMatch = false

    for (const child of node.children ?? []) {
      if (walk(child)) childMatch = true
    }

    if (childMatch) {
      result.add(node.id)
    }

    return nameMatch || childMatch
  }

  nodes.forEach(walk)

  return result
}

/* ------------------------------------------------------------------ */
/*  Tree Node                                                          */
/* ------------------------------------------------------------------ */

interface CategoryTreeNodeProps {
  node: ICategoryCatalogItem
  depth: number
  selectedId: string | null
  expandedIds: Set<string>
  searchQuery: string
  onSelect: (category: ICategoryCatalogItem) => void
  onToggle: (id: string) => void
}

function CategoryTreeNode({
  node,
  depth,
  selectedId,
  expandedIds,
  searchQuery,
  onSelect,
  onToggle,
}: CategoryTreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id

  if (searchQuery && !matchesSearch(node, searchQuery)) {
    return null
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-1 rounded-sm px-2 py-1.5 text-left text-sm',
          'hover:bg-accent hover:text-accent-foreground',
          'outline-none focus-visible:bg-accent focus-visible:text-accent-foreground',
          isSelected && 'bg-accent',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => {
          if (hasChildren) onToggle(node.id)
          onSelect(node)
        }}
      >
        {hasChildren ? (
          <ChevronRight
            className={cn(
              'h-3.5 w-3.5 shrink-0 transition-transform duration-150',
              isExpanded && 'rotate-90',
            )}
            onClick={(e) => {
              e.stopPropagation()
              onToggle(node.id)
            }}
          />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className="flex-1 truncate">{node.name}</span>
        {isSelected && <Check className="h-3.5 w-3.5 shrink-0 opacity-70" />}
      </button>
      {hasChildren &&
        isExpanded &&
        node.children!.map((child) => (
          <CategoryTreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            expandedIds={expandedIds}
            searchQuery={searchQuery}
            onSelect={onSelect}
            onToggle={onToggle}
          />
        ))}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  PricingCategoryCell                                                */
/* ------------------------------------------------------------------ */

interface PricingCategoryCellProps {
  lineId: string
  category: string
  categoryId: string | null
}

export function PricingCategoryCell({
  lineId,
  category,
  categoryId,
}: PricingCategoryCellProps) {
  const {
    updateLineItem,
    setLineItemCategory,
    onCategorySelect,
    categoryCatalog,
    readOnly,
    locale,
  } = usePricingEngine()

  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const treeId = useId()

  const tree = useMemo(
    () => (categoryCatalog ? buildCategoryTree(categoryCatalog) : []),
    [categoryCatalog],
  )

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)

      if (next.has(id)) next.delete(id)
      else next.add(id)

      return next
    })
  }, [])

  const handleSelect = useCallback(
    (cat: ICategoryCatalogItem) => {
      setLineItemCategory(lineId, cat)
      setOpen(false)
      setSearchQuery('')
    },
    [lineId, setLineItemCategory],
  )

  const handleRemoteCategorySelect = useCallback(() => {
    if (!onCategorySelect) return
    onCategorySelect(lineId, (cat) => {
      setLineItemCategory(lineId, cat)
    })
  }, [lineId, onCategorySelect, setLineItemCategory])

  const lowerQuery = searchQuery.toLowerCase()

  const effectiveExpandedIds = useMemo(() => {
    if (!lowerQuery) return expandedIds

    return new Set([
      ...expandedIds,
      ...getExpandedIdsForSearch(tree, lowerQuery),
    ])
  }, [expandedIds, lowerQuery, tree])

  if (categoryCatalog && categoryCatalog.length > 0) {
    const selectedName = categoryId
      ? categoryCatalog.find((c) => c.id === categoryId)?.name
      : undefined

    return (
      <Popover
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) setSearchQuery('')
        }}
      >
        <PopoverTrigger asChild disabled={readOnly}>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            aria-controls={treeId}
            aria-haspopup="tree"
            className="h-8 w-[120px] justify-between px-2 font-normal shadow-none"
          >
            <span
              className={cn(
                'truncate',
                !selectedName && 'text-muted-foreground',
              )}
            >
              {selectedName ?? (category || tUi(locale, 'pepSelectCategory'))}
            </span>
            <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent id={treeId} className="w-[240px] p-0" align="start">
          <div className="border-b p-2">
            <Input
              placeholder={tUi(locale, 'pepSearchCategories')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
          </div>
          <ScrollArea className="max-h-[260px]">
            <div className="py-1">
              {tree.length > 0 ? (
                tree.map((node) => (
                  <CategoryTreeNode
                    key={node.id}
                    node={node}
                    depth={0}
                    selectedId={categoryId}
                    expandedIds={effectiveExpandedIds}
                    searchQuery={lowerQuery}
                    onSelect={handleSelect}
                    onToggle={handleToggle}
                  />
                ))
              ) : (
                <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {tUi(locale, 'pepNoResults')}
                </p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        value={category}
        onChange={(e) => updateLineItem(lineId, { category: e.target.value })}
        className="h-8 w-[100px] border-0 bg-transparent px-1 shadow-none focus-visible:ring-1"
        disabled={readOnly}
      />
      {onCategorySelect && !readOnly && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={handleRemoteCategorySelect}
          title={tUi(locale, 'pepSelectCategory')}
        >
          <FolderTree className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
