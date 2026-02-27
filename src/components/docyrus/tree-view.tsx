'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject
} from 'react';

import {
  ChevronDown, ChevronRight, EllipsisVertical, Search, X
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cva, type VariantProps } from 'class-variance-authority';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  CVA Variants                                                       */
/* ------------------------------------------------------------------ */

const treeViewVariants = cva('rounded-lg border bg-card', {
  variants: {
    variant: {
      default: 'border-border',
      outline: 'border-2 border-border',
      ghost: 'border-transparent shadow-none'
    },
    size: {
      sm: 'text-xs',
      default: 'text-sm',
      lg: 'text-base'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'default'
  }
});

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TreeViewItem {
  id: string;
  name: string;
  type: string;
  children?: TreeViewItem[];
  checked?: boolean;
}

export interface TreeViewIconMap {
  [key: string]: ReactNode | undefined;
}

export interface TreeViewMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  action: (items: TreeViewItem[]) => void;
}

export type TreeViewCheckboxPosition = 'left' | 'right';

export interface TreeViewProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
  VariantProps<typeof treeViewVariants> {
  /** Tree data. */
  data: TreeViewItem[];
  /** Show expand / collapse all buttons. */
  showExpandAll?: boolean;
  /** Show checkboxes next to items. */
  showCheckboxes?: boolean;
  /** Position of checkboxes. */
  checkboxPosition?: TreeViewCheckboxPosition;
  /** Search input placeholder text. */
  searchPlaceholder?: string;
  /** Text appended after selection count, e.g. "3 selected". */
  selectionText?: string;
  /** Labels for bulk check / uncheck buttons. */
  checkboxLabels?: { check: string; uncheck: string };
  /** Custom icon renderer. */
  getIcon?: (item: TreeViewItem, depth: number) => ReactNode;
  /** Called when the set of selected items changes. */
  onSelectionChange?: (selectedItems: TreeViewItem[]) => void;
  /** Called when a context-menu action fires. */
  onAction?: (action: string, items: TreeViewItem[]) => void;
  /** Called when a checkbox state changes. */
  onCheckChange?: (item: TreeViewItem, checked: boolean) => void;
  /** Map of item type → icon node. */
  iconMap?: TreeViewIconMap;
  /** Context-menu items. */
  menuItems?: TreeViewMenuItem[];
  /** Show hover-card info tooltips on items. */
  showInfo?: boolean;
  /** Maximum height before scrolling (e.g. "400px"). */
  maxHeight?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const buildItemMap = (items: TreeViewItem[]): Map<string, TreeViewItem> => {
  const map = new Map<string, TreeViewItem>();
  const walk = (item: TreeViewItem) => {
    map.set(item.id, item);
    item.children?.forEach(walk);
  };

  items.forEach(walk);

  return map;
};

const getCheckState = (
  item: TreeViewItem,
  itemMap: Map<string, TreeViewItem>
): 'checked' | 'unchecked' | 'indeterminate' => {
  const orig = itemMap.get(item.id);

  if (!orig) return 'unchecked';
  if (!orig.children || orig.children.length === 0) {
    return orig.checked ? 'checked' : 'unchecked';
  }
  let checkedCount = 0;
  let indeterminateCount = 0;

  orig.children.forEach((child) => {
    const s = getCheckState(child, itemMap);

    if (s === 'checked') checkedCount++;
    if (s === 'indeterminate') indeterminateCount++;
  });
  if (checkedCount === orig.children.length) return 'checked';
  if (checkedCount > 0 || indeterminateCount > 0) return 'indeterminate';

  return 'unchecked';
};

const getAllFolderIds = (items: TreeViewItem[]): string[] => {
  const ids: string[] = [];
  const walk = (item: TreeViewItem) => {
    if (item.children) {
      ids.push(item.id);
      item.children.forEach(walk);
    }
  };

  items.forEach(walk);

  return ids;
};

const getItemPath = (item: TreeViewItem, rootItems: TreeViewItem[]): string => {
  const path: string[] = [item.name];
  const findParent = (cur: TreeViewItem, list: TreeViewItem[]) => {
    for (const p of list) {
      if (p.children?.some(c => c.id === cur.id)) {
        path.unshift(p.name);
        findParent(p, rootItems);

        return;
      }
      if (p.children) findParent(cur, p.children);
    }
  };

  findParent(item, rootItems);

  return path.join(' \u2192 ');
};

/* ------------------------------------------------------------------ */
/*  Default icon map                                                   */
/* ------------------------------------------------------------------ */

const defaultIconMap: TreeViewIconMap = {};

/* ------------------------------------------------------------------ */
/*  TreeItem (internal)                                                */
/* ------------------------------------------------------------------ */

interface TreeItemInternalProps {
  item: TreeViewItem;
  depth: number;
  selectedIds: Set<string>;
  lastSelectedId: RefObject<string | null>;
  onSelect: (ids: Set<string>) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string, open: boolean) => void;
  getIcon?: (item: TreeViewItem, depth: number) => ReactNode;
  onAction?: (action: string, items: TreeViewItem[]) => void;
  onCheckChange?: (item: TreeViewItem, checked: boolean) => void;
  allItems: TreeViewItem[];
  showCheckboxes: boolean;
  checkboxPosition: TreeViewCheckboxPosition;
  itemMap: Map<string, TreeViewItem>;
  iconMap: TreeViewIconMap;
  menuItems?: TreeViewMenuItem[];
  getSelectedItems: () => TreeViewItem[];
  showInfo: boolean;
  itemSize: 'sm' | 'default' | 'lg';
}

