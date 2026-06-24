'use client'

// @ts-nocheck
/* eslint-disable */
import { useMemo, useState } from 'react'

import { useDraggable } from '@dnd-kit/core'
import { GripVertical, Search } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

import { useDesignerContext } from '../adaptive-card-designer-context'
import { type ToolboxItem } from '../adaptive-card-designer-types'
import { TOOLBOX_DRAG_PREFIX } from '../dnd/designer-dnd'
import { TOOLBOX_GROUP_ORDER, buildToolbox } from '../lib/element-catalog'
import { PanelShell } from '../layout/panel-shell'

interface ToolboxPanelProps {
  extraItems?: ToolboxItem[]
}

export function ToolboxPanel({ extraItems }: ToolboxPanelProps) {
  const { state, dispatch } = useDesignerContext()
  const { readOnly } = state
  const [query, setQuery] = useState('')

  const items = useMemo(() => buildToolbox(extraItems), [extraItems])

  const groups = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered =
      term === ''
        ? items
        : items.filter(
            (item) =>
              item.keywords.some((k) => k.includes(term)) ||
              item.label.toLowerCase().includes(term),
          )

    const byGroup = new Map<string, ToolboxItem[]>()

    for (const item of filtered) {
      const key = String(item.group)
      const existing = byGroup.get(key) ?? []

      existing.push(item)
      byGroup.set(key, existing)
    }

    const ordered: Array<{ id: string; label: string; items: ToolboxItem[] }> =
      []

    for (const { id, label } of TOOLBOX_GROUP_ORDER) {
      const groupItems = byGroup.get(id)

      if (groupItems && groupItems.length > 0) {
        ordered.push({ id, label, items: groupItems })
        byGroup.delete(id)
      }
    }

    for (const [id, groupItems] of byGroup) {
      if (groupItems.length > 0) {
        ordered.push({ id, label: id, items: groupItems })
      }
    }

    return ordered
  }, [items, query])

  function handleInsert(item: ToolboxItem) {
    if (readOnly) return

    const node = item.factory()
    const slot = item.group === 'actions' ? 'actions' : 'body'
    const targetSlot = state.root.slots[slot] ? slot : 'body'
    const index = state.root.slots[targetSlot]?.length ?? 0

    dispatch({
      type: 'INSERT_NODE',
      parentId: state.root.__designerId,
      slot: targetSlot,
      index,
      node,
    })
  }

  return (
    <PanelShell title="Card Elements">
      <div className="sticky top-0 z-10 border-b border-border bg-card px-2 py-1.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search elements"
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      <div className="space-y-3 px-2 py-2">
        {groups.length === 0 ? (
          <p className="px-1 py-2 text-xs text-muted-foreground">
            No elements match &quot;{query}&quot;.
          </p>
        ) : null}

        {groups.map((group) => (
          <div key={group.id} className="space-y-1">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <ToolboxItemRow
                  key={item.id}
                  item={item}
                  onInsert={handleInsert}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  )
}

interface ToolboxItemRowProps {
  item: ToolboxItem
  onInsert: (item: ToolboxItem) => void
  readOnly: boolean
}

function ToolboxItemRow({ item, onInsert, readOnly }: ToolboxItemRowProps) {
  const Icon = item.icon
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${TOOLBOX_DRAG_PREFIX}${item.id}`,
    data: { source: 'toolbox', toolboxId: item.id },
    disabled: readOnly,
  })

  return (
    <button
      ref={setNodeRef}
      type="button"
      disabled={readOnly}
      onClick={() => {
        if (readOnly) return
        onInsert(item)
      }}
      {...(readOnly ? {} : listeners)}
      {...attributes}
      className={cn(
        'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs',
        readOnly
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-grab hover:bg-accent hover:text-accent-foreground active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
    >
      <GripVertical className="size-3 shrink-0 text-muted-foreground/40" />
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{item.label}</span>
    </button>
  )
}
