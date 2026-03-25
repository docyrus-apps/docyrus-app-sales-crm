'use client';

import { type ComponentProps, type ReactNode } from 'react';

import {
  Columns3Icon,
  Rows3Icon,
  ChevronDownIcon,
  ChevronRightIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { type PivotGridController } from './types';

import { PivotGridExportMenu } from './pivot-grid-export-menu';

interface PivotGridToolbarProps<TData> extends ComponentProps<'div'> {
  controller: PivotGridController<TData>;
  startContent?: ReactNode;
  endContent?: ReactNode;
}

export function PivotGridToolbar<TData>({
  controller,
  startContent,
  endContent,
  className,
  ...props
}: PivotGridToolbarProps<TData>) {
  return (
    <div
      data-slot="pivot-grid-toolbar"
      className={cn(
        'flex flex-wrap items-center gap-2 border-b px-3 py-2',
        className
      )}
      {...props}>
      {startContent ? (
        <div className="flex flex-wrap items-center gap-2">{startContent}</div>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        onClick={controller.expandAllRows}>
        <Rows3Icon className="size-4" />
        <ChevronDownIcon className="size-3.5" />
        Expand rows
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={controller.collapseAllRows}>
        <Rows3Icon className="size-4" />
        <ChevronRightIcon className="size-3.5" />
        Collapse rows
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={controller.expandAllColumns}>
        <Columns3Icon className="size-4" />
        <ChevronDownIcon className="size-3.5" />
        Expand columns
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={controller.collapseAllColumns}>
        <Columns3Icon className="size-4" />
        <ChevronRightIcon className="size-3.5" />
        Collapse columns
      </Button>
      <PivotGridExportMenu controller={controller} />
      {endContent ? (
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {endContent}
        </div>
      ) : null}
    </div>
  );
}