'use client';

import { cn } from '@/lib/utils';

import { type DocyrusValueProps } from './types';

import { formatMoney, getCompanionValue } from './utils';

export function MoneyValue({
  field,
  value,
  record,
  className
}: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const num = Number(value);

  if (Number.isNaN(num)) {
    return <span className="text-muted-foreground">—</span>;
  }

  const currency = getCompanionValue(record, field.slug, 'currency');
  const formatted = formatMoney(
    num,
    typeof currency === 'string' ? currency : undefined
  );

  return <span className={cn('tabular-nums', className)}>{formatted}</span>;
}