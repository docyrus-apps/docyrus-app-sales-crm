'use client'

import { forwardRef, useEffect, useState } from 'react'

import { cva } from 'class-variance-authority'
import { GripHorizontal, MoreVertical } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  type SortableProps,
} from '@/components/ui/sortable'

import { AwesomeStatsCard } from './awesome-stats-card'
import { AwesomeStatsTabs } from './awesome-stats-tabs'
import {
  type AwesomeStatItem,
  type AwesomeStatsCardMenuItem,
  type AwesomeStatsProps,
} from './types'

const awesomeStatsRootVariants = cva('w-full', {
  variants: {
    layoutType: {
      flex: '',
      grid: '',
      tabs: '',
    },
  },
  defaultVariants: {
    layoutType: 'grid',
  },
})

const awesomeStatsItemVariants = cva('min-w-0', {
  variants: {
    layoutType: {
      flex: 'shrink-0',
      grid: 'w-full',
      tabs: 'w-full',
    },
  },
  defaultVariants: {
    layoutType: 'grid',
  },
})

function AwesomeStatsCardControl({
  item,
  menuItems,
}: {
  item: AwesomeStatItem
  menuItems: AwesomeStatsCardMenuItem[]
}) {
  const [open, setOpen] = useState(false)

  if (!menuItems.length) {
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          aria-label={`Open menu for ${typeof item.title === 'string' ? item.title : 'stat'}`}
        >
          <MoreVertical className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 gap-1 p-1">
        {menuItems.map((menuItem) => (
          <button
            key={menuItem.id}
            type="button"
            disabled={menuItem.disabled}
            className={cn(
              'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none transition-colors',
              'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground',
              'disabled:pointer-events-none disabled:opacity-50',
              menuItem.variant === 'destructive' &&
                'text-destructive hover:bg-destructive/10 hover:text-destructive',
            )}
            onClick={(event) => {
              event.stopPropagation()
              menuItem.onSelect?.(item)
              setOpen(false)
            }}
          >
            {menuItem.icon}
            <span className="min-w-0 flex-1 truncate">{menuItem.label}</span>
            {menuItem.shortcut ? (
              <span className="ml-auto text-xs tracking-widest text-muted-foreground">
                {menuItem.shortcut}
              </span>
            ) : null}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

const AwesomeStats = forwardRef<HTMLDivElement, AwesomeStatsProps>(
  (
    {
      items,
      layout,
      cardVariant = 'default',
      awesomeCardProps,
      sortable = false,
      onItemsOrderChange,
      getCardMenuItems,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const [orderedItems, setOrderedItems] = useState(items)

    useEffect(() => {
      setOrderedItems(items)
    }, [items])

    if (!items.length) return null

    const firstItem = orderedItems[0]
    const sortableEnabled = sortable
    const sortingEnabled = sortableEnabled && orderedItems.length > 1
    const showCardDragHandle = sortingEnabled && layout.type !== 'tabs'

    const onOrderedItemsChange = (nextItems: AwesomeStatItem[]) => {
      setOrderedItems(nextItems)
      onItemsOrderChange?.(nextItems)
    }

    const getMenuItemsForCard = (
      item: AwesomeStatItem,
    ): AwesomeStatsCardMenuItem[] => {
      return item.menuItems ?? getCardMenuItems?.(item) ?? []
    }

    const renderCardControl = (item: AwesomeStatItem) => {
      const menuItems = getMenuItemsForCard(item)

      return <AwesomeStatsCardControl item={item} menuItems={menuItems} />
    }

    const renderDragHandle = (item: AwesomeStatItem) => {
      if (!showCardDragHandle) {
        return null
      }

      return (
        <SortableItemHandle asChild>
          <button
            type="button"
            className={cn(
              'absolute left-1/2 top-4 z-20 inline-flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-all',
              'opacity-0 group-hover/awesome-stats-card:opacity-100 hover:text-foreground',
            )}
            aria-label={`Reorder ${typeof item.title === 'string' ? item.title : 'stat'}`}
          >
            <GripHorizontal className="size-4" />
          </button>
        </SortableItemHandle>
      )
    }

    const renderCard = (item: AwesomeStatItem) => {
      const dragHandle = renderDragHandle(item)
      const hasBottomChart =
        item.miniChart && (item.miniChart.position ?? 'right') === 'bottom'

      return (
        <div
          className={cn(
            'group/awesome-stats-card relative',
            showCardDragHandle ? (hasBottomChart ? 'pt-2' : 'pt-3') : 'pt-0',
          )}
        >
          {dragHandle}
          <AwesomeStatsCard
            key={item.id}
            item={item}
            cardVariant={cardVariant}
            awesomeCardProps={awesomeCardProps}
            headerControl={renderCardControl(item)}
          />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          awesomeStatsRootVariants({ layoutType: layout.type }),
          className,
        )}
        style={style}
        {...props}
      >
        {layout.type === 'flex' && layout.behavior === 'scroll' ? (
          <Sortable
            {...({
              value: orderedItems,
              getItemValue: (item: AwesomeStatItem) => item.id,
              onValueChange: onOrderedItemsChange,
              orientation: 'horizontal',
            } as SortableProps<AwesomeStatItem>)}
          >
            <div className="w-full min-w-0 overflow-x-auto pb-1">
              <SortableContent
                className="flex min-w-full w-max flex-nowrap items-stretch"
                style={{ gap: layout.gap ?? '1rem' }}
              >
                {orderedItems.map((item) => (
                  <SortableItem
                    key={item.id}
                    value={item.id}
                    asChild
                    disabled={!sortingEnabled}
                  >
                    <div
                      className={awesomeStatsItemVariants({
                        layoutType: 'flex',
                      })}
                      style={{
                        width: layout.cardWidth,
                        minWidth: layout.cardWidth,
                      }}
                    >
                      {renderCard(item)}
                    </div>
                  </SortableItem>
                ))}
              </SortableContent>
            </div>
          </Sortable>
        ) : null}

        {layout.type === 'flex' && layout.behavior === 'wrap' ? (
          <Sortable
            {...({
              value: orderedItems,
              getItemValue: (item: AwesomeStatItem) => item.id,
              onValueChange: onOrderedItemsChange,
              orientation: 'mixed',
            } as SortableProps<AwesomeStatItem>)}
          >
            <SortableContent
              className="flex flex-wrap items-stretch"
              style={{ gap: layout.gap ?? '1rem' }}
            >
              {orderedItems.map((item) => (
                <SortableItem
                  key={item.id}
                  value={item.id}
                  asChild
                  disabled={!sortingEnabled}
                >
                  <div
                    className={awesomeStatsItemVariants({ layoutType: 'flex' })}
                    style={{
                      width: layout.cardWidth,
                      minWidth: layout.cardWidth,
                    }}
                  >
                    {renderCard(item)}
                  </div>
                </SortableItem>
              ))}
            </SortableContent>
          </Sortable>
        ) : null}

        {layout.type === 'grid' ? (
          <Sortable
            {...({
              value: orderedItems,
              getItemValue: (item: AwesomeStatItem) => item.id,
              onValueChange: onOrderedItemsChange,
              orientation: 'mixed',
            } as SortableProps<AwesomeStatItem>)}
          >
            <SortableContent
              className="grid justify-items-stretch"
              style={{
                gap: layout.gap ?? '1rem',
                gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
              }}
            >
              {orderedItems.map((item) => (
                <SortableItem
                  key={item.id}
                  value={item.id}
                  asChild
                  disabled={!sortingEnabled}
                >
                  <div
                    className={awesomeStatsItemVariants({ layoutType: 'grid' })}
                    style={{
                      maxWidth: layout.maxCardWidth,
                      width: '100%',
                    }}
                  >
                    {renderCard(item)}
                  </div>
                </SortableItem>
              ))}
            </SortableContent>
          </Sortable>
        ) : null}

        {layout.type === 'tabs' ? (
          orderedItems.length === 1 && firstItem ? (
            renderCard(firstItem)
          ) : (
            <AwesomeStatsTabs
              items={orderedItems}
              defaultTabId={layout.defaultTabId}
              renderItem={(item) => renderCard(item)}
              sortable={sortingEnabled}
              onItemsOrderChange={
                sortingEnabled ? onOrderedItemsChange : undefined
              }
            />
          )
        ) : null}
      </div>
    )
  },
)

AwesomeStats.displayName = 'AwesomeStats'

export { AwesomeStats }
