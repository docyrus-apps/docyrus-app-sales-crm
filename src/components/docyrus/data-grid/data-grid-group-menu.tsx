'use client';

import { useCallback, useMemo, type ComponentProps } from 'react';

import { type Column, type Table } from '@tanstack/react-table';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { getGroupableCellVariant } from './lib/data-grid-grouping';

interface DataGridGroupMenuProps<TData> extends ComponentProps<
  typeof SelectContent
> {
  table: Table<TData>;
  disabled?: boolean;
}

function getColumnLabel<TData>(column: Column<TData, unknown>): string {
  const label = column.columnDef.meta?.label;

  if (label) return label;

  const { header } = column.columnDef;

  if (typeof header === 'string') return header;

  return column.id;
}

export function DataGridGroupMenu<TData>({
  table,
  disabled,
  ...props
}: DataGridGroupMenuProps<TData>) {
  const { grouping } = table.getState();

  const groupableColumns = useMemo(
    () => table.getAllLeafColumns().filter((column) => {
      if (column.id === 'select' || column.id === 'actions') {
        return false;
      }

      const variant = getGroupableCellVariant(column.columnDef.meta?.cell);

      return Boolean(variant) && column.getCanGroup();
    }),
    [table]
  );

  const groupedColumnId = grouping[0];
  const hasCurrentGrouping = groupableColumns.some(
    column => column.id === groupedColumnId
  );
  const value = hasCurrentGrouping && groupedColumnId ? groupedColumnId : 'none';

  const selectedLabel = useMemo(() => {
    if (value === 'none') return 'No grouping';
    const selectedColumn = groupableColumns.find(
      column => column.id === value
    );

    return selectedColumn ? getColumnLabel(selectedColumn) : 'No grouping';
  }, [groupableColumns, value]);

  const onValueChange = useCallback(
    (nextValue: string) => {
      if (nextValue === 'none') {
        table.setGrouping([]);
        table.setExpanded({});

        return;
      }

      table.setGrouping([nextValue]);
      table.setExpanded(true);
    },
    [table]
  );

  const isDisabled = disabled || groupableColumns.length === 0;

  return (
    <Select value={value} onValueChange={onValueChange} disabled={isDisabled}>
      <SelectTrigger size="sm" className="h-8 w-[180px] bg-background">
        <SelectValue placeholder="Group rows">{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent {...props}>
        <SelectItem value="none">No grouping</SelectItem>
        {groupableColumns.map(column => (
          <SelectItem key={column.id} value={column.id}>
            {getColumnLabel(column)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}