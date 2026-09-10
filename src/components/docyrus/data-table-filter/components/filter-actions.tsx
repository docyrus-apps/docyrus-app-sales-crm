'use client'

// @ts-nocheck
/* eslint-disable */
import { memo } from 'react'

import { FilterXIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'

import { type Locale, t } from '../lib/i18n'
import { type DataTableFilterActions } from '../core/types'

interface FilterActionsProps {
  hasFilters: boolean
  actions?: DataTableFilterActions
  locale?: Locale
}

export const FilterActions = memo(__FilterActions)
function __FilterActions({
  hasFilters,
  actions,
  locale = 'en',
}: FilterActionsProps) {
  return (
    <Button
      size="sm"
      className={cn('!px-2', !hasFilters && 'hidden')}
      variant="destructive"
      onClick={actions?.removeAllFilters}
    >
      <FilterXIcon />
      <span className="hidden md:block">{t('clear', locale)}</span>
    </Button>
  )
}
