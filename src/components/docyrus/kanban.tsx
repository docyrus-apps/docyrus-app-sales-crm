'use client';

import {
  type CSSProperties,
  type ComponentProps,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  type AnimateLayoutChanges,
  type SortableContextProps
} from '@dnd-kit/sortable';

import * as ReactDOM from 'react-dom';
import {
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCenter,
  closestCorners,
  defaultDropAnimationSideEffects,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  defaultAnimateLayoutChanges,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Slot } from '@radix-ui/react-slot';

import {
  type Announcements,
  type CollisionDetection,
  type DndContextProps,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DropAnimation,
  type DroppableContainer,
  type KeyboardCoordinateGetter,
  type UniqueIdentifier
} from '@dnd-kit/core';

import { useComposedRefs } from '@/lib/compose-refs';
import { cn } from '@/lib/utils';

const directions: Array<string> = [
  KeyboardCode.Down,
  KeyboardCode.Right,
  KeyboardCode.Up,
  KeyboardCode.Left
];

const coordinateGetter: KeyboardCoordinateGetter = (event, { context }) => {
  const {
    active, droppableRects, droppableContainers, collisionRect
  }
    = context;

  if (directions.includes(event.code)) {
    event.preventDefault();

    if (!active || !collisionRect) return;

    const filteredContainers: Array<DroppableContainer> = [];

    for (const entry of droppableContainers.getEnabled()) {
      if (!entry || entry?.disabled) return;

      const rect = droppableRects.get(entry.id);

      if (!rect) return;

      const data = entry.data.current;

      if (data) {
        const { type, children } = data;

        if (type === 'container' && children?.length > 0) {
          if (active.data.current?.type !== 'container') {
            return;
          }
        }
      }

      switch (event.code) {
        case KeyboardCode.Down:
          if (collisionRect.top < rect.top) {
            filteredContainers.push(entry);
          }
          break;

        case KeyboardCode.Up:
          if (collisionRect.top > rect.top) {
            filteredContainers.push(entry);
          }
          break;

        case KeyboardCode.Left:
          if (collisionRect.left >= rect.left + rect.width) {
            filteredContainers.push(entry);
          }
          break;

        case KeyboardCode.Right:
          if (collisionRect.left + collisionRect.width <= rect.left) {
            filteredContainers.push(entry);
          }
          break;
      }
    }

    const collisions = closestCorners({
      active,
      collisionRect,
      droppableRects,
      droppableContainers: filteredContainers,
      pointerCoordinates: null
    });
    const closestId = getFirstCollision(collisions, 'id');

    if (closestId != null) {
      const newDroppable = droppableContainers.get(closestId);
      const newNode = newDroppable?.node.current;
      const newRect = newDroppable?.rect.current;

      if (newNode && newRect) {
        if (newDroppable.id === 'placeholder') {
          return {
            x: newRect.left + (newRect.width - collisionRect.width) / 2,
            y: newRect.top + (newRect.height - collisionRect.height) / 2
          };
        }

        if (newDroppable.data.current?.type === 'container') {
          return {
            x: newRect.left + 20,
            y: newRect.top + 74
          };
        }

        return {
          x: newRect.left,
          y: newRect.top
        };
      }
    }
  }

  return undefined;
};

const ROOT_NAME = 'Kanban';
const BOARD_NAME = 'KanbanBoard';
const COLUMN_NAME = 'KanbanColumn';
const COLUMN_HANDLE_NAME = 'KanbanColumnHandle';
const ITEM_NAME = 'KanbanItem';
const ITEM_HANDLE_NAME = 'KanbanItemHandle';
const OVERLAY_NAME = 'KanbanOverlay';
const FINAL_ZONE_NAME = 'KanbanFinalZone';
const FINAL_COLUMN_NAME = 'KanbanFinalColumn';

