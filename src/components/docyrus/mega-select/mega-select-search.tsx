'use client';

import { forwardRef, useCallback, type HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

import { SearchInput } from '@/components/docyrus/search-input';

import { useMegaSelect } from './mega-select-context';

export type MegaSelectSearchProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>;

const MegaSelectSearch = forwardRef<HTMLDivElement, MegaSelectSearchProps>(
  ({ className, ...props }, ref) => {
    const {
      searchQuery, setSearchQuery, disabled, locale, searchable
    } = useMegaSelect();

    const handleSearch = useCallback(() => {
    }, []);

    if (!searchable) return null;

    return (
      <div ref={ref} className={cn('px-4 pt-4', className)} {...props}>
        <SearchInput
          value={searchQuery}
          onValueChange={setSearchQuery}
          onSearch={handleSearch}
          mode="debounce"
          debounceMs={200}
          disabled={disabled}
          locale={locale}
          size="default" />
      </div>
    );
  }
);

MegaSelectSearch.displayName = 'MegaSelectSearch';

export { MegaSelectSearch };