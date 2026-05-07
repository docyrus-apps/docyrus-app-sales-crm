'use client'

import { useCallback, type ReactNode } from 'react'

import { GripVertical, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
  type SortableProps,
} from '@/components/ui/sortable'
import { useUiTranslation } from '@/lib/use-ui-translation'

interface SchemaRepeaterItem {
  id: string
}

interface SchemaRepeaterHelpers<T> {
  remove: () => void
  update: (updates: Partial<T>) => void
}

interface SchemaRepeaterProps<T extends SchemaRepeaterItem> {
  value: Array<T>
  onValueChange: (items: Array<T>) => void
  renderItem: (
    item: T,
    index: number,
    helpers: SchemaRepeaterHelpers<T>,
  ) => ReactNode
  createItem: () => T
  maxItems?: number
  minItems?: number
  addLabel?: string
  disabled?: boolean
  className?: string
}

function SchemaRepeater<T extends SchemaRepeaterItem>({
  value,
  onValueChange,
  renderItem,
  createItem,
  maxItems,
  minItems = 0,
  addLabel,
  disabled,
  className,
}: SchemaRepeaterProps<T>) {
  const { t } = useUiTranslation()
  const canAdd = !maxItems || value.length < maxItems
  const canRemove = value.length > minItems

  const onAdd = useCallback(() => {
    if (!canAdd) return

    onValueChange([...value, createItem()])
  }, [canAdd, value, onValueChange, createItem])

  const onRemove = useCallback(
    (index: number) => {
      if (!canRemove) return

      onValueChange(value.filter((_, i) => i !== index))
    },
    [canRemove, value, onValueChange],
  )

  const onUpdate = useCallback(
    (index: number, updates: Partial<T>) => {
      onValueChange(
        value.map((item, i) => (i === index ? { ...item, ...updates } : item)),
      )
    },
    [value, onValueChange],
  )

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Sortable
        {...({
          value,
          getItemValue: (item: T) => item.id,
          onValueChange,
          orientation: 'vertical',
        } as SortableProps<T>)}
      >
        {value.length > 0 && (
          <SortableContent className="space-y-2">
            {value.map((item, index) => (
              <SortableItem key={item.id} value={item.id} asChild>
                <div className="flex items-start gap-2">
                  <SortableItemHandle asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-0.5 size-8 shrink-0 text-muted-foreground"
                      disabled={disabled}
                      aria-label={t('ui.schemaRepeater.reorder', 'Reorder')}
                    >
                      <GripVertical className="size-4" />
                    </Button>
                  </SortableItemHandle>
                  <div className="min-w-0 flex-1">
                    {renderItem(item, index, {
                      remove: () => onRemove(index),
                      update: (updates) => onUpdate(index, updates),
                    })}
                  </div>
                  {canRemove && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mt-0.5 size-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(index)}
                      disabled={disabled}
                      aria-label={t('ui.schemaRepeater.remove', 'Remove')}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </SortableItem>
            ))}
          </SortableContent>
        )}
        <SortableOverlay>
          <div className="flex items-center gap-2 rounded-sm border bg-background px-2 py-1">
            <div className="size-8 rounded-sm bg-primary/10" />
            <div className="h-8 flex-1 rounded-sm bg-primary/10" />
            <div className="size-8 rounded-sm bg-primary/10" />
          </div>
        </SortableOverlay>
      </Sortable>
      {canAdd && (
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={onAdd}
          disabled={disabled}
        >
          <Plus className="size-4" />
          {addLabel ?? t('ui.schemaRepeater.add', 'Add')}
        </Button>
      )}
    </div>
  )
}

export { SchemaRepeater }
export type { SchemaRepeaterItem, SchemaRepeaterHelpers, SchemaRepeaterProps }