interface KanbanContextValue<T> {
  id: string;
  items: Record<UniqueIdentifier, Array<T>>;
  modifiers: DndContextProps['modifiers'];
  strategy: SortableContextProps['strategy'];
  orientation: 'horizontal' | 'vertical';
  activeId: UniqueIdentifier | null;
  setActiveId: (id: UniqueIdentifier | null) => void;
  getItemValue: (item: T) => UniqueIdentifier;
  flatCursor: boolean;
  finalColumnIds: Set<UniqueIdentifier>;
  hoveredFinalColumn: UniqueIdentifier | null;
}

const KanbanContext = createContext<KanbanContextValue<unknown> | null>(null);

function useKanbanContext(consumerName: string) {
  const context = useContext(KanbanContext);

  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ROOT_NAME}\``);
  }

  return context;
}

interface GetItemValue<T> {
  getItemValue: (item: T) => UniqueIdentifier;
}

type KanbanProps<T> = Omit<DndContextProps, 'collisionDetection'>
  & (T extends object ? GetItemValue<T> : Partial<GetItemValue<T>>) & {
    value: Record<UniqueIdentifier, Array<T>>;
    onValueChange?: (columns: Record<UniqueIdentifier, Array<T>>) => void;
    onMove?: (
      event: DragEndEvent & { activeIndex: number; overIndex: number }
    ) => void;
    onFinalDrop?: (item: T, finalColumnId: UniqueIdentifier) => void;
    finalColumns?: Array<UniqueIdentifier>;
    strategy?: SortableContextProps['strategy'];
    orientation?: 'horizontal' | 'vertical';
    flatCursor?: boolean;
  };

