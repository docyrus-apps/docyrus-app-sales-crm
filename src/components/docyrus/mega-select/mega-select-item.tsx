'use client'

import {
  forwardRef,
  useCallback,
  type HTMLAttributes,
  type KeyboardEvent,
} from 'react'

import { cva, type VariantProps } from 'class-variance-authority'
import { Check, Info } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { tUi } from '@/lib/ui-i18n'

import { type MegaSelectItem as MegaSelectItemType } from './types'
import { useMegaSelect } from './mega-select-context'

const megaSelectItemVariants = cva(
  'group/item relative flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all outline-none',
  {
    variants: {
      state: {
        default:
          'border-border bg-card hover:border-primary/40 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring',
        selected:
          'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20',
        disabled:
          'pointer-events-none cursor-not-allowed border-border bg-muted/50 opacity-50',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  },
)

export interface MegaSelectItemProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'onClick'>,
    VariantProps<typeof megaSelectItemVariants> {
  item: MegaSelectItemType
}

const MegaSelectItemCard = forwardRef<HTMLDivElement, MegaSelectItemProps>(
  ({ className, item, ...props }, ref) => {
    const {
      selectedId,
      setSelectedId,
      setDetailItem,
      disabled: globalDisabled,
      forceOpenDetail,
      restrictedValue,
      defaultColor,
      defaultIcon,
      locale,
      onChoose,
    } = useMegaSelect()

    const isSelected = selectedId === item.id
    const isDisabled =
      globalDisabled ||
      item.disabled ||
      (!!restrictedValue && restrictedValue !== item.id)
    const iconId = item.icon ?? defaultIcon
    const color = item.color ?? defaultColor

    const state: 'default' | 'selected' | 'disabled' = isDisabled
      ? 'disabled'
      : isSelected
        ? 'selected'
        : 'default'

    const handleClick = useCallback(() => {
      if (isDisabled) return
      setSelectedId(item.id)
      if (forceOpenDetail && item.content) {
        setDetailItem(item)
      }
    }, [isDisabled, item, setSelectedId, setDetailItem, forceOpenDetail])

    const handleChoose = useCallback(() => {
      if (isDisabled) return
      onChoose?.(item.id, item)
    }, [isDisabled, item, onChoose])

    const handleReadMore = useCallback(() => {
      setDetailItem(item)
    }, [item, setDetailItem])

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      },
      [handleClick],
    )

    return (
      <div
        ref={ref}
        role="option"
        aria-selected={isSelected}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : 0}
        className={cn(megaSelectItemVariants({ state }), className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {/* Icon / Image */}
        {item.image || iconId ? (
          <div className="shrink-0">
            {item.image ? (
              <Avatar className="size-10">
                <AvatarImage src={item.image} alt={item.label} />
                <AvatarFallback>
                  {item.label.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : iconId ? (
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-lg',
                  color
                    ? `bg-${color}-100 text-${color}-600 dark:bg-${color}-950 dark:text-${color}-400`
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <DocyrusIcon icon={iconId} size="default" />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Text Content */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {item.label}
          </div>
          {item.description ? (
            <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
              {item.description}
            </div>
          ) : null}
        </div>

        {/* Selected Check */}
        {isSelected ? (
          <div className="shrink-0 text-primary">
            <Check className="size-4" />
          </div>
        ) : null}

        {/* Hover Actions */}
        {!isDisabled ? (
          <div className="absolute inset-y-0 right-2 flex items-center gap-1 opacity-0 transition-opacity group-hover/item:opacity-100">
            {item.content ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  handleReadMore()
                }}
              >
                <Info className="mr-1 size-3" />
                {tUi(locale, 'mgsReadMore')}
              </Button>
            ) : null}
            <Button
              variant="default"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation()
                handleChoose()
              }}
            >
              {tUi(locale, 'mgsChoose')}
            </Button>
          </div>
        ) : null}
      </div>
    )
  },
)

MegaSelectItemCard.displayName = 'MegaSelectItemCard'

export { MegaSelectItemCard, megaSelectItemVariants }
