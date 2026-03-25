'use client';

import { useMemo } from 'react';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  useReactTable
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

import { type SchedulerResource } from './types';

import { useResourceSchedulerContext } from './resource-scheduler-context';

interface ResourceSchedulerResourceListProps {
  resources: Array<SchedulerResource>;
  resourceColumns?: Array<ColumnDef<SchedulerResource>>;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

const defaultColumn: ColumnDef<SchedulerResource> = {
  id: 'resource',
  header: 'Resource',
  cell: ({ row }) => {
    const resource = row.original;

    return (
      <div className="flex items-center gap-2.5 px-3">
        <Avatar className="size-7 shrink-0">
          {resource.avatar && <AvatarImage src={resource.avatar} alt={resource.name} />}
          <AvatarFallback className="text-[10px]">{getInitials(resource.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium leading-tight">{resource.name}</div>
          {resource.subtitle && (
            <div className="truncate text-xs text-muted-foreground">{resource.subtitle}</div>
          )}
        </div>
      </div>
    );
  }
};

export function ResourceSchedulerResourceList({
  resources,
  resourceColumns
}: ResourceSchedulerResourceListProps) {
  const { rowHeight } = useResourceSchedulerContext();

  const hasGroups = resources.some(r => r.group);

  const columns = useMemo<Array<ColumnDef<SchedulerResource>>>(() => {
    if (resourceColumns && resourceColumns.length > 0) return resourceColumns;

    return [defaultColumn];
  }, [resourceColumns]);

  const table = useReactTable({
    data: resources,
    columns,
    getCoreRowModel: getCoreRowModel(),
    ...(hasGroups ? {
      getGroupedRowModel: getGroupedRowModel(),
      getExpandedRowModel: getExpandedRowModel(),
      grouping: ['group'],
      initialState: { expanded: true }
    } : {})
  });

  return (
    <div className="sticky left-0 z-30 min-h-full overflow-clip border-r bg-background">
      {/* Header cell matching timeline header height */}
      <div className="sticky top-0 z-20 border-b bg-background">
        <div className="flex h-15 items-end px-3 pb-1.5 text-xs font-medium text-muted-foreground">
          {columns[0]?.header as string ?? 'Resource'}
        </div>
      </div>
      {/* Resource rows */}
      <div>
        {table.getRowModel().rows.map((row) => {
          if (row.getIsGrouped()) {
            return (
              <div
                key={row.id}
                className="flex cursor-pointer items-center gap-1.5 border-b bg-muted/40 px-3 text-xs font-medium text-muted-foreground"
                style={{ height: rowHeight }}
                onClick={row.getToggleExpandedHandler()}>
                {row.getIsExpanded() ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                {row.groupingValue as string}
                <span className="ml-auto text-[10px] opacity-60">{row.subRows.length}</span>
              </div>
            );
          }

          return (
            <div
              key={row.id}
              className={cn('flex items-center border-b')}
              style={{ height: rowHeight }}>
              {row.getVisibleCells().map(cell => (
                <div key={cell.id} className="w-full truncate">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}