function Kanban<T>(props: KanbanProps<T>) {
  const {
    value,
    onValueChange,
    onFinalDrop,
    finalColumns,
    modifiers,
    strategy = verticalListSortingStrategy,
    orientation = 'horizontal',
    onMove,
    getItemValue: getItemValueProp,
    accessibility,
    flatCursor = false,
    ...kanbanProps
  } = props;

  const {
    onDragStart: onDragStartProp,
    onDragOver: onDragOverProp,
    onDragEnd: onDragEndProp,
    onDragCancel: onDragCancelProp,
    ...restKanbanProps
  } = kanbanProps;

  const id = useId();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [hoveredFinalColumn, setHoveredFinalColumn]
    = useState<UniqueIdentifier | null>(null);
  const lastOverIdRef = useRef<UniqueIdentifier | null>(null);
  const hasMovedRef = useRef(false);
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter
    })
  );

  const finalColumnIds = useMemo(
    () => new Set<UniqueIdentifier>(finalColumns ?? []),
    [finalColumns]
  );

  const getItemValue = useCallback(
    (item: T): UniqueIdentifier => {
      if (typeof item === 'object' && !getItemValueProp) {
        throw new Error(
          '`getItemValue` is required when using array of objects'
        );
      }

      return getItemValueProp
        ? getItemValueProp(item)
        : (item as UniqueIdentifier);
    },
    [getItemValueProp]
  );

  const getColumn = useCallback(
    (id: UniqueIdentifier) => {
      if (id in value) return id;

      for (const [columnId, items] of Object.entries(value)) {
        if (items.some(item => getItemValue(item) === id)) {
          return columnId;
        }
      }

      return null;
    },
    [value, getItemValue]
  );

  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      if (activeId && activeId in value) {
        return closestCenter({
          ...args,
          droppableContainers: args.droppableContainers.filter(
            container => container.id in value
          )
        });
      }

      const pointerIntersections = pointerWithin(args);
      const intersections
        = pointerIntersections.length > 0
          ? pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, 'id');

      if (!overId) {
        if (hasMovedRef.current) {
          lastOverIdRef.current = activeId;
        }

        return lastOverIdRef.current ? [{ id: lastOverIdRef.current }] : [];
      }

      if (overId in value) {
        const containerItems = value[overId];

        if (containerItems && containerItems.length > 0) {
          const closestItem = closestCenter({
            ...args,
            droppableContainers: args.droppableContainers.filter(
              container => container.id !== overId
                && containerItems.some(
                  item => getItemValue(item) === container.id
                )
            )
          });

          if (closestItem.length > 0) {
            overId = closestItem[0]?.id ?? overId;
          }
        }
      }

      lastOverIdRef.current = overId;

      return [{ id: overId }];
    },
    [activeId, value, getItemValue]
  );

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      onDragStartProp?.(event);

      if (event.activatorEvent.defaultPrevented) return;
      setActiveId(event.active.id);
    },
    [onDragStartProp]
  );

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      onDragOverProp?.(event);

      if (event.activatorEvent.defaultPrevented) return;

      const { active, over } = event;

      if (!over) {
        setHoveredFinalColumn(null);

        return;
      }

      if (finalColumnIds.has(over.id)) {
        setHoveredFinalColumn(over.id);

        return;
      }
      setHoveredFinalColumn(null);

      const activeColumn = getColumn(active.id);
      const overColumn = getColumn(over.id);

      if (!activeColumn || !overColumn) return;

      if (activeColumn === overColumn) {
        const items = value[activeColumn];

        if (!items) return;

        const activeIndex = items.findIndex(
          item => getItemValue(item) === active.id
        );
        const overIndex = items.findIndex(
          item => getItemValue(item) === over.id
        );

        if (activeIndex !== overIndex) {
          const newColumns = { ...value };

          newColumns[activeColumn] = arrayMove(items, activeIndex, overIndex);
          onValueChange?.(newColumns);
        }
      } else {
        const activeItems = value[activeColumn];
        const overItems = value[overColumn];

        if (!activeItems || !overItems) return;

        const activeIndex = activeItems.findIndex(
          item => getItemValue(item) === active.id
        );

        if (activeIndex === -1) return;

        const activeItem = activeItems[activeIndex];

        if (!activeItem) return;

        const updatedItems = {
          ...value,
          [activeColumn]: activeItems.filter(
            item => getItemValue(item) !== active.id
          ),
          [overColumn]: [...overItems, activeItem]
        };

        onValueChange?.(updatedItems);
        hasMovedRef.current = true;
      }
    },
    [
      value,
      getColumn,
      getItemValue,
      onValueChange,
      finalColumnIds,
      onDragOverProp
    ]
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      onDragEndProp?.(event);

      if (event.activatorEvent.defaultPrevented) return;

      const { active, over } = event;

      setHoveredFinalColumn(null);

      if (!over) {
        setActiveId(null);

        return;
      }

      if (finalColumnIds.has(over.id)) {
        const activeColumn = getColumn(active.id);

        if (activeColumn) {
          const items = value[activeColumn];
          const activeItem = items?.find(
            item => getItemValue(item) === active.id
          );

          if (activeItem && items) {
            const newColumns = { ...value };

            newColumns[activeColumn] = items.filter(
              item => getItemValue(item) !== active.id
            );
            onValueChange?.(newColumns);
            onFinalDrop?.(activeItem, over.id);
          }
        }
        setActiveId(null);
        hasMovedRef.current = false;

        return;
      }

      if (active.id in value && over.id in value) {
        const activeIndex = Object.keys(value).indexOf(active.id as string);
        const overIndex = Object.keys(value).indexOf(over.id as string);

        if (activeIndex !== overIndex) {
          const orderedColumns = Object.keys(value);
          const newOrder = arrayMove(orderedColumns, activeIndex, overIndex);

          const newColumns: Record<UniqueIdentifier, Array<T>> = {};

          for (const key of newOrder) {
            const items = value[key];

            if (items) {
              newColumns[key] = items;
            }
          }

          if (onMove) {
            onMove({ ...event, activeIndex, overIndex });
          } else {
            onValueChange?.(newColumns);
          }
        }
      } else {
        const activeColumn = getColumn(active.id);
        const overColumn = getColumn(over.id);

        if (!activeColumn || !overColumn) {
          setActiveId(null);

          return;
        }

        if (activeColumn === overColumn) {
          const items = value[activeColumn];

          if (!items) {
            setActiveId(null);

            return;
          }

          const activeIndex = items.findIndex(
            item => getItemValue(item) === active.id
          );
          const overIndex = items.findIndex(
            item => getItemValue(item) === over.id
          );

          if (activeIndex !== overIndex) {
            const newColumns = { ...value };

            newColumns[activeColumn] = arrayMove(items, activeIndex, overIndex);
            if (onMove) {
              onMove({
                ...event,
                activeIndex,
                overIndex
              });
            } else {
              onValueChange?.(newColumns);
            }
          }
        }
      }

      setActiveId(null);
      hasMovedRef.current = false;
    },
    [
      value,
      getColumn,
      getItemValue,
      onValueChange,
      onMove,
      onFinalDrop,
      finalColumnIds,
      onDragEndProp
    ]
  );

  const onDragCancel = useCallback(
    (event: DragCancelEvent) => {
      onDragCancelProp?.(event);

      if (event.activatorEvent.defaultPrevented) return;

      setActiveId(null);
      setHoveredFinalColumn(null);
      hasMovedRef.current = false;
    },
    [onDragCancelProp]
  );

  const announcements: Announcements = useMemo(
    () => ({
      onDragStart({ active }) {
        const isColumn = active.id in value;
        const itemType = isColumn ? 'column' : 'item';
        const position = isColumn
          ? Object.keys(value).indexOf(active.id as string) + 1
          : (() => {
              const column = getColumn(active.id);

              if (!column || !value[column]) return 1;

              return (
                value[column].findIndex(
                  item => getItemValue(item) === active.id
                ) + 1
              );
            })();
        const total = isColumn
          ? Object.keys(value).length
          : (() => {
              const column = getColumn(active.id);

              return column ? (value[column]?.length ?? 0) : 0;
            })();

        return `Picked up ${itemType} at position ${position} of ${total}`;
      },
      onDragOver({ active, over }) {
        if (!over) return;

        if (finalColumnIds.has(over.id)) {
          return `Item is over final drop zone`;
        }

        const isColumn = active.id in value;
        const itemType = isColumn ? 'column' : 'item';
        const position = isColumn
          ? Object.keys(value).indexOf(over.id as string) + 1
          : (() => {
              const column = getColumn(over.id);

              if (!column || !value[column]) return 1;

              return (
                value[column].findIndex(
                  item => getItemValue(item) === over.id
                ) + 1
              );
            })();
        const total = isColumn
          ? Object.keys(value).length
          : (() => {
              const column = getColumn(over.id);

              return column ? (value[column]?.length ?? 0) : 0;
            })();

        const overColumn = getColumn(over.id);
        const activeColumn = getColumn(active.id);

        if (isColumn) {
          return `${itemType} is now at position ${position} of ${total}`;
        }

        if (activeColumn !== overColumn) {
          return `${itemType} is now at position ${position} of ${total} in ${overColumn}`;
        }

        return `${itemType} is now at position ${position} of ${total}`;
      },
      onDragEnd({ active, over }) {
        if (!over) return;

        if (finalColumnIds.has(over.id)) {
          return `Item was dropped into final status`;
        }

        const isColumn = active.id in value;
        const itemType = isColumn ? 'column' : 'item';
        const position = isColumn
          ? Object.keys(value).indexOf(over.id as string) + 1
          : (() => {
              const column = getColumn(over.id);

              if (!column || !value[column]) return 1;

              return (
                value[column].findIndex(
                  item => getItemValue(item) === over.id
                ) + 1
              );
            })();
        const total = isColumn
          ? Object.keys(value).length
          : (() => {
              const column = getColumn(over.id);

              return column ? (value[column]?.length ?? 0) : 0;
            })();

        const overColumn = getColumn(over.id);
        const activeColumn = getColumn(active.id);

        if (isColumn) {
          return `${itemType} was dropped at position ${position} of ${total}`;
        }

        if (activeColumn !== overColumn) {
          return `${itemType} was dropped at position ${position} of ${total} in ${overColumn}`;
        }

        return `${itemType} was dropped at position ${position} of ${total}`;
      },
      onDragCancel({ active }) {
        const isColumn = active.id in value;
        const itemType = isColumn ? 'column' : 'item';

        return `Dragging was cancelled. ${itemType} was dropped.`;
      }
    }),
    [
      value,
      getColumn,
      getItemValue,
      finalColumnIds
    ]
  );

  const contextValue = useMemo<KanbanContextValue<T>>(
    () => ({
      id,
      items: value,
      modifiers,
      strategy,
      orientation,
      activeId,
      setActiveId,
      getItemValue,
      flatCursor,
      finalColumnIds,
      hoveredFinalColumn
    }),
    [
      id,
      value,
      activeId,
      modifiers,
      strategy,
      orientation,
      getItemValue,
      flatCursor,
      finalColumnIds,
      hoveredFinalColumn
    ]
  );

  return (
    <KanbanContext.Provider
      value={contextValue as KanbanContextValue<unknown>}>
      <DndContext
        collisionDetection={collisionDetection}
        modifiers={modifiers}
        sensors={sensors}
        {...restKanbanProps}
        id={id}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always
          }
        }}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable: `
            To pick up a kanban item or column, press space or enter.
            While dragging, use the arrow keys to move the item.
            Press space or enter again to drop the item in its new position, or press escape to cancel.
          `
          },
          ...accessibility
        }} />
    </KanbanContext.Provider>
  );
}

