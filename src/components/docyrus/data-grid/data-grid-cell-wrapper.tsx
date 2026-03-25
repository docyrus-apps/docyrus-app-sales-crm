'use client';

import {
  useCallback, type ComponentProps, type KeyboardEvent, type MouseEvent
} from 'react';

import { useComposedRefs } from '@/lib/compose-refs';

import { cn } from '@/lib/utils';

import { type DataGridCellProps } from './types';

import { getCellKey } from './lib/data-grid';

interface DataGridCellWrapperProps<TData>
  extends DataGridCellProps<TData>, ComponentProps<'div'> {}

export function DataGridCellWrapper<TData>({
  tableMeta,
  rowIndex,
  columnId,
  isEditing,
  isFocused,
  isSelected,
  isSearchMatch,
  isActiveSearchMatch,
  isChanged,
  readOnly,
  colorRuleBg,
  rowHeight,
  className,
  onClick: onClickProp,
  onKeyDown: onKeyDownProp,
  ref,
  ...props
}: DataGridCellWrapperProps<TData>) {
  const cellMapRef = tableMeta?.cellMapRef;
  const isCut = tableMeta?.getIsCellCut?.(rowIndex, columnId) ?? false;
  const showColorRule
    = !!colorRuleBg
      && !isSelected
      && !isSearchMatch
      && !isActiveSearchMatch
      && !isChanged
      && !isCut;

  const onCellChange = useCallback(
    (node: HTMLDivElement | null) => {
      if (!cellMapRef) return;

      const cellKey = getCellKey(rowIndex, columnId);

      if (node) {
        cellMapRef.current.set(cellKey, node);
      } else {
        cellMapRef.current.delete(cellKey);
      }
    },
    [rowIndex, columnId, cellMapRef]
  );

  const composedRef = useComposedRefs(ref, onCellChange);

  const onClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!isEditing) {
        event.preventDefault();
        onClickProp?.(event);
        if (isFocused && !readOnly) {
          tableMeta?.onCellEditingStart?.(rowIndex, columnId);
        } else {
          tableMeta?.onCellClick?.(rowIndex, columnId, event);
        }
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      isEditing,
      isFocused,
      readOnly,
      onClickProp
    ]
  );

  const onContextMenu = useCallback(
    (event: MouseEvent) => {
      if (!isEditing) {
        tableMeta?.onCellContextMenu?.(rowIndex, columnId, event);
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      isEditing
    ]
  );

  const onDoubleClick = useCallback(
    (event: MouseEvent) => {
      if (!isEditing) {
        event.preventDefault();
        tableMeta?.onCellDoubleClick?.(rowIndex, columnId);
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      isEditing
    ]
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (
        event.key === 'ArrowUp'
        || event.key === 'ArrowDown'
        || event.key === 'ArrowLeft'
        || event.key === 'ArrowRight'
        || event.key === 'Home'
        || event.key === 'End'
        || event.key === 'PageUp'
        || event.key === 'PageDown'
        || event.key === 'Tab'
      ) {
        onKeyDownProp?.(event);

        return;
      }

      if (isFocused && !isEditing && readOnly) {
        return;
      }

      onKeyDownProp?.(event);

      if (event.defaultPrevented) return;

      if (isFocused && !isEditing) {
        if (event.key === 'F2' || event.key === 'Enter') {
          event.preventDefault();
          event.stopPropagation();
          tableMeta?.onCellEditingStart?.(rowIndex, columnId);

          return;
        }

        if (event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          tableMeta?.onCellEditingStart?.(rowIndex, columnId);

          return;
        }

        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          event.stopPropagation();
          tableMeta?.onCellEditingStart?.(rowIndex, columnId);
        }
      }
    },
    [
      onKeyDownProp,
      isFocused,
      isEditing,
      readOnly,
      tableMeta,
      rowIndex,
      columnId
    ]
  );

  const onMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!isEditing) {
        tableMeta?.onCellMouseDown?.(rowIndex, columnId, event);
      }
    },
    [
      tableMeta,
      rowIndex,
      columnId,
      isEditing
    ]
  );

  const onMouseEnter = useCallback(() => {
    if (!isEditing) {
      tableMeta?.onCellMouseEnter?.(rowIndex, columnId);
    }
  }, [
    tableMeta,
    rowIndex,
    columnId,
    isEditing
  ]);

  const onMouseUp = useCallback(() => {
    if (!isEditing) {
      tableMeta?.onCellMouseUp?.();
    }
  }, [tableMeta, isEditing]);

  return (
    <div
      role="button"
      data-slot="grid-cell-wrapper"
      data-editing={isEditing ? '' : undefined}
      data-focused={isFocused ? '' : undefined}
      data-selected={isSelected ? '' : undefined}
      tabIndex={isFocused && !isEditing ? 0 : -1}
      {...props}
      ref={composedRef}
      className={cn(
        'relative size-full px-2 py-1.5 text-start text-sm outline-none has-data-[slot=checkbox]:pt-2.5',
        {
          'ring-1 ring-ring ring-inset': isFocused,
          'bg-amber-50 dark:bg-amber-900/20':
            isChanged
            && !isEditing
            && !isSearchMatch
            && !isActiveSearchMatch
            && !isSelected,
          'border-s-2 border-s-amber-400': isChanged && !isEditing,
          'bg-yellow-100 dark:bg-yellow-900/30':
            isSearchMatch && !isActiveSearchMatch,
          'bg-orange-200 dark:bg-orange-900/50': isActiveSearchMatch,
          'bg-primary/10': isSelected && !isEditing,
          'bg-primary/15 outline-1 outline-dashed outline-primary/70 outline-offset-[-3px]':
            isCut && !isEditing,
          'cursor-default': !isEditing,
          '**:data-[slot=grid-cell-content]:line-clamp-1':
            !isEditing && rowHeight === 'short',
          '**:data-[slot=grid-cell-content]:line-clamp-2':
            !isEditing && rowHeight === 'medium',
          '**:data-[slot=grid-cell-content]:line-clamp-3':
            !isEditing && rowHeight === 'tall',
          '**:data-[slot=grid-cell-content]:line-clamp-4':
            !isEditing && rowHeight === 'extra-tall'
        },
        className
      )}
      style={showColorRule ? { backgroundColor: colorRuleBg } : undefined}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseUp={onMouseUp}
      onKeyDown={onKeyDown} />
  );
}