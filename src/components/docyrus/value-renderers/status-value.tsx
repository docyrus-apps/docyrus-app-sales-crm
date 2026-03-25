'use client';

import { Calendar } from 'lucide-react';

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { getEnumBadgeColors } from '../form-fields/lib/utils';
import { getCompanionValue } from './utils';
import { type DocyrusValueProps } from './types';

export function StatusValue({
  field,
  value,
  record,
  enumOptions,
  className
}: DocyrusValueProps) {
  if (value == null || value === '') {
    return <span className="text-muted-foreground">—</span>;
  }

  const primaryOption = enumOptions?.find(o => o.id === value);
  const secondaryId = getCompanionValue(record, field.slug, 'secondary');
  const secondaryOption
    = secondaryId && enumOptions ? enumOptions.find(o => o.id === secondaryId) : null;
  const description = getCompanionValue(record, field.slug, 'description');
  const followupDate = getCompanionValue(record, field.slug, 'followup_date');

  const primaryColors = primaryOption ? getEnumBadgeColors(primaryOption.color) : {};

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 flex-wrap', className)}>
      {primaryOption ? (
        <Badge
          variant="secondary"
          className={primaryColors.className}
          style={primaryColors.style}>
          {primaryOption.icon && (
            <DocyrusIcon
              icon={primaryOption.icon}
              className="size-3.5 shrink-0" />
          )}
          <span className="truncate">{primaryOption.name}</span>
        </Badge>
      ) : (
        <Badge variant="secondary">
          <span className="truncate">{String(value)}</span>
        </Badge>
      )}
      {secondaryOption && (
        <Badge variant="outline">
          {secondaryOption.icon && (
            <DocyrusIcon
              icon={secondaryOption.icon}
              className="size-3.5 shrink-0" />
          )}
          <span className="truncate">{secondaryOption.name}</span>
        </Badge>
      )}
      {typeof description === 'string' && description && (
        <span className="text-muted-foreground truncate text-xs">
          {description}
        </span>
      )}
      {typeof followupDate === 'string' && followupDate && (
        <span className="text-muted-foreground inline-flex items-center gap-0.5 text-xs">
          <Calendar className="size-3" />
          {new Date(followupDate).toLocaleDateString()}
        </span>
      )}
    </span>
  );
}