const KanbanBoardContext = createContext<boolean>(false);

interface KanbanBoardProps extends ComponentProps<'div'> {
  children: ReactNode;
  asChild?: boolean;
}

function KanbanBoard(props: KanbanBoardProps) {
  const {
    asChild, className, ref, ...boardProps
  } = props;

  const context = useKanbanContext(BOARD_NAME);

  const columns = useMemo(() => {
    return Object.keys(context.items);
  }, [context.items]);

  const BoardPrimitive = asChild ? Slot : 'div';

  return (
    <KanbanBoardContext.Provider value>
      <SortableContext
        items={columns}
        strategy={
          context.orientation === 'horizontal'
            ? horizontalListSortingStrategy
            : verticalListSortingStrategy
        }>
        <BoardPrimitive
          aria-orientation={context.orientation}
          data-orientation={context.orientation}
          data-slot="kanban-board"
          {...boardProps}
          ref={ref}
          className={cn(
            'flex size-full gap-4',
            context.orientation === 'horizontal' ? 'flex-row' : 'flex-col',
            className
          )} />
      </SortableContext>
    </KanbanBoardContext.Provider>
  );
}

interface KanbanColumnContextValue {
  id: string;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners | undefined;
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  isDragging?: boolean;
  disabled?: boolean;
}

