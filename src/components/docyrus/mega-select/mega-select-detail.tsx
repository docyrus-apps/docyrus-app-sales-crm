'use client'

import { forwardRef, useCallback, type HTMLAttributes } from 'react'

import { ArrowLeft, Check } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'

import { tUi } from '@/lib/ui-i18n'

import { useMegaSelect } from './mega-select-context'

export type MegaSelectDetailProps = HTMLAttributes<HTMLDivElement>

const MegaSelectDetail = forwardRef<HTMLDivElement, MegaSelectDetailProps>(
  ({ className, ...props }, ref) => {
    const {
      detailItem,
      setDetailItem,
      selectedId,
      disabled,
      defaultColor,
      defaultIcon,
      locale,
      onChoose,
    } = useMegaSelect()

    const handleBack = useCallback(() => {
      setDetailItem(null)
    }, [setDetailItem])

    const handleChoose = useCallback(() => {
      if (!detailItem || disabled) return
      onChoose?.(detailItem.id, detailItem)
    }, [detailItem, disabled, onChoose])

    if (!detailItem) return null

    const iconId = detailItem.icon ?? defaultIcon
    const color = detailItem.color ?? defaultColor
    const isSelected = selectedId === detailItem.id

    return (
      <div
        ref={ref}
        className={cn(
          'flex w-80 shrink-0 flex-col border-l bg-background',
          className,
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={handleBack}
          >
            <ArrowLeft className="size-4" />
            <span className="sr-only">{tUi(locale, 'mgsBack')}</span>
          </Button>
          <span className="truncate text-sm font-medium">
            {detailItem.label}
          </span>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {/* Icon / Image */}
            <div className="flex justify-center">
              {detailItem.image ? (
                <Avatar className="size-16">
                  <AvatarImage src={detailItem.image} alt={detailItem.label} />
                  <AvatarFallback className="text-lg">
                    {detailItem.label.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : iconId ? (
                <div
                  className={cn(
                    'flex size-16 items-center justify-center rounded-xl',
                    color
                      ? `bg-${color}-100 text-${color}-600 dark:bg-${color}-950 dark:text-${color}-400`
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <DocyrusIcon icon={iconId} size="xl" />
                </div>
              ) : null}
            </div>

            {/* Title + Description */}
            <div className="text-center">
              <h3 className="text-base font-semibold text-foreground">
                {detailItem.label}
              </h3>
              {detailItem.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {detailItem.description}
                </p>
              ) : null}
            </div>

            {/* Rich Content */}
            {detailItem.content ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {detailItem.content}
              </div>
            ) : null}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="border-t p-3">
          <Button className="w-full" disabled={disabled} onClick={handleChoose}>
            {isSelected ? <Check className="mr-2 size-4" /> : null}
            {tUi(locale, 'mgsChoose')}
          </Button>
        </div>
      </div>
    )
  },
)

MegaSelectDetail.displayName = 'MegaSelectDetail'

export { MegaSelectDetail }
