'use client'

import {
  forwardRef,
  useCallback,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type RefObject,
} from 'react'

import { X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import { tUi, type UiI18nLocale } from '@/lib/ui-i18n'

import { type MegaSelectCategory, type MegaSelectItem } from './types'
import { MegaSelectProvider } from './mega-select-context'
import { MegaSelectSearch } from './mega-select-search'
import { MegaSelectCategories } from './mega-select-categories'
import { MegaSelectGrid } from './mega-select-grid'
import { MegaSelectDetail } from './mega-select-detail'

const megaSelectVariants = cva(
  'relative flex overflow-hidden rounded-xl border bg-background',
  {
    variants: {
      size: {
        thin: 'w-90',
        default: 'w-140',
        large: 'w-195',
        full: 'w-full',
      },
      variant: {
        default: 'shadow-sm',
        elevated: 'shadow-lg',
        flat: 'border-transparent shadow-none',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  },
)

export type MegaSelectSize = 'thin' | 'default' | 'large' | 'full'
export type MegaSelectVariant = 'default' | 'elevated' | 'flat'

export interface MegaSelectProps<T = unknown>
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'onSelect' | 'defaultValue'>,
    VariantProps<typeof megaSelectVariants> {
  /** Array of selectable items. */
  items: MegaSelectItem<T>[]
  /** Optional categories for filtering. */
  categories?: MegaSelectCategory[]
  /** Controlled selected value. */
  value?: string | null
  /** Default selected value (uncontrolled). */
  defaultValue?: string
  /** Number of grid columns. */
  columns?: 1 | 2 | 3 | 4 | 'auto'
  /** Max height of the component. */
  height?: string
  /** Disable all interactions. */
  disabled?: boolean
  /** Show loading skeleton. */
  loading?: boolean
  /** Auto-open detail panel when clicking items with content. */
  forceOpenDetail?: boolean
  /** Only allow selecting this specific item. */
  restrictedValue?: string
  /** Default accent color for items without a color. */
  defaultColor?: string
  /** Default icon for items without an icon. */
  defaultIcon?: string
  /** Locale for i18n. */
  locale?: UiI18nLocale
  /** Show close button. */
  closable?: boolean
  /** Show search input. */
  searchable?: boolean
  /** Called when user confirms selection (e.g. "Choose" button). */
  onChoose?: (value: string, item: MegaSelectItem<T>) => void
  /** Called when selection changes. */
  onSelectionChange?: (
    value: string | null,
    item: MegaSelectItem<T> | null,
  ) => void
  /** Called when close button is clicked. */
  onClose?: () => void
}

const MegaSelect = forwardRef<HTMLDivElement, MegaSelectProps>(
  (
    {
      className,
      size,
      variant,
      items,
      categories,
      value,
      defaultValue,
      columns = 2,
      height = '80vh',
      disabled = false,
      loading = false,
      forceOpenDetail = false,
      restrictedValue,
      defaultColor,
      defaultIcon,
      locale = 'en',
      closable = false,
      searchable = true,
      onChoose,
      onSelectionChange,
      onClose,
      ...props
    },
    ref,
  ) => {
    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape' && onClose) {
          e.preventDefault()
          onClose()
        }
      },
      [onClose],
    )

    return (
      <MegaSelectProvider
        items={items}
        categories={categories}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        loading={loading}
        forceOpenDetail={forceOpenDetail}
        restrictedValue={restrictedValue}
        defaultColor={defaultColor}
        defaultIcon={defaultIcon}
        locale={locale}
        searchable={searchable}
        onChoose={onChoose}
        onSelectionChange={onSelectionChange}
        onClose={onClose}
      >
        <div
          ref={ref}
          role="group"
          aria-label="Selection panel"
          style={{ maxHeight: height }}
          className={cn(megaSelectVariants({ size, variant }), className)}
          onKeyDown={handleKeyDown}
          {...props}
        >
          {/* Main Panel */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Close Button */}
            {closable && onClose ? (
              <div className="flex justify-end px-4 pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={onClose}
                >
                  <X className="size-4" />
                  <span className="sr-only">{tUi(locale, 'close')}</span>
                </Button>
              </div>
            ) : null}

            <MegaSelectSearch />
            <MegaSelectCategories />
            <MegaSelectGrid
              columns={columns}
              height="100%"
              className="flex-1"
            />
          </div>

          {/* Detail Panel */}
          <MegaSelectDetail />
        </div>
      </MegaSelectProvider>
    )
  },
) as <T = unknown>(
  props: MegaSelectProps<T> & { ref?: RefObject<HTMLDivElement> },
) => ReactElement | null

;(MegaSelect as { displayName?: string }).displayName = 'MegaSelect'

export { MegaSelect, megaSelectVariants }