const KanbanColumnContext = createContext<KanbanColumnContextValue | null>(null);

function useKanbanColumnContext(consumerName: string) {
  const context = useContext(KanbanColumnContext);

  if (!context) {
    throw new Error(
      `\`${consumerName}\` must be used within \`${COLUMN_NAME}\``
    );
  }

  return context;
}

const animateLayoutChanges: AnimateLayoutChanges = args => defaultAnimateLayoutChanges({ ...args, wasDragging: true });

interface KanbanColumnProps extends ComponentProps<'div'> {
  value: UniqueIdentifier;
  children: ReactNode;
  asChild?: boolean;
  asHandle?: boolean;
  disabled?: boolean;
}

function KanbanColumn(props: KanbanColumnProps) {
  const {
    value,
    asChild,
    asHandle,
    disabled,
    className,
    style,
    ref,
    ...columnProps
  } = props;

  const id = useId();
  const context = useKanbanContext(COLUMN_NAME);
  const inBoard = useContext(KanbanBoardContext);
  const inOverlay = useContext(KanbanOverlayContext);

  if (!inBoard && !inOverlay) {
    throw new Error(
      `\`${COLUMN_NAME}\` must be used within \`${BOARD_NAME}\` or \`${OVERLAY_NAME}\``
    );
  }

  if (value === '') {
    throw new Error(`\`${COLUMN_NAME}\` value cannot be an empty string`);
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: value,
    disabled,
    animateLayoutChanges
  });

  const composedRef = useComposedRefs(ref, (node: HTMLElement | null) => {
    if (disabled) return;
    setNodeRef(node);
  });

  const composedStyle = useMemo<CSSProperties>(() => {
    return {
      transform: CSS.Transform.toString(transform),
      transition,
      ...style
    };
  }, [transform, transition, style]);

  const { items: contextItems, getItemValue: contextGetItemValue } = context;

  const items = useMemo(() => {
    const columnItems = contextItems[value] ?? [];

    return columnItems.map(item => contextGetItemValue(item));
  }, [contextItems, value, contextGetItemValue]);

  const columnContext = useMemo<KanbanColumnContextValue>(
    () => ({
      id,
      attributes,
      listeners,
      setActivatorNodeRef,
      isDragging,
      disabled
    }),
    [
      id,
      attributes,
      listeners,
      setActivatorNodeRef,
      isDragging,
      disabled
    ]
  );

  const ColumnPrimitive = asChild ? Slot : 'div';

  return (
    <KanbanColumnContext.Provider value={columnContext}>
      <SortableContext
        items={items}
        strategy={
          context.orientation === 'horizontal'
            ? horizontalListSortingStrategy
            : verticalListSortingStrategy
        }>
        <ColumnPrimitive
          id={id}
          data-disabled={disabled}
          data-dragging={isDragging ? '' : undefined}
          data-slot="kanban-column"
          {...columnProps}
          {...(asHandle && !disabled ? attributes : {})}
          {...(asHandle && !disabled ? listeners : {})}
          ref={composedRef}
          style={composedStyle}
          className={cn(
            'flex size-full flex-col gap-2 rounded-lg border bg-zinc-100 p-2.5 aria-disabled:pointer-events-none aria-disabled:opacity-50 dark:bg-zinc-900',
            {
              'touch-none select-none': asHandle,
              'cursor-default': context.flatCursor,
              'data-dragging:cursor-grabbing': !context.flatCursor,
              'cursor-grab': !isDragging && asHandle && !context.flatCursor,
              'opacity-50': isDragging,
              'pointer-events-none opacity-50': disabled
            },
            className
          )} />
      </SortableContext>
    </KanbanColumnContext.Provider>
  );
}

