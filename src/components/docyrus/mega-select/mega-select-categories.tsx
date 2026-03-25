'use client';

import {
  forwardRef, useCallback, useRef, type HTMLAttributes
} from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';

import { tUi } from '@/lib/ui-i18n';

import { useMegaSelect } from './mega-select-context';

export type MegaSelectCategoriesProps = HTMLAttributes<HTMLDivElement>;

const MegaSelectCategories = forwardRef<HTMLDivElement, MegaSelectCategoriesProps>(
  ({ className, ...props }, ref) => {
    const {
      categories, activeCategory, setActiveCategory, disabled, locale
    } = useMegaSelect();
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleCategoryClick = useCallback(
      (categoryId: string | null) => {
        setActiveCategory(categoryId);
      },
      [setActiveCategory]
    );

    if (categories.length === 0) return null;

    return (
      <div ref={ref} className={cn('px-4 pt-3', className)} {...props}>
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-1.5 overflow-x-auto">
          <Button
            variant={activeCategory === null ? 'default' : 'outline'}
            size="sm"
            className="h-7 shrink-0 px-3 text-xs"
            disabled={disabled}
            onClick={() => handleCategoryClick(null)}>
            {tUi(locale, 'mgsAllCategories')}
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              className="h-7 shrink-0 gap-1.5 px-3 text-xs"
              disabled={disabled}
              onClick={() => handleCategoryClick(cat.id)}>
              {cat.icon ? <DocyrusIcon icon={cat.icon} size="xs" /> : null}
              {cat.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }
);

MegaSelectCategories.displayName = 'MegaSelectCategories';

export { MegaSelectCategories };