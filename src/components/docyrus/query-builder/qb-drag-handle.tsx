'use client';

import { forwardRef, memo } from 'react';

import { type DragHandleProps } from 'react-querybuilder';

import { GripVertical } from 'lucide-react';

import { cn } from '@/lib/utils';

const QBDragHandle = memo(forwardRef<HTMLSpanElement, DragHandleProps>(
  ({
    className, title, disabled, testID
  }, ref) => {
    return (
      <span
        ref={ref}
        role="button"
        tabIndex={disabled ? -1 : 0}
        title={title}
        aria-roledescription="Drag handle"
        aria-label={title || 'Reorder'}
        className={cn(
          'qb-drag-handle flex cursor-grab items-center text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
        data-testid={testID}>
        <GripVertical className="size-4" />
      </span>
    );
  }
));

QBDragHandle.displayName = 'QBDragHandle';

export { QBDragHandle };