interface KanbanColumnHandleProps extends ComponentProps<'button'> {
  asChild?: boolean;
}

function KanbanColumnHandle(props: KanbanColumnHandleProps) {
  const {
    asChild, disabled, className, ref, ...columnHandleProps
  } = props;

  const context = useKanbanContext(COLUMN_NAME);
  const columnContext = useKanbanColumnContext(COLUMN_HANDLE_NAME);

  const isDisabled = disabled ?? columnContext.disabled;

  const composedRef = useComposedRefs(ref, (node: HTMLElement | null) => {
    if (isDisabled) return;
    columnContext.setActivatorNodeRef(node);
  });

  const HandlePrimitive = asChild ? Slot : 'button';

  return (
    <HandlePrimitive
      type="button"
      aria-controls={columnContext.id}
      data-disabled={isDisabled}
      data-dragging={columnContext.isDragging ? '' : undefined}
      data-slot="kanban-column-handle"
      {...columnHandleProps}
      {...(isDisabled ? {} : columnContext.attributes)}
      {...(isDisabled ? {} : columnContext.listeners)}
      ref={composedRef}
      className={cn(
        'select-none disabled:pointer-events-none disabled:opacity-50',
        context.flatCursor
          ? 'cursor-default'
          : 'cursor-grab data-dragging:cursor-grabbing',
        className
      )}
      disabled={isDisabled} />
  );
}