function TreeItemInternal({
  item,
  depth,
  selectedIds,
  lastSelectedId,
  onSelect,
  expandedIds,
  onToggleExpand,
  getIcon,
  onAction,
  onCheckChange,
  allItems,
  showCheckboxes,
  checkboxPosition,
  itemMap,
  iconMap,
  menuItems,
  getSelectedItems,
  showInfo,
  itemSize
}: TreeItemInternalProps) {
  const isOpen = expandedIds.has(item.id);
  const isSelected = selectedIds.has(item.id);
  const itemRef = useRef<HTMLDivElement>(null);
  const [selectionStyle, setSelectionStyle] = useState('');

  const getVisibleItems = useCallback(
    (items: TreeViewItem[]): TreeViewItem[] => {
      const visible: TreeViewItem[] = [];

      for (const it of items) {
        visible.push(it);
        if (it.children && expandedIds.has(it.id)) {
          visible.push(...getVisibleItems(it.children));
        }
      }

      return visible;
    },
    [expandedIds]
  );

  useEffect(() => {
    if (!isSelected) {
      setSelectionStyle('');

      return;
    }
    const visibleItems = getVisibleItems(allItems);
    const idx = visibleItems.findIndex(i => i.id === item.id);
    const prev = visibleItems[idx - 1];
    const next = visibleItems[idx + 1];
    const prevSel = prev && selectedIds.has(prev.id);
    const nextSel = next && selectedIds.has(next.id);

    setSelectionStyle(
      `${!prevSel ? 'rounded-t-md' : ''} ${!nextSel ? 'rounded-b-md' : ''}`
    );
  }, [
    isSelected,
    selectedIds,
    expandedIds,
    item.id,
    getVisibleItems,
    allItems
  ]);

  const handleClick = (e: ReactMouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    let newSel = new Set(selectedIds);

    if (!itemRef.current) return;

    if (e.shiftKey && lastSelectedId.current !== null) {
      const items = Array.from(
        document.querySelectorAll('[data-tree-item]')
      ) as HTMLElement[];
      const lastIdx = items.findIndex(
        el => el.getAttribute('data-id') === lastSelectedId.current
      );
      const curIdx = items.findIndex(el => el === itemRef.current);
      const [start, end] = [Math.min(lastIdx, curIdx), Math.max(lastIdx, curIdx)];

      items.slice(start, end + 1).forEach((el) => {
        const id = el.getAttribute('data-id');
        const parentClosed = el.closest('[data-folder-closed="true"]');
        const isClosed = el.getAttribute('data-folder-closed') === 'true';

        if (id && (isClosed || !parentClosed)) newSel.add(id);
      });
    } else if (e.ctrlKey || e.metaKey) {
      if (newSel.has(item.id)) newSel.delete(item.id);
      else newSel.add(item.id);
    } else {
      newSel = new Set([item.id]);
      if (item.children && isSelected) onToggleExpand(item.id, !isOpen);
    }

    lastSelectedId.current = item.id;
    onSelect(newSel);
  };

  const handleCheckClick = (e: ReactMouseEvent) => {
    e.stopPropagation();
    if (!onCheckChange) return;
    const state = getCheckState(item, itemMap);
    const next = state !== 'checked';

    onCheckChange(item, next);
  };

  const renderIcon = () => {
    if (getIcon) return getIcon(item, depth);

    return iconMap[item.type] || null;
  };

  const getSelectedChildrenCount = (it: TreeViewItem): number => {
    if (!it.children) return 0;
    let count = 0;

    it.children.forEach((c) => {
      if (selectedIds.has(c.id)) count++;
      if (c.children) count += getSelectedChildrenCount(c);
    });

    return count;
  };

  const selectedCount
    = item.children && !isOpen ? getSelectedChildrenCount(item) : null;

  const heightClass = itemSize === 'sm' ? 'h-7' : itemSize === 'lg' ? 'h-10' : 'h-8';
  const iconSize = itemSize === 'sm' ? 'size-3.5' : itemSize === 'lg' ? 'size-5' : 'size-4';
  const chevronBtnSize = itemSize === 'sm' ? 'h-5 w-5' : itemSize === 'lg' ? 'h-7 w-7' : 'h-6 w-6';

  const checkboxEl = showCheckboxes ? (
    <div
      className="flex items-center justify-center shrink-0"
      onClick={handleCheckClick}
      role="button"
      tabIndex={-1}>
      {item.children ? (
        (() => {
          const state = getCheckState(item, itemMap);

          return (
            <Checkbox
              checked={state === 'checked' ? true : state === 'indeterminate' ? 'indeterminate' : false}
              className="pointer-events-none" />
          );
        })()
      ) : (
        <Checkbox
          checked={!!item.checked}
          className="pointer-events-none" />
      )}
    </div>
  ) : null;

  const infoEl = showInfo ? (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(chevronBtnSize, 'p-0 opacity-0 group-hover/item:opacity-100')}
          onClick={e => e.stopPropagation()}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn(iconSize, 'text-muted-foreground')}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-72" side="right">
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">{item.name}</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <div>
              <span className="font-medium">Type:</span>{' '}
              {item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('_', ' ')}
            </div>
            <div>
              <span className="font-medium">ID:</span> {item.id}
            </div>
            <div>
              <span className="font-medium">Location:</span>{' '}
              {getItemPath(item, allItems)}
            </div>
            {item.children ? (
              <div>
                <span className="font-medium">Items:</span>{' '}
                {item.children.length} direct items
              </div>
            ) : null}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ) : null;

  const content = (
    <div>
      <div
        ref={itemRef}
        data-tree-item
        data-id={item.id}
        data-depth={depth}
        data-folder-closed={item.children && !isOpen}
        className={cn(
          'group/item select-none cursor-pointer px-1',
          isSelected ? `bg-primary/10 ${selectionStyle}` : 'hover:bg-muted/50'
        )}
        style={{ paddingLeft: `${depth * 20}px` }}
        onClick={handleClick}>
        <div className={cn('flex items-center gap-1', heightClass)}>
          {item.children ? (
            <>
              <Collapsible
                open={isOpen}
                onOpenChange={open => onToggleExpand(item.id, open)}>
                <CollapsibleTrigger
                  asChild
                  onClick={e => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className={cn(chevronBtnSize, 'shrink-0')}>
                    <motion.div
                      initial={false}
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={{ duration: 0.1 }}>
                      <ChevronRight className={iconSize} />
                    </motion.div>
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
              {checkboxPosition === 'left' && checkboxEl}
              <span className="shrink-0">{renderIcon()}</span>
              <span className="flex-1 truncate">{item.name}</span>
              {selectedCount != null && selectedCount > 0 ? (
                <Badge variant="secondary" className="mr-1 text-[10px] px-1.5 py-0">
                  {selectedCount}
                </Badge>
              ) : null}
              {checkboxPosition === 'right' && checkboxEl}
              {infoEl}
            </>
          ) : (
            <>
              <span className={cn(chevronBtnSize, 'shrink-0')} />
              {checkboxPosition === 'left' && checkboxEl}
              <span className="shrink-0">{renderIcon()}</span>
              <span className="flex-1 truncate">{item.name}</span>
              {checkboxPosition === 'right' && checkboxEl}
              {infoEl}
            </>
          )}
        </div>
      </div>

      {item.children ? (
        <Collapsible
          open={isOpen}
          onOpenChange={open => onToggleExpand(item.id, open)}>
          <AnimatePresence initial={false}>
            {isOpen ? (
              <CollapsibleContent forceMount asChild>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.05 }}>
                  {item.children.map(child => (
                    <TreeItemInternal
                      key={child.id}
                      item={child}
                      depth={depth + 1}
                      selectedIds={selectedIds}
                      lastSelectedId={lastSelectedId}
                      onSelect={onSelect}
                      expandedIds={expandedIds}
                      onToggleExpand={onToggleExpand}
                      getIcon={getIcon}
                      onAction={onAction}
                      onCheckChange={onCheckChange}
                      allItems={allItems}
                      showCheckboxes={showCheckboxes}
                      checkboxPosition={checkboxPosition}
                      itemMap={itemMap}
                      iconMap={iconMap}
                      menuItems={menuItems}
                      getSelectedItems={getSelectedItems}
                      showInfo={showInfo}
                      itemSize={itemSize} />
                  ))}
                </motion.div>
              </CollapsibleContent>
            ) : null}
          </AnimatePresence>
        </Collapsible>
      ) : null}
    </div>
  );

  if (menuItems && menuItems.length > 0) {
    return (
      <ContextMenu>
        <ContextMenuTrigger>{content}</ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          {menuItems.map(mi => (
            <ContextMenuItem
              key={mi.id}
              onClick={() => {
                const items = selectedIds.has(item.id)
                  ? getSelectedItems()
                  : [item];

                mi.action(items);
              }}>
              {mi.icon ? <span className="mr-2 size-4">{mi.icon}</span> : null}
              {mi.label}
            </ContextMenuItem>
          ))}
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return content;
}

/* ------------------------------------------------------------------ */
/*  TreeView (main exported component)                                 */
/* ------------------------------------------------------------------ */

const TreeView = forwardRef<HTMLDivElement, TreeViewProps>(
  (
    {
      className,
      variant,
      size,
      data,
      showExpandAll = true,
      showCheckboxes = false,
      checkboxPosition = 'left',
      searchPlaceholder = 'Search...',
      selectionText = 'selected',
      checkboxLabels = { check: 'Check', uncheck: 'Uncheck' },
      getIcon,
      onSelectionChange,
      onAction,
      onCheckChange,
      iconMap = defaultIconMap,
      menuItems,
      showInfo = true,
      maxHeight,
      ...props
    },
    ref
  ) => {
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<number | null>(null);
    const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);
    const [currentMousePos, setCurrentMousePos] = useState(0);

    const lastSelectedId = useRef<string | null>(null);
    const treeRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<HTMLDivElement>(null);

    const DRAG_THRESHOLD = 10;
    const itemSize = (size || 'default') as 'sm' | 'default' | 'lg';

    const itemMap = useMemo(() => buildItemMap(data), [data]);

    /* ----------- search filtering ----------- */
    const { filteredData, searchExpandedIds } = useMemo(() => {
      if (!searchQuery.trim()) {
        return { filteredData: data, searchExpandedIds: new Set<string>() };
      }
      const q = searchQuery.toLowerCase();
      const expanded = new Set<string>();

      const matches = (it: TreeViewItem): boolean => {
        if (it.name.toLowerCase().includes(q)) return true;

        return !!it.children?.some(c => matches(c));
      };

      const filter = (items: TreeViewItem[]): TreeViewItem[] => items
        .map((it) => {
          if (!it.children) return matches(it) ? it : null;
          const filtered = filter(it.children);

          if (filtered.length > 0 || it.name.toLowerCase().includes(q)) {
            expanded.add(it.id);

            return { ...it, children: filtered };
          }

          return null;
        })
        .filter((it): it is TreeViewItem => it !== null);

      return { filteredData: filter(data), searchExpandedIds: expanded };
    }, [data, searchQuery]);

    useEffect(() => {
      if (searchQuery.trim()) {
        setExpandedIds(prev => new Set([...prev, ...searchExpandedIds]));
      }
    }, [searchExpandedIds, searchQuery]);

    /* ----------- click-away ----------- */
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        const t = e.target as Element;
        const inside
          = treeRef.current?.contains(t)
            || dragRef.current?.contains(t)
            || t.closest('[role="menu"]')
            || t.closest('[data-radix-popper-content-wrapper]');

        if (!inside) {
          setSelectedIds(new Set());
          lastSelectedId.current = null;
        }
      };

      document.addEventListener('mousedown', handler);

      return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* ----------- expand / collapse ----------- */
    const handleExpandAll = () => setExpandedIds(new Set(getAllFolderIds(data)));
    const handleCollapseAll = () => setExpandedIds(new Set());
    const handleToggleExpand = (id: string, open: boolean) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);

        if (open) next.add(id);
        else next.delete(id);

        return next;
      });
    };

    /* ----------- selection helpers ----------- */
    const getSelectedItems = useCallback((): TreeViewItem[] => {
      const items: TreeViewItem[] = [];
      const walk = (it: TreeViewItem) => {
        if (selectedIds.has(it.id)) items.push(it);
        it.children?.forEach(walk);
      };

      data.forEach(walk);

      return items;
    }, [selectedIds, data]);

    const getEffectiveSelectedItems = useCallback((): TreeViewItem[] => {
      const sel = getSelectedItems();
      const idSet = new Set(sel.map(i => i.id));

      return sel.filter((i) => {
        if (!i.children) return true;

        return !i.children.some(c => idSet.has(c.id));
      });
    }, [getSelectedItems]);

    /* ----------- drag selection ----------- */
    const handleMouseDown = useCallback((e: ReactMouseEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest('button')) return;
      setDragStartPosition({ x: e.clientX, y: e.clientY });
    }, []);

    const handleMouseMove = useCallback(
      (e: ReactMouseEvent) => {
        if (!(e.buttons & 1)) {
          setIsDragging(false);
          setDragStart(null);
          setDragStartPosition(null);

          return;
        }
        if (!dragStartPosition) return;

        const dx = e.clientX - dragStartPosition.x;
        const dy = e.clientY - dragStartPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (!isDragging) {
          if (dist > DRAG_THRESHOLD) {
            setIsDragging(true);
            setDragStart(dragStartPosition.y);
            if (!e.shiftKey && !e.ctrlKey) {
              setSelectedIds(new Set());
              lastSelectedId.current = null;
            }
          }

          return;
        }

        if (!dragRef.current) return;
        const items = Array.from(
          dragRef.current.querySelectorAll('[data-tree-item]')
        ) as HTMLElement[];
        const startY = dragStart;
        const currentY = e.clientY;
        const [selStart, selEnd] = [Math.min(startY || 0, currentY), Math.max(startY || 0, currentY)];

        const newSel = new Set(e.shiftKey || e.ctrlKey ? Array.from(selectedIds) : ([] as string[]));

        items.forEach((el) => {
          const rect = el.getBoundingClientRect();

          if (rect.bottom >= selStart && rect.top <= selEnd) {
            const id = el.getAttribute('data-id');
            const isClosed = el.getAttribute('data-folder-closed') === 'true';
            const parentClosed = el.closest('[data-folder-closed="true"]');

            if (id && (isClosed || !parentClosed)) newSel.add(id);
          }
        });
        setSelectedIds(newSel);
        setCurrentMousePos(e.clientY);
      },
      [
        isDragging,
        dragStart,
        selectedIds,
        dragStartPosition
      ]
    );

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
      setDragStart(null);
      setDragStartPosition(null);
    }, []);

    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseUp);
      }

      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('mouseleave', handleMouseUp);
      };
    }, [isDragging, handleMouseUp]);

    /* ----------- notify parent of selection changes ----------- */
    useEffect(() => {
      onSelectionChange?.(getSelectedItems());
    }, [selectedIds, onSelectionChange, getSelectedItems]);

    /* ----------- render ----------- */
    const toolbarHeight = itemSize === 'sm' ? 'h-8' : itemSize === 'lg' ? 'h-12' : 'h-10';
    const inputHeight = itemSize === 'sm' ? 'h-7' : itemSize === 'lg' ? 'h-10' : 'h-8';

    const treeContent = (
      <div
        ref={dragRef}
        className="relative select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}>
        {isDragging ? (
          <div
            className="absolute inset-x-0 pointer-events-none bg-primary/5"
            style={{
              top: Math.min(dragStart || 0, currentMousePos),
              height: Math.abs((dragStart || 0) - currentMousePos)
            }} />
        ) : null}
        {filteredData.map(item => (
          <TreeItemInternal
            key={item.id}
            item={item}
            depth={0}
            selectedIds={selectedIds}
            lastSelectedId={lastSelectedId}
            onSelect={setSelectedIds}
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
            getIcon={getIcon}
            onAction={onAction}
            onCheckChange={onCheckChange}
            allItems={data}
            showCheckboxes={showCheckboxes}
            checkboxPosition={checkboxPosition}
            itemMap={itemMap}
            iconMap={iconMap}
            menuItems={menuItems}
            getSelectedItems={getSelectedItems}
            showInfo={showInfo}
            itemSize={itemSize} />
        ))}
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            No items found
          </div>
        ) : null}
      </div>
    );

    const toolbar = (
      <AnimatePresence mode="wait">
        {selectedIds.size > 0 ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(toolbarHeight, 'flex items-center justify-between rounded-md border bg-background px-3')}>
            <div
              className="flex items-center gap-1.5 cursor-pointer font-medium"
              title="Clear selection"
              onClick={() => {
                setSelectedIds(new Set());
                lastSelectedId.current = null;
              }}
              role="button"
              tabIndex={0}>
              <X className="size-4" />
              <span>{selectedIds.size} {selectionText}</span>
            </div>
            {showCheckboxes ? (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const eff = getEffectiveSelectedItems();
                    const walk = (it: TreeViewItem) => {
                      onCheckChange?.(it, true);
                      it.children?.forEach(walk);
                    };

                    eff.forEach(walk);
                  }}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50">
                  {checkboxLabels.check}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const eff = getEffectiveSelectedItems();
                    const walk = (it: TreeViewItem) => {
                      onCheckChange?.(it, false);
                      it.children?.forEach(walk);
                    };

                    eff.forEach(walk);
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  {checkboxLabels.uncheck}
                </Button>
              </div>
            ) : null}
          </motion.div>
        ) : (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={cn(toolbarHeight, 'flex items-center gap-2')}>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={cn(inputHeight, 'pl-8 text-xs')} />
            </div>
            {showExpandAll ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(inputHeight, 'shrink-0')}>
                    <EllipsisVertical className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExpandAll}>
                    <ChevronDown className="size-4 mr-2" />
                    Expand All
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCollapseAll}>
                    <ChevronRight className="size-4 mr-2" />
                    Collapse All
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    );

    return (
      <div
        ref={(node) => {
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
          (treeRef as RefObject<HTMLDivElement | null>).current = node;
        }}
        className={cn(
          treeViewVariants({ variant, size }),
          'flex flex-col p-3',
          className
        )}
        style={maxHeight ? { maxHeight } : undefined}
        {...props}>
        {/* Toolbar: fixed at top */}
        <div className="shrink-0 pb-2">
          {toolbar}
        </div>

        {/* Tree content: scrollable */}
        {maxHeight ? (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-md">
            {treeContent}
          </div>
        ) : (
          treeContent
        )}
      </div>
    );
  }
);

TreeView.displayName = 'TreeView';

export { TreeView, treeViewVariants };