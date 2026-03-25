'use client';

import { forwardRef, type HTMLAttributes } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

import { tUi } from '@/lib/ui-i18n';

import { useMegaSelect } from './mega-select-context';
import { MegaSelectItemCard } from './mega-select-item';

const megaSelectGridVariants = cva('grid gap-2 p-4', {
  variants: {
    columns: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      auto: 'grid-cols-[repeat(auto-fill,minmax(220px,1fr))]'
    }
  },
  defaultVariants: {
    columns: 2
  }
});

export interface MegaSelectGridProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'columns'>,
  VariantProps<typeof megaSelectGridVariants> {
  /** Max height for the scrollable grid area. */
  height?: string;
}

const MegaSelectGrid = forwardRef<HTMLDivElement, MegaSelectGridProps>(
  ({
    className, columns, height = '100%', ...props
  }, ref) => {
    const {
      filteredItems, loading, items, locale
    } = useMegaSelect();

    if (loading) {
      return (
        <div ref={ref} className={cn(megaSelectGridVariants({ columns }), className)} {...props}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-18 rounded-lg" />
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div ref={ref} className="flex flex-1 items-center justify-center p-8 text-center" {...props}>
          <p className="text-sm text-muted-foreground">{tUi(locale, 'mgsNoItems')}</p>
        </div>
      );
    }

    if (filteredItems.length === 0) {
      return (
        <div ref={ref} className="flex flex-1 items-center justify-center p-8 text-center" {...props}>
          <p className="text-sm text-muted-foreground">{tUi(locale, 'mgsNoResults')}</p>
        </div>
      );
    }

    return (
      <ScrollArea style={{ height }}>
        <div
          ref={ref}
          role="listbox"
          className={cn(megaSelectGridVariants({ columns }), className)}
          {...props}>
          {filteredItems.map(item => (
            <MegaSelectItemCard key={item.id} item={item} />
          ))}
        </div>
      </ScrollArea>
    );
  }
);

MegaSelectGrid.displayName = 'MegaSelectGrid';

export { MegaSelectGrid, megaSelectGridVariants };