interface KanbanItemContextValue {
  id: string;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners | undefined;
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  isDragging?: boolean;
  disabled?: boolean;
}

const KanbanItemContext = createContext<KanbanItemContextValue | null>(null);

function useKanbanItemContext(consumerName: string) {
  const context = useContext(KanbanItemContext);

  if (!context) {
    throw new Error(`\`${consumerName}\` must be used within \`${ITEM_NAME}\``);
  }

  return context;
}

interface KanbanItemProps extends ComponentProps<'div'> {
  value: UniqueIdentifier;
  asHandle?: boolean;
  asChild?: boolean;
  disabled?: boolean;
}

function KanbanItem(props: KanbanItemProps) {
  const {
    value,
    style,
    asHandle,
    asChild,
    disabled,
    className,
    ref,
    ...itemProps
  } = props;

  const id = useId();
  const context = useKanbanContext(ITEM_NAME);
  const inBoard = useContext(KanbanBoardContext);
  const inOverlay = useContext(KanbanOverlayContext);

  if (!inBoard && !inOverlay) {
    throw new Error(`\`${ITEM_NAME}\` must be used within \`${BOARD_NAME}\``);
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: value, disabled });

  if (value === '') {
    throw new Error(`\`${ITEM_NAME}\` value cannot be an empty string`);
  }

  const composedRef = useComposedRefs(ref, (node: HTMLElement | null) => {
    if (disabled) return;
    setNodeRef(node);
  });

  const composedStyle = useMemo<CSSProperties>(() => {
    return {
      transform: CSS.Transform.toString(transform),
      transition,
      ...style
    };
  }, [transform, transition, style]);

  const itemContext = useMemo<KanbanItemContextValue>(
    () => ({
      id,
      attributes,
      listeners,
      setActivatorNodeRef,
      isDragging,
      disabled
    }),
    [
      id,
      attributes,
      listeners,
      setActivatorNodeRef,
      isDragging,
      disabled
    ]
  );

  const ItemPrimitive = asChild ? Slot : 'div';

  return (
    <KanbanItemContext.Provider value={itemContext}>
      <ItemPrimitive
        id={id}
        data-disabled={disabled}
        data-dragging={isDragging ? '' : undefined}
        data-slot="kanban-item"
        {...itemProps}
        {...(asHandle && !disabled ? attributes : {})}
        {...(asHandle && !disabled ? listeners : {})}
        ref={composedRef}
        style={composedStyle}
        className={cn(
          'focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1',
          {
            'touch-none select-none': asHandle,
            'cursor-default': context.flatCursor,
            'data-dragging:cursor-grabbing': !context.flatCursor,
            'cursor-grab': !isDragging && asHandle && !context.flatCursor,
            'opacity-50': isDragging,
            'pointer-events-none opacity-50': disabled
          },
          className
        )} />
    </KanbanItemContext.Provider>
  );
}

interface KanbanItemHandleProps extends ComponentProps<'button'> {
  asChild?: boolean;
}

function KanbanItemHandle(props: KanbanItemHandleProps) {
  const {
    asChild, disabled, className, ref, ...itemHandleProps
  } = props;

  const context = useKanbanContext(ITEM_HANDLE_NAME);
  const itemContext = useKanbanItemContext(ITEM_HANDLE_NAME);

  const isDisabled = disabled ?? itemContext.disabled;

  const composedRef = useComposedRefs(ref, (node: HTMLElement | null) => {
    if (isDisabled) return;
    itemContext.setActivatorNodeRef(node);
  });

  const HandlePrimitive = asChild ? Slot : 'button';

  return (
    <HandlePrimitive
      type="button"
      aria-controls={itemContext.id}
      data-disabled={isDisabled}
      data-dragging={itemContext.isDragging ? '' : undefined}
      data-slot="kanban-item-handle"
      {...itemHandleProps}
      {...(isDisabled ? {} : itemContext.attributes)}
      {...(isDisabled ? {} : itemContext.listeners)}
      ref={composedRef}
      className={cn(
        'select-none disabled:pointer-events-none disabled:opacity-50',
        context.flatCursor
          ? 'cursor-default'
          : 'cursor-grab data-dragging:cursor-grabbing',
        className
      )}
      disabled={isDisabled} />
  );
}

interface KanbanFinalZoneProps extends ComponentProps<'div'> {
  asChild?: boolean;
}

function KanbanFinalZone(props: KanbanFinalZoneProps) {
  const {
    asChild, className, ref, ...zoneProps
  } = props;

  const context = useKanbanContext(FINAL_ZONE_NAME);

  const isDraggingItem = !!context.activeId && !(context.activeId in context.items);

  const ZonePrimitive = asChild ? Slot : 'div';

  return (
    <ZonePrimitive
      data-slot="kanban-final-zone"
      data-dragging={isDraggingItem ? '' : undefined}
      {...zoneProps}
      ref={ref}
      className={cn('flex gap-3', className)} />
  );
}

interface KanbanFinalColumnProps extends ComponentProps<'div'> {
  value: UniqueIdentifier;
  asChild?: boolean;
}

function KanbanFinalColumn(props: KanbanFinalColumnProps) {
  const {
    value, asChild, className, ref, ...columnProps
  } = props;

  const context = useKanbanContext(FINAL_COLUMN_NAME);
  const { setNodeRef, isOver } = useDroppable({ id: value });

  const composedRef = useComposedRefs(ref, setNodeRef);

  if (value === '') {
    throw new Error(
      `\`${FINAL_COLUMN_NAME}\` value cannot be an empty string`
    );
  }

  const isHovered = context.hoveredFinalColumn === value;
  const isDraggingItem = !!context.activeId && !(context.activeId in context.items);

  const ColumnPrimitive = asChild ? Slot : 'div';

  return (
    <ColumnPrimitive
      data-slot="kanban-final-column"
      data-over={isOver || isHovered ? '' : undefined}
      data-dragging={isDraggingItem ? '' : undefined}
      {...columnProps}
      ref={composedRef}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-3 transition-all duration-300 ease-in-out',
        isDraggingItem ? 'p-6' : '',
        isOver || isHovered ? 'scale-[1.02]' : '',
        className
      )} />
  );
}

const KanbanOverlayContext = createContext(false);

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4'
      }
    }
  })
};

interface KanbanOverlayProps
  extends Omit<ComponentProps<typeof DragOverlay>, 'children'> {
  container?: Element | DocumentFragment | null;
  children?:
    | ReactNode
    | ((params: {
      value: UniqueIdentifier;
      variant: 'column' | 'item';
    }) => ReactNode);
}

function KanbanOverlay(props: KanbanOverlayProps) {
  const { container: containerProp, children, ...overlayProps } = props;

  const context = useKanbanContext(OVERLAY_NAME);

  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => setMounted(true), []);

  const container
    = containerProp ?? (mounted ? globalThis.document?.body : null);

  if (!container) return null;

  const variant
    = context.activeId && context.activeId in context.items ? 'column' : 'item';

  return ReactDOM.createPortal(
    <DragOverlay
      dropAnimation={dropAnimation}
      modifiers={context.modifiers}
      className={cn(!context.flatCursor && 'cursor-grabbing')}
      {...overlayProps}>
      <KanbanOverlayContext.Provider value>
        {context.activeId && children
          ? typeof children === 'function'
            ? children({
                value: context.activeId,
                variant
              })
            : children
          : null}
      </KanbanOverlayContext.Provider>
    </DragOverlay>,
    container
  );
}

export {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnHandle,
  KanbanFinalColumn,
  KanbanFinalZone,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  type KanbanProps
};