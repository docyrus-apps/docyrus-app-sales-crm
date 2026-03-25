'use client';

import {
  useCallback, useEffect, useId, useMemo, useRef, useState,
  type ComponentProps, type ReactNode
} from 'react';

import {
  type ColumnSort,
  type SortDirection,
  type Table
} from '@tanstack/react-table';
import {
  ArrowUpDown, ChevronRight, ChevronsUpDown, CircleMinus,
  CirclePlus, Columns3, EllipsisVertical, Eye, EyeOff,
  GripVertical, Layers, Paintbrush, Plus, Settings2, Trash2
} from 'lucide-react';
import { type FullField, type RuleGroupType } from 'react-querybuilder';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay
} from '@/components/ui/sortable';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { QueryBuilderDocyrus } from '@/components/docyrus/query-builder';

import {
  type DataGridCellColorRule,
  type DataGridDisplayMode,
  type DataGridRowColorRule,
  type RowHeightValue,
  type SavedDataGridView
} from '@/components/docyrus/data-grid/types';

import { SchemaRepeater } from '@/components/docyrus/schema-repeater';
import { getGroupableCellVariant } from '@/components/docyrus/data-grid/lib/data-grid-grouping';
import {
  applyViewToTable,
  getColumnLabel,
  getGeneratedViewId,
  getManagedColumns
} from '@/components/docyrus/data-grid/lib/view-utils';

import { tUi, type UiI18nLocale } from '@/lib/ui-i18n';

/*
 * ---------------------------------------------------------------------------
 * Constants & shared types
 * ---------------------------------------------------------------------------
 */

const SORT_ORDERS = [{ label: 'Asc', value: 'asc' }, { label: 'Desc', value: 'desc' }] as const;

const DEFAULT_FILTER_QUERY: RuleGroupType = {
  combinator: 'and',
  rules: []
};

type DataGridViewSelectVariant
  = 'dropdown'
    | 'horizontal-tabs'
    | 'vertical-tabs';

interface DraftColumn {
  id: string;
  label: string;
  visible: boolean;
  canHide: boolean;
  selected: boolean;
  group?: string;
}

/*
 * ---------------------------------------------------------------------------
 * DataGridViewSelect — main component
 * ---------------------------------------------------------------------------
 */

interface DataGridViewSelectProps<TData> extends ComponentProps<'div'> {
  table: Table<TData>;
  variant?: DataGridViewSelectVariant;
  maxVisibleViews?: number;
  views: Array<SavedDataGridView>;
  activeViewId?: string;
  defaultActiveViewId?: string;
  onViewChange?: (view: SavedDataGridView) => void;
  onViewSave?: (view: SavedDataGridView) => void;
  onViewDelete?: (viewId: string) => void;
  onViewCreate?: (view: SavedDataGridView, position?: { afterViewId?: string; beforeViewId?: string }) => void;
  onViewHide?: (viewId: string) => void;
  onViewUnhide?: (viewId: string) => void;
  hiddenViewIds?: Array<string>;
  fields?: Array<FullField>;
  editable?: boolean;
  disabled?: boolean;
  placeholder?: string;
  locale?: UiI18nLocale;
}

function DataGridViewSelect<TData>({
  table,
  variant = 'dropdown',
  maxVisibleViews,
  views,
  activeViewId: controlledActiveViewId,
  defaultActiveViewId,
  onViewChange,
  onViewSave,
  onViewDelete,
  onViewCreate,
  onViewHide,
  onViewUnhide,
  hiddenViewIds,
  fields,
  editable = false,
  disabled,
  placeholder,
  locale,
  className,
  ...props
}: DataGridViewSelectProps<TData>) {
  const [internalActiveId, setInternalActiveId] = useState(
    defaultActiveViewId ?? ''
  );

  const isControlled = controlledActiveViewId !== undefined;
  const activeViewId = isControlled ? controlledActiveViewId : internalActiveId;

  const activeView = useMemo(
    () => views.find(view => view.id === activeViewId),
    [views, activeViewId]
  );

  const onSelectView = useCallback(
    (viewId: string) => {
      const view = views.find(v => v.id === viewId);

      if (!view) return;

      applyViewToTable(table, view);

      if (!isControlled) {
        setInternalActiveId(viewId);
      }

      onViewChange?.(view);
    },
    [
      views,
      table,
      isControlled,
      onViewChange
    ]
  );

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorValue, setEditorValue] = useState<SavedDataGridView | undefined>(undefined);
  const [createPosition, setCreatePosition] = useState<{ afterViewId?: string; beforeViewId?: string } | undefined>(undefined);

  const openEditorForEdit = useCallback((view: SavedDataGridView) => {
    setEditorValue(view);
    setCreatePosition(undefined);
    setEditorOpen(true);
  }, []);

  const openEditorForCreate = useCallback((position?: { afterViewId?: string; beforeViewId?: string }) => {
    setEditorValue(undefined);
    setCreatePosition(position);
    setEditorOpen(true);
  }, []);

  const openEditorForManage = useCallback(() => {
    setEditorValue(activeView);
    setCreatePosition(undefined);
    setEditorOpen(true);
  }, [activeView]);

  const onEditorSave = useCallback(
    (view: SavedDataGridView) => {
      if (editorValue) {
        onViewSave?.(view);
      } else {
        onViewCreate?.(view, createPosition);
      }
    },
    [
      editorValue,
      onViewSave,
      onViewCreate,
      createPosition
    ]
  );

  const onEditorViewSwitch = useCallback(
    (viewId: string) => {
      const view = views.find(v => v.id === viewId);

      if (view) {
        setEditorValue(view);
      }
    },
    [views]
  );

  const visibleViews = useMemo(() => {
    if (!hiddenViewIds || hiddenViewIds.length === 0) return views;

    const hiddenSet = new Set(hiddenViewIds);

    return views.filter(v => !hiddenSet.has(v.id));
  }, [views, hiddenViewIds]);

  const hiddenViews = useMemo(() => {
    if (!hiddenViewIds || hiddenViewIds.length === 0) return [];

    const hiddenSet = new Set(hiddenViewIds);

    return views.filter(v => hiddenSet.has(v.id));
  }, [views, hiddenViewIds]);

  const { tabViews, overflowTabViews } = useMemo(() => {
    if (variant !== 'horizontal-tabs' || !maxVisibleViews || visibleViews.length <= maxVisibleViews) {
      return { tabViews: visibleViews, overflowTabViews: [] as Array<SavedDataGridView> };
    }

    const tabs = visibleViews.slice(0, maxVisibleViews);
    const overflow = visibleViews.slice(maxVisibleViews);

    if (activeViewId) {
      const overflowIdx = overflow.findIndex(v => v.id === activeViewId);

      if (overflowIdx !== -1) {
        const lastTabIdx = tabs.length - 1;
        const swapped = tabs[lastTabIdx] as SavedDataGridView;

        tabs[lastTabIdx] = overflow[overflowIdx] as SavedDataGridView;
        overflow[overflowIdx] = swapped;
      }
    }

    return { tabViews: tabs, overflowTabViews: overflow };
  }, [
    variant,
    maxVisibleViews,
    visibleViews,
    activeViewId
  ]);

  if (variant === 'dropdown') {
    return (
      <>
        <DropdownVariant
          views={visibleViews}
          activeView={activeView}
          onSelectView={onSelectView}
          disabled={disabled}
          placeholder={placeholder ?? tUi(locale, 'dgvSelectView')}
          editable={editable}
          hiddenViews={hiddenViews}
          onOpenEditor={openEditorForEdit}
          onOpenCreate={openEditorForCreate}
          onOpenManage={openEditorForManage}
          onViewHide={onViewHide}
          onViewUnhide={onViewUnhide}
          onViewDelete={onViewDelete}
          locale={locale}
          className={className}
          {...props} />
        {editable && (
          <ViewEditorDialog
            table={table}
            open={editorOpen}
            onOpenChange={setEditorOpen}
            value={editorValue}
            views={views}
            onSave={onEditorSave}
            onDelete={onViewDelete}
            onViewSwitch={onEditorViewSwitch}
            fields={fields}
            disabled={disabled}
            showDelete={Boolean(editorValue)}
            locale={locale} />
        )}
      </>
    );
  }

  const orientation
    = variant === 'vertical-tabs' ? 'vertical' : 'horizontal';

  return (
    <>
      <div
        data-slot="data-grid-view-select"
        className={cn('flex items-center gap-1', className)}
        {...props}>
        <Tabs
          value={activeViewId}
          onValueChange={onSelectView}
          orientation={orientation}>
          <TabsList variant="line">
            {tabViews.map(view => (
              <TabsTrigger
                key={view.id}
                value={view.id}
                disabled={disabled}
                className="relative">
                {view.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {(editable || overflowTabViews.length > 0) && activeView && (
          <ActiveViewMenu
            activeView={activeView}
            hiddenViews={hiddenViews}
            overflowViews={overflowTabViews}
            onConfigure={openEditorForEdit}
            onSelectOverflowView={onSelectView}
            onViewHide={editable ? onViewHide : undefined}
            onViewUnhide={editable ? onViewUnhide : undefined}
            onViewDelete={editable ? onViewDelete : undefined}
            onAddViewAfter={openEditorForCreate}
            onAddViewBefore={openEditorForCreate}
            onManageAllViews={openEditorForManage}
            editable={editable}
            disabled={disabled}
            locale={locale} />
        )}
        {editable && (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => openEditorForCreate()}
            disabled={disabled}
            aria-label={tUi(locale, 'dgvAddView')}>
            <Plus className="size-4" />
          </Button>
        )}
      </div>
      {editable && (
        <ViewEditorDialog
          table={table}
          open={editorOpen}
          onOpenChange={setEditorOpen}
          value={editorValue}
          views={views}
          onSave={onEditorSave}
          onDelete={onViewDelete}
          onViewSwitch={onEditorViewSwitch}
          fields={fields}
          disabled={disabled}
          showDelete={Boolean(editorValue)}
          locale={locale} />
      )}
    </>
  );
}

/*
 * ---------------------------------------------------------------------------
 * ActiveViewMenu — context menu for the active view
 * ---------------------------------------------------------------------------
 */

interface ActiveViewMenuProps {
  activeView: SavedDataGridView;
  hiddenViews: Array<SavedDataGridView>;
  overflowViews?: Array<SavedDataGridView>;
  onConfigure: (view: SavedDataGridView) => void;
  onSelectOverflowView?: (viewId: string) => void;
  onViewHide?: (viewId: string) => void;
  onViewUnhide?: (viewId: string) => void;
  onViewDelete?: (viewId: string) => void;
  onAddViewAfter: (position: { afterViewId: string }) => void;
  onAddViewBefore: (position: { beforeViewId: string }) => void;
  onManageAllViews: () => void;
  editable?: boolean;
  disabled?: boolean;
  locale?: UiI18nLocale;
}

function ActiveViewMenu({
  activeView,
  hiddenViews,
  overflowViews,
  onConfigure,
  onSelectOverflowView,
  onViewHide,
  onViewUnhide,
  onViewDelete,
  onAddViewAfter,
  onAddViewBefore,
  onManageAllViews,
  editable = true,
  disabled,
  locale
}: ActiveViewMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          disabled={disabled}
          aria-label="View options">
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {overflowViews && overflowViews.length > 0 && (
          <>
            {overflowViews.map(view => (
              <DropdownMenuItem
                key={view.id}
                onSelect={() => onSelectOverflowView?.(view.id)}>
                {view.name}
              </DropdownMenuItem>
            ))}
            {editable && <DropdownMenuSeparator />}
          </>
        )}
        {editable && (
          <>
            <DropdownMenuItem onSelect={() => onConfigure(activeView)}>
              <Settings2 />
              {tUi(locale, 'dgvConfigure')}
            </DropdownMenuItem>
            {onViewHide && (
              <DropdownMenuItem onSelect={() => onViewHide(activeView.id)}>
                <EyeOff />
                {tUi(locale, 'dgvHideView')}
              </DropdownMenuItem>
            )}
            {hiddenViews.length > 0 && onViewUnhide && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Eye />
                  {tUi(locale, 'dgvHiddenViews')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {hiddenViews.map(view => (
                    <DropdownMenuItem
                      key={view.id}
                      onSelect={() => onViewUnhide(view.id)}>
                      {view.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onAddViewAfter({ afterViewId: activeView.id })}>
              <Plus />
              {tUi(locale, 'dgvAddViewAfter')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => onAddViewBefore({ beforeViewId: activeView.id })}>
              <Plus />
              {tUi(locale, 'dgvAddViewBefore')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onViewDelete && (
              <>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onViewDelete(activeView.id)}>
                  <Trash2 />
                  {tUi(locale, 'dgvDeleteView')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onSelect={onManageAllViews}>
              <Layers />
              {tUi(locale, 'dgvManageAllViews')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/*
 * ---------------------------------------------------------------------------
 * DropdownVariant
 * ---------------------------------------------------------------------------
 */

interface DropdownVariantProps extends ComponentProps<'div'> {
  views: Array<SavedDataGridView>;
  activeView: SavedDataGridView | undefined;
  onSelectView: (viewId: string) => void;
  disabled?: boolean;
  placeholder: string;
  editable: boolean;
  hiddenViews: Array<SavedDataGridView>;
  onOpenEditor: (view: SavedDataGridView) => void;
  onOpenCreate: (position?: { afterViewId?: string; beforeViewId?: string }) => void;
  onOpenManage: () => void;
  onViewHide?: (viewId: string) => void;
  onViewUnhide?: (viewId: string) => void;
  onViewDelete?: (viewId: string) => void;
  locale?: UiI18nLocale;
}

function DropdownVariant({
  views,
  activeView,
  onSelectView,
  disabled,
  placeholder,
  editable,
  hiddenViews,
  onOpenEditor,
  onOpenCreate,
  onOpenManage,
  onViewHide,
  onViewUnhide,
  onViewDelete,
  locale,
  className,
  ...props
}: DropdownVariantProps) {
  const [open, setOpen] = useState(false);

  const onSelect = useCallback(
    (viewId: string) => {
      onSelectView(viewId);
      setOpen(false);
    },
    [onSelectView]
  );

  return (
    <div
      data-slot="data-grid-view-select"
      className={cn('flex items-center gap-1', className)}
      {...props}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 font-normal"
            disabled={disabled || views.length === 0}>
            <Layers className="text-muted-foreground" />
            {activeView?.name ?? placeholder}
            {views.length > 0 && (
              <Badge
                variant="secondary"
                className="h-[18.24px] rounded-[3.2px] px-[5.12px] font-mono font-normal text-[10.4px]">
                {views.length}
              </Badge>
            )}
            <ChevronsUpDown className="ml-auto opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-55 p-0">
          <Command>
            <CommandInput
              placeholder={tUi(locale, 'dgvSearchViews')} />
            <CommandList>
              <CommandEmpty>{tUi(locale, 'dgvNoViews')}</CommandEmpty>
              <CommandGroup>
                {views.map(view => (
                  <CommandItem
                    key={view.id}
                    value={view.id}
                    keywords={[view.name]}
                    onSelect={onSelect}>
                    <span className="truncate">{view.name}</span>
                    {view.description && (
                      <span className="text-muted-foreground ml-auto truncate text-xs">
                        {view.description}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              {editable && (
                <CommandGroup>
                  <CommandItem
                    value="__add_view__"
                    keywords={[tUi(locale, 'dgvAddView')]}
                    onSelect={() => {
                      setOpen(false);
                      onOpenCreate();
                    }}>
                    <Plus className="text-muted-foreground" />
                    <span>{tUi(locale, 'dgvAddView')}</span>
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {editable && activeView && (
        <ActiveViewMenu
          activeView={activeView}
          hiddenViews={hiddenViews}
          onConfigure={onOpenEditor}
          onViewHide={onViewHide}
          onViewUnhide={onViewUnhide}
          onViewDelete={onViewDelete}
          onAddViewAfter={onOpenCreate}
          onAddViewBefore={onOpenCreate}
          onManageAllViews={onOpenManage}
          disabled={disabled}
          locale={locale} />
      )}
    </div>
  );
}

/*
 * ---------------------------------------------------------------------------
 * ViewEditorDialog (exported also as DataGridViewEditor for backward compat)
 * ---------------------------------------------------------------------------
 */

interface ViewEditorDialogProps<TData>
  extends Omit<ComponentProps<typeof DialogContent>, 'children'> {
  table: Table<TData>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  value?: SavedDataGridView;
  views?: Array<SavedDataGridView>;
  onSave?: (view: SavedDataGridView) => void;
  onDelete?: (viewId: string) => void;
  onCancel?: () => void;
  onViewSwitch?: (viewId: string) => void;
  fields?: Array<FullField>;
  disabled?: boolean;
  showDelete?: boolean;
  trigger?: ReactNode;
  locale?: UiI18nLocale;
}

function createEmptyDraft(): Omit<SavedDataGridView, 'id'> {
  return {
    name: '',
    description: '',
    columnVisibility: {},
    columnOrder: [],
    columnPinning: { left: [], right: [] },
    sorting: [],
    columnFilters: [],
    grouping: [],
    filterQuery: { ...DEFAULT_FILTER_QUERY }
  };
}

function buildDraftColumns<TData>(
  table: Table<TData>,
  value: SavedDataGridView | undefined
): Array<DraftColumn> {
  const managed = getManagedColumns(table);
  const allLeafColumns = table.getAllLeafColumns();

  const columnOrder = value?.columnOrder
    ?? (table.getState().columnOrder.length > 0 ? table.getState().columnOrder : allLeafColumns.map(c => c.id));

  const columnVisibility = value?.columnVisibility
    ?? table.getState().columnVisibility;

  const managedMap = new Map(managed.map(c => [c.id, c]));

  const ordered: Array<DraftColumn> = [];
  const seen = new Set<string>();

  for (const id of columnOrder) {
    const column = managedMap.get(id);

    if (!column) continue;

    seen.add(id);

    ordered.push({
      id: column.id,
      label: getColumnLabel(column),
      visible: columnVisibility[column.id] !== false,
      canHide: column.getCanHide(),
      selected: true,
      group: column.columnDef.meta?.group
    });
  }

  for (const column of managed) {
    if (seen.has(column.id)) continue;

    ordered.push({
      id: column.id,
      label: getColumnLabel(column),
      visible: columnVisibility[column.id] !== false,
      canHide: column.getCanHide(),
      selected: false,
      group: column.columnDef.meta?.group
    });
  }

  return ordered;
}

function ViewEditorDialog<TData>({
  table,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  value,
  views,
  onSave,
  onDelete,
  onCancel,
  onViewSwitch,
  fields,
  disabled,
  showDelete,
  trigger,
  locale,
  className,
  ...dialogContentProps
}: ViewEditorDialogProps<TData>) {
  const id = useId();
  const isEditing = Boolean(value);

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const onOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }

      controlledOnOpenChange?.(nextOpen);
    },
    [isControlled, controlledOnOpenChange]
  );

  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftColumns, setDraftColumns] = useState<Array<DraftColumn>>([]);
  const [draftSorting, setDraftSorting] = useState<Array<ColumnSort>>([]);
  const [draftFilterQuery, setDraftFilterQuery] = useState<RuleGroupType>(
    DEFAULT_FILTER_QUERY
  );
  const [draftRowColorRules, setDraftRowColorRules] = useState<Array<DraftRowColorRule>>([]);
  const [draftCellColorRules, setDraftCellColorRules] = useState<Array<DraftCellColorRule>>([]);
  const [draftGrouping, setDraftGrouping] = useState<string | undefined>();
  const [draftRowHeight, setDraftRowHeight] = useState<RowHeightValue>('short');
  const [draftDisplayMode, setDraftDisplayMode] = useState<DataGridDisplayMode>('table');

  const initDraft = useCallback(() => {
    if (value) {
      setDraftName(value.name);
      setDraftDescription(value.description ?? '');
      setDraftSorting(value.sorting ? [...value.sorting] : []);
      setDraftFilterQuery(
        value.filterQuery ?? { ...DEFAULT_FILTER_QUERY }
      );
      setDraftRowColorRules(
        value.rowColorRules?.map((rule, i) => ({ ...rule, id: `rcr-${i}` })) ?? []
      );
      setDraftCellColorRules(
        value.cellColorRules?.map((rule, i) => ({ ...rule, id: `ccr-${i}` })) ?? []
      );
      setDraftGrouping(value.grouping?.[0]);
      setDraftRowHeight(value.rowHeight ?? 'short');
      setDraftDisplayMode(value.displayMode ?? 'table');
    } else {
      const empty = createEmptyDraft();

      setDraftName(empty.name);
      setDraftDescription(empty.description ?? '');
      setDraftSorting([]);
      setDraftFilterQuery({ ...DEFAULT_FILTER_QUERY });
      setDraftRowColorRules([]);
      setDraftCellColorRules([]);
      setDraftGrouping(undefined);
      setDraftRowHeight(table.options.meta?.rowHeight ?? 'short');
      setDraftDisplayMode(table.options.meta?.displayMode ?? 'table');
    }

    setDraftColumns(buildDraftColumns(table, value));
  }, [table, value]);

  const prevOpenRef = useRef(open);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      initDraft();
    }

    prevOpenRef.current = open;
  }, [open, initDraft]);

  const onDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        initDraft();
      }

      onOpenChange(nextOpen);
    },
    [initDraft, onOpenChange]
  );

  const onSaveClick = useCallback(() => {
    const selectedCols = draftColumns.filter(col => col.selected);
    const columnVisibility: Record<string, boolean> = {};
    const columnOrder: Array<string> = [];

    for (const col of selectedCols) {
      columnVisibility[col.id] = col.visible;
      columnOrder.push(col.id);
    }

    const savedView: SavedDataGridView = {
      id: value?.id ?? getGeneratedViewId(),
      name: draftName.trim(),
      description: draftDescription.trim() || undefined,
      columnVisibility,
      columnOrder,
      columnPinning: value?.columnPinning ?? { left: [], right: [] },
      rowHeight: draftRowHeight,
      displayMode: draftDisplayMode,
      sorting: draftSorting.length > 0 ? draftSorting : undefined,
      columnFilters: value?.columnFilters,
      grouping: draftGrouping ? [draftGrouping] : undefined,
      filterQuery: draftFilterQuery.rules.length > 0 ? draftFilterQuery : undefined,
      rowColorRules: draftRowColorRules.length > 0 ? draftRowColorRules.map(({ id: _id, ...rule }) => rule) : undefined,
      cellColorRules: draftCellColorRules.length > 0 ? draftCellColorRules.map(({ id: _id, ...rule }) => rule) : undefined
    };

    onSave?.(savedView);
    onOpenChange(false);
  }, [
    draftColumns,
    draftName,
    draftDescription,
    draftSorting,
    draftFilterQuery,
    draftRowColorRules,
    draftCellColorRules,
    draftGrouping,
    draftRowHeight,
    draftDisplayMode,
    value,
    onSave,
    onOpenChange
  ]);

  const onDeleteClick = useCallback(() => {
    if (!value?.id) return;

    onDelete?.(value.id);
    onOpenChange(false);
  }, [value, onDelete, onOpenChange]);

  const onCancelClick = useCallback(() => {
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  const onColumnVisibilityChange = useCallback(
    (columnId: string, visible: boolean) => {
      setDraftColumns(prev => prev.map(col => col.id === columnId ? { ...col, visible } : col));
    },
    []
  );

  const onColumnSelectedChange = useCallback(
    (columnId: string, selected: boolean) => {
      setDraftColumns(prev => prev.map(col => col.id === columnId ? { ...col, selected } : col));
    },
    []
  );

  const canSave = draftName.trim().length > 0;

  const showViewSwitcher = isEditing && views && views.length > 1;

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn('sm:max-w-270 gap-0 p-0', className)}
        {...dialogContentProps}>
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            {showViewSwitcher && (
              <Select
                value={value?.id ?? ''}
                onValueChange={viewId => onViewSwitch?.(viewId)}>
                <SelectTrigger size="sm" className="w-48">
                  <SelectValue placeholder={tUi(locale, 'dgvSwitchView')} />
                </SelectTrigger>
                <SelectContent>
                  {views.map(view => (
                    <SelectItem key={view.id} value={view.id}>
                      {view.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex-1">
              <DialogTitle>
                {isEditing ? tUi(locale, 'dgvEditView') : tUi(locale, 'dgvNewView')}
              </DialogTitle>
              <DialogDescription>
                {isEditing ? tUi(locale, 'dgvEditViewDescription') : tUi(locale, 'dgvNewViewDescription')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <EditorBody
          id={id}
          table={table}
          draftName={draftName}
          draftDescription={draftDescription}
          draftColumns={draftColumns}
          draftSorting={draftSorting}
          draftFilterQuery={draftFilterQuery}
          draftRowColorRules={draftRowColorRules}
          draftCellColorRules={draftCellColorRules}
          draftGrouping={draftGrouping}
          draftRowHeight={draftRowHeight}
          draftDisplayMode={draftDisplayMode}
          onNameChange={setDraftName}
          onDescriptionChange={setDraftDescription}
          onColumnsChange={setDraftColumns}
          onColumnVisibilityChange={onColumnVisibilityChange}
          onColumnSelectedChange={onColumnSelectedChange}
          onSortingChange={setDraftSorting}
          onFilterQueryChange={setDraftFilterQuery}
          onRowColorRulesChange={setDraftRowColorRules}
          onCellColorRulesChange={setDraftCellColorRules}
          onGroupingChange={setDraftGrouping}
          onRowHeightChange={setDraftRowHeight}
          onDisplayModeChange={setDraftDisplayMode}
          fields={fields}
          disabled={disabled}
          locale={locale} />

        <DialogFooter className="border-t px-6 py-4">
          {showDelete && isEditing && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteClick}
              disabled={disabled}
              className="mr-auto">
              <Trash2 />
              {tUi(locale, 'dgvDeleteView')}
            </Button>
          )}
          <DialogClose asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelClick}
              disabled={disabled}>
              {tUi(locale, 'dgvCancel')}
            </Button>
          </DialogClose>
          <Button
            size="sm"
            onClick={onSaveClick}
            disabled={disabled || !canSave}>
            {tUi(locale, 'dgvSaveView')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/*
 * ---------------------------------------------------------------------------
 * EditorBody — section-based editor content
 * ---------------------------------------------------------------------------
 */

const SECTION_IDS = {
  general: 'general',
  columns: 'columns',
  sorting: 'sorting',
  filters: 'filters',
  rowColorRules: 'rowColorRules',
  cellColorRules: 'cellColorRules'
} as const;

interface DraftRowColorRule extends DataGridRowColorRule { id: string }
interface DraftCellColorRule extends DataGridCellColorRule { id: string }

interface EditorBodyProps<TData> {
  id: string;
  table: Table<TData>;
  draftName: string;
  draftDescription: string;
  draftColumns: Array<DraftColumn>;
  draftSorting: Array<ColumnSort>;
  draftFilterQuery: RuleGroupType;
  draftRowColorRules: Array<DraftRowColorRule>;
  draftCellColorRules: Array<DraftCellColorRule>;
  draftGrouping: string | undefined;
  draftRowHeight: RowHeightValue;
  draftDisplayMode: DataGridDisplayMode;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onColumnsChange: (columns: Array<DraftColumn>) => void;
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void;
  onColumnSelectedChange: (columnId: string, selected: boolean) => void;
  onSortingChange: (sorting: Array<ColumnSort>) => void;
  onFilterQueryChange: (query: RuleGroupType) => void;
  onRowColorRulesChange: (rules: Array<DraftRowColorRule>) => void;
  onCellColorRulesChange: (rules: Array<DraftCellColorRule>) => void;
  onGroupingChange: (grouping: string | undefined) => void;
  onRowHeightChange: (rowHeight: RowHeightValue) => void;
  onDisplayModeChange: (displayMode: DataGridDisplayMode) => void;
  fields?: Array<FullField>;
  disabled?: boolean;
  locale?: UiI18nLocale;
}

function EditorBody<TData>({
  id,
  table,
  draftName,
  draftDescription,
  draftColumns,
  draftSorting,
  draftFilterQuery,
  draftRowColorRules,
  draftCellColorRules,
  draftGrouping,
  draftRowHeight,
  draftDisplayMode,
  onNameChange,
  onDescriptionChange,
  onColumnsChange,
  onColumnVisibilityChange,
  onColumnSelectedChange,
  onSortingChange,
  onFilterQueryChange,
  onRowColorRulesChange,
  onCellColorRulesChange,
  onGroupingChange,
  onRowHeightChange,
  onDisplayModeChange,
  fields,
  disabled,
  locale
}: EditorBodyProps<TData>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>(SECTION_IDS.general);

  const hasFilters = fields && fields.length > 0;

  const sections = useMemo(() => {
    const base: Array<{ id: string; label: string; icon: typeof Settings2 }> = [{ id: SECTION_IDS.general, label: tUi(locale, 'dgvGeneral'), icon: Settings2 }, { id: SECTION_IDS.columns, label: tUi(locale, 'dgvColumns'), icon: Columns3 }, { id: SECTION_IDS.sorting, label: tUi(locale, 'dgvSorting'), icon: ArrowUpDown }];

    if (hasFilters) {
      base.push({ id: SECTION_IDS.filters, label: tUi(locale, 'dgvFilters'), icon: Settings2 });
    }

    base.push(
      { id: SECTION_IDS.rowColorRules, label: tUi(locale, 'dgvRowColorRules'), icon: Paintbrush },
      { id: SECTION_IDS.cellColorRules, label: tUi(locale, 'dgvCellColorRules'), icon: Paintbrush }
    );

    return base;
  }, [locale, hasFilters]);

  const scrollToSection = useCallback((sectionId: string) => {
    const el = scrollRef.current?.querySelector(`[data-section="${sectionId}"]`);

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setActiveSection(sectionId);
  }, []);

  const onScroll = useCallback(() => {
    const container = scrollRef.current;

    if (!container) return;

    const containerTop = container.getBoundingClientRect().top;
    let current: string = SECTION_IDS.general;

    for (const section of sections) {
      const el = container.querySelector(`[data-section="${section.id}"]`);

      if (!el) continue;

      const elTop = el.getBoundingClientRect().top - containerTop;

      if (elTop <= 8) {
        current = section.id;
      }
    }

    setActiveSection(current);
  }, [sections]);

  return (
    <div className="flex max-h-[60vh] border-t">
      <nav className="flex w-40 shrink-0 flex-col gap-0.5 border-r bg-muted p-2">
        {sections.map(section => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollToSection(section.id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm font-medium transition-colors',
              activeSection === section.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
            )}>
            <section.icon className="size-4 shrink-0" />
            {section.label}
          </button>
        ))}
      </nav>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6"
        onScroll={onScroll}>
        <div className="flex flex-col gap-6 py-6">
          <div data-section={SECTION_IDS.general}>
            <TitleSection
              id={id}
              table={table}
              name={draftName}
              description={draftDescription}
              grouping={draftGrouping}
              rowHeight={draftRowHeight}
              displayMode={draftDisplayMode}
              onNameChange={onNameChange}
              onDescriptionChange={onDescriptionChange}
              onGroupingChange={onGroupingChange}
              onRowHeightChange={onRowHeightChange}
              onDisplayModeChange={onDisplayModeChange}
              disabled={disabled}
              locale={locale} />
          </div>

          <div data-section={SECTION_IDS.columns}>
            <DualColumnPicker
              columns={draftColumns}
              onColumnsChange={onColumnsChange}
              onVisibilityChange={onColumnVisibilityChange}
              onSelectedChange={onColumnSelectedChange}
              disabled={disabled}
              locale={locale} />
          </div>

          <div data-section={SECTION_IDS.sorting}>
            <SortSection
              id={id}
              table={table}
              sorting={draftSorting}
              onSortingChange={onSortingChange}
              disabled={disabled}
              locale={locale} />
          </div>

          {hasFilters && (
            <div data-section={SECTION_IDS.filters}>
              <FilterSection
                fields={fields}
                query={draftFilterQuery}
                onQueryChange={onFilterQueryChange}
                disabled={disabled}
                locale={locale} />
            </div>
          )}

          <div data-section={SECTION_IDS.rowColorRules}>
            <RowColorRulesSection
              rules={draftRowColorRules}
              onRulesChange={onRowColorRulesChange}
              disabled={disabled}
              locale={locale} />
          </div>

          <div data-section={SECTION_IDS.cellColorRules}>
            <CellColorRulesSection
              rules={draftCellColorRules}
              onRulesChange={onCellColorRulesChange}
              columns={draftColumns}
              disabled={disabled}
              locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * ---------------------------------------------------------------------------
 * TitleSection
 * ---------------------------------------------------------------------------
 */

interface TitleSectionProps<TData> {
  id: string;
  table: Table<TData>;
  name: string;
  description: string;
  grouping: string | undefined;
  rowHeight: RowHeightValue;
  displayMode: DataGridDisplayMode;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onGroupingChange: (grouping: string | undefined) => void;
  onRowHeightChange: (rowHeight: RowHeightValue) => void;
  onDisplayModeChange: (displayMode: DataGridDisplayMode) => void;
  disabled?: boolean;
  locale?: UiI18nLocale;
}

const ROW_HEIGHT_OPTIONS: Array<{ value: RowHeightValue; key: 'dgvShort' | 'dgvMedium' | 'dgvTall' | 'dgvExtraTall' }> = [
  { value: 'short', key: 'dgvShort' },
  { value: 'medium', key: 'dgvMedium' },
  { value: 'tall', key: 'dgvTall' },
  { value: 'extra-tall', key: 'dgvExtraTall' }
];

function TitleSection<TData>({
  id,
  table,
  name,
  description,
  grouping,
  rowHeight,
  displayMode,
  onNameChange,
  onDescriptionChange,
  onGroupingChange,
  onRowHeightChange,
  onDisplayModeChange,
  disabled,
  locale
}: TitleSectionProps<TData>) {
  const groupableColumns = useMemo(
    () => table.getAllLeafColumns().filter((column) => {
      if (column.id === 'select' || column.id === 'actions') return false;

      return Boolean(getGroupableCellVariant(column.columnDef.meta?.cell))
        && column.getCanGroup();
    }),
    [table]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-name`}>
          {tUi(locale, 'dgvViewName')}
        </Label>
        <Input
          id={`${id}-name`}
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder={tUi(locale, 'dgvViewNamePlaceholder')}
          disabled={disabled}
          autoFocus />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-description`}>
          {tUi(locale, 'dgvViewDescription')}
        </Label>
        <Textarea
          id={`${id}-description`}
          value={description}
          onChange={e => onDescriptionChange(e.target.value)}
          placeholder={tUi(locale, 'dgvViewDescriptionPlaceholder')}
          disabled={disabled}
          rows={2}
          className="resize-none" />
      </div>

      {groupableColumns.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-grouping`}>
            {tUi(locale, 'dgvGrouping')}
          </Label>
          <Select
            value={grouping ?? 'none'}
            onValueChange={v => onGroupingChange(v === 'none' ? undefined : v)}
            disabled={disabled}>
            <SelectTrigger id={`${id}-grouping`} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{tUi(locale, 'dgvNoGrouping')}</SelectItem>
              {groupableColumns.map(column => (
                <SelectItem key={column.id} value={column.id}>
                  {getColumnLabel(column)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={`${id}-row-height`}>
            {tUi(locale, 'dgvRowHeight')}
          </Label>
          <Select
            value={rowHeight}
            onValueChange={v => onRowHeightChange(v as RowHeightValue)}
            disabled={disabled}>
            <SelectTrigger id={`${id}-row-height`} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROW_HEIGHT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {tUi(locale, opt.key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={`${id}-display-mode`}>
            {tUi(locale, 'dgvDisplayMode')}
          </Label>
          <Select
            value={displayMode}
            onValueChange={v => onDisplayModeChange(v as DataGridDisplayMode)}
            disabled={disabled}>
            <SelectTrigger id={`${id}-display-mode`} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">{tUi(locale, 'dgvTable')}</SelectItem>
              <SelectItem value="gallery">{tUi(locale, 'dgvGallery')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

/*
 * ---------------------------------------------------------------------------
 * DualColumnPicker — two-box column selection with groups
 * ---------------------------------------------------------------------------
 */

interface DualColumnPickerProps {
  columns: Array<DraftColumn>;
  onColumnsChange: (columns: Array<DraftColumn>) => void;
  onVisibilityChange: (columnId: string, visible: boolean) => void;
  onSelectedChange: (columnId: string, selected: boolean) => void;
  disabled?: boolean;
  locale?: UiI18nLocale;
}

const DEFAULT_GROUP_KEY = '__default__';

interface ColumnGroup {
  key: string;
  label: string;
  columns: Array<DraftColumn>;
}

function DualColumnPicker({
  columns,
  onColumnsChange,
  onVisibilityChange,
  onSelectedChange,
  disabled,
  locale
}: DualColumnPickerProps) {
  const [availableSearch, setAvailableSearch] = useState('');
  const [selectedSearch, setSelectedSearch] = useState('');

  const availableColumns = useMemo(
    () => columns.filter(col => !col.selected),
    [columns]
  );

  const selectedColumns = useMemo(
    () => columns.filter(col => col.selected),
    [columns]
  );

  const availableGroups = useMemo(() => {
    const groupMap = new Map<string, Array<DraftColumn>>();
    const searchLower = availableSearch.toLowerCase();

    for (const col of availableColumns) {
      if (searchLower && !col.label.toLowerCase().includes(searchLower)) continue;

      const groupKey = col.group ?? DEFAULT_GROUP_KEY;

      const existing = groupMap.get(groupKey);

      if (existing) {
        existing.push(col);
      } else {
        groupMap.set(groupKey, [col]);
      }
    }

    const groups: Array<ColumnGroup> = [];

    for (const [key, cols] of groupMap) {
      groups.push({
        key,
        label: key === DEFAULT_GROUP_KEY ? tUi(locale, 'dgvColumns') : key,
        columns: cols
      });
    }

    return groups;
  }, [availableColumns, availableSearch, locale]);

  const filteredSelectedColumns = useMemo(() => {
    if (!selectedSearch) return selectedColumns;

    const searchLower = selectedSearch.toLowerCase();

    return selectedColumns.filter(col => col.label.toLowerCase().includes(searchLower));
  }, [selectedColumns, selectedSearch]);

  const onAddToSelected = useCallback(
    (columnId: string) => {
      onSelectedChange(columnId, true);
    },
    [onSelectedChange]
  );

  const onRemoveFromSelected = useCallback(
    (columnId: string) => {
      onSelectedChange(columnId, false);
    },
    [onSelectedChange]
  );

  const onSelectedColumnsReorder = useCallback(
    (reordered: Array<DraftColumn>) => {
      const reorderedIds = reordered.map(c => c.id);
      const reorderedSet = new Set(reorderedIds);

      const next = [...reordered, ...columns.filter(c => !reorderedSet.has(c.id))];

      onColumnsChange(next);
    },
    [columns, onColumnsChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <Label>{tUi(locale, 'dgvColumns')}</Label>
      <div className="flex gap-3">
        {/* Left: Available Columns */}
        <div className="flex flex-1 flex-col rounded-md border">
          <div className="border-b px-3 py-2">
            <span className="text-muted-foreground text-xs font-medium">
              {tUi(locale, 'dgvAvailableColumns')}
            </span>
          </div>
          <div className="px-2 pt-2">
            <Input
              value={availableSearch}
              onChange={e => setAvailableSearch(e.target.value)}
              placeholder={tUi(locale, 'dgvSearchAvailable')}
              className="h-7 text-xs"
              disabled={disabled} />
          </div>
          <div className="min-h-30 max-h-70 overflow-y-auto p-2">
            {availableGroups.length === 0 && (
              <p className="text-muted-foreground py-3 text-center text-xs">
                {tUi(locale, 'dgvNoAvailableColumns')}
              </p>
            )}
            {availableGroups.map(group => (
              <AvailableGroup
                key={group.key}
                group={group}
                onAdd={onAddToSelected}
                disabled={disabled}
                defaultOpen={availableGroups.length <= 3} />
            ))}
          </div>
        </div>

        {/* Right: Selected Columns */}
        <div className="flex flex-1 flex-col rounded-md border">
          <div className="border-b px-3 py-2">
            <span className="text-muted-foreground text-xs font-medium">
              {tUi(locale, 'dgvSelectedColumns')}
            </span>
          </div>
          <div className="px-2 pt-2">
            <Input
              value={selectedSearch}
              onChange={e => setSelectedSearch(e.target.value)}
              placeholder={tUi(locale, 'dgvSearchSelected')}
              className="h-7 text-xs"
              disabled={disabled} />
          </div>
          <div className="min-h-30 max-h-70 overflow-y-auto p-2">
            {selectedColumns.length === 0 && (
              <p className="text-muted-foreground py-3 text-center text-xs">
                {tUi(locale, 'dgvNoSelectedColumns')}
              </p>
            )}
            <Sortable
              value={selectedColumns}
              getItemValue={item => item.id}
              onValueChange={onSelectedColumnsReorder}
              orientation="vertical">
              <SortableContent className="space-y-1">
                {filteredSelectedColumns.map(column => (
                  <SortableItem key={column.id} value={column.id} asChild>
                    <div
                      className={cn(
                        'flex items-center gap-2 rounded-sm border px-2 py-1',
                        !column.visible && 'opacity-50'
                      )}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-muted-foreground"
                        onClick={() => onRemoveFromSelected(column.id)}
                        disabled={disabled}
                        aria-label={`Remove ${column.label}`}>
                        <CircleMinus className="size-4" />
                      </Button>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {column.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-muted-foreground"
                        onClick={() => onVisibilityChange(column.id, !column.visible)}
                        disabled={disabled || !column.canHide}
                        aria-label={`Toggle ${column.label} visibility`}>
                        {column.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                      </Button>
                      <SortableItemHandle asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground"
                          disabled={disabled}
                          aria-label={`Reorder ${column.label}`}>
                          <GripVertical className="size-4" />
                        </Button>
                      </SortableItemHandle>
                    </div>
                  </SortableItem>
                ))}
              </SortableContent>
              <SortableOverlay>
                <div className="flex items-center gap-2 rounded-sm border bg-background px-2 py-1">
                  <div className="size-4 rounded-sm bg-primary/10" />
                  <div className="h-4 flex-1 rounded-sm bg-primary/10" />
                  <div className="size-7 rounded-sm bg-primary/10" />
                  <div className="size-7 rounded-sm bg-primary/10" />
                </div>
              </SortableOverlay>
            </Sortable>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
 * ---------------------------------------------------------------------------
 * AvailableGroup — collapsible group in left column picker
 * ---------------------------------------------------------------------------
 */

interface AvailableGroupProps {
  group: ColumnGroup;
  onAdd: (columnId: string) => void;
  disabled?: boolean;
  defaultOpen?: boolean;
}

function AvailableGroup({
  group,
  onAdd,
  disabled,
  defaultOpen = true
}: AvailableGroupProps) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1 py-1 text-xs font-medium transition-colors [&[data-state=open]>svg:first-child]:rotate-90">
          <ChevronRight className="size-3 transition-transform" />
          {group.label}
          <span className="text-muted-foreground/60 ml-auto text-[10px]">
            {group.columns.length}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-0.5 pb-1 pl-1">
          {group.columns.map(column => (
            <div
              key={column.id}
              className="flex items-center gap-2 rounded-sm px-1.5 py-1">
              <span className="min-w-0 flex-1 truncate text-sm">
                {column.label}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto size-7 shrink-0 text-muted-foreground"
                onClick={() => onAdd(column.id)}
                disabled={disabled}
                aria-label={`Add ${column.label}`}>
                <CirclePlus className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/*
 * ---------------------------------------------------------------------------
 * SortSection
 * ---------------------------------------------------------------------------
 */

interface SortSectionProps<TData> {
  id: string;
  table: Table<TData>;
  sorting: Array<ColumnSort>;
  onSortingChange: (sorting: Array<ColumnSort>) => void;
  disabled?: boolean;
  locale?: UiI18nLocale;
}

function SortSection<TData>({
  id,
  table,
  sorting,
  onSortingChange,
  disabled,
  locale
}: SortSectionProps<TData>) {
  const { columnLabels, availableColumns } = useMemo(() => {
    const labels = new Map<string, string>();
    const sortingIds = new Set(sorting.map(s => s.id));
    const available: Array<{ id: string; label: string }> = [];

    for (const column of table.getAllColumns()) {
      if (!column.getCanSort()) continue;

      const label = column.columnDef.meta?.label ?? column.id;

      labels.set(column.id, label);

      if (!sortingIds.has(column.id)) {
        available.push({ id: column.id, label });
      }
    }

    return { columnLabels: labels, availableColumns: available };
  }, [sorting, table]);

  const onSortAdd = useCallback(() => {
    const first = availableColumns[0];

    if (!first) return;

    onSortingChange([...sorting, { id: first.id, desc: false }]);
  }, [availableColumns, sorting, onSortingChange]);

  const onSortUpdate = useCallback(
    (sortId: string, updates: Partial<ColumnSort>) => {
      onSortingChange(
        sorting.map(s => s.id === sortId ? { ...s, ...updates } : s)
      );
    },
    [sorting, onSortingChange]
  );

  const onSortRemove = useCallback(
    (sortId: string) => {
      onSortingChange(sorting.filter(s => s.id !== sortId));
    },
    [sorting, onSortingChange]
  );

  return (
    <div className="flex flex-col gap-2">
      <Label>{tUi(locale, 'dgvSorting')}</Label>
      <Sortable
        value={sorting}
        getItemValue={item => item.id}
        onValueChange={onSortingChange}
        orientation="vertical">
        {sorting.length > 0 && (
          <SortableContent className="max-h-50 space-y-2 overflow-y-auto">
            {sorting.map(sort => (
              <SortItem
                key={sort.id}
                sort={sort}
                sortItemId={`${id}-sort-${sort.id}`}
                availableColumns={availableColumns}
                columnLabels={columnLabels}
                onSortUpdate={onSortUpdate}
                onSortRemove={onSortRemove}
                disabled={disabled}
                locale={locale} />
            ))}
          </SortableContent>
        )}
        <SortableOverlay>
          <div className="flex items-center gap-2">
            <div className="h-8 w-44 rounded-sm bg-primary/10" />
            <div className="h-8 w-24 rounded-sm bg-primary/10" />
            <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
            <div className="size-8 shrink-0 rounded-sm bg-primary/10" />
          </div>
        </SortableOverlay>
      </Sortable>
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={onSortAdd}
        disabled={disabled || availableColumns.length === 0}>
        <Plus className="size-4" />
        {tUi(locale, 'dgvAddSort')}
      </Button>
    </div>
  );
}

/*
 * ---------------------------------------------------------------------------
 * SortItem
 * ---------------------------------------------------------------------------
 */

interface SortItemProps {
  sort: ColumnSort;
  sortItemId: string;
  availableColumns: Array<{ id: string; label: string }>;
  columnLabels: Map<string, string>;
  onSortUpdate: (sortId: string, updates: Partial<ColumnSort>) => void;
  onSortRemove: (sortId: string) => void;
  disabled?: boolean;
  locale?: UiI18nLocale;
}

function SortItem({
  sort,
  sortItemId,
  availableColumns,
  columnLabels,
  onSortUpdate,
  onSortRemove,
  disabled,
  locale
}: SortItemProps) {
  const [showFieldSelector, setShowFieldSelector] = useState(false);

  return (
    <SortableItem value={sort.id} asChild>
      <div
        id={sortItemId}
        className="flex items-center gap-2">
        <Popover
          open={showFieldSelector}
          onOpenChange={setShowFieldSelector}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-44 justify-between rounded font-normal"
              disabled={disabled}>
              <span className="truncate">
                {columnLabels.get(sort.id) ?? sort.id}
              </span>
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
            <Command>
              <CommandInput
                placeholder={tUi(locale, 'dgvSearchColumns')} />
              <CommandList>
                <CommandEmpty>
                  {tUi(locale, 'dgvNoColumnsFound')}
                </CommandEmpty>
                <CommandGroup>
                  {availableColumns.map(column => (
                    <CommandItem
                      key={column.id}
                      value={column.id}
                      onSelect={(val) => {
                        onSortUpdate(sort.id, { id: val });
                        setShowFieldSelector(false);
                      }}>
                      <span className="truncate">{column.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Select
          value={sort.desc ? 'desc' : 'asc'}
          onValueChange={(val: SortDirection) => onSortUpdate(sort.id, { desc: val === 'desc' })}
          disabled={disabled}>
          <SelectTrigger size="sm" className="w-24 rounded">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-(--radix-select-trigger-width)">
            {SORT_ORDERS.map(order => (
              <SelectItem key={order.value} value={order.value}>
                {order.value === 'asc' ? tUi(locale, 'dgvAsc') : tUi(locale, 'dgvDesc')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          className="size-8 shrink-0 rounded"
          onClick={() => onSortRemove(sort.id)}
          disabled={disabled}
          aria-label="Remove sort rule">
          <Trash2 />
        </Button>

        <SortableItemHandle asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-8 shrink-0 rounded"
            disabled={disabled}
            aria-label="Reorder sort rule">
            <GripVertical />
          </Button>
        </SortableItemHandle>
      </div>
    </SortableItem>
  );
}

/*
 * ---------------------------------------------------------------------------
 * FilterSection
 * ---------------------------------------------------------------------------
 */

interface FilterSectionProps {
  fields: Array<FullField>;
  query: RuleGroupType;
  onQueryChange: (query: RuleGroupType) => void;
  disabled?: boolean;
  locale?: UiI18nLocale;
}

function FilterSection({
  fields,
  query,
  onQueryChange,
  disabled,
  locale
}: FilterSectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{tUi(locale, 'dgvFilters')}</Label>
      <div className={cn(disabled && 'pointer-events-none opacity-60')}>
        <QueryBuilderDocyrus
          fields={fields}
          query={query}
          onQueryChange={onQueryChange}
          variant="compact"
          size="sm" />
      </div>
    </div>
  );
}

/*
 * ---------------------------------------------------------------------------
 * Color picker helpers
 * ---------------------------------------------------------------------------
 */

const COLOR_PALETTE = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#78716c',
  '#64748b',
  '#1e293b'
];

let colorRuleIdCounter = 0;

function nextColorRuleId() {
  return `cr-${Date.now()}-${++colorRuleIdCounter}`;
}

function ColorSwatchPicker({
  value,
  onValueChange,
  disabled
}: {
  value: string;
  onValueChange: (color: string) => void;
  disabled?: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-16 px-2"
          disabled={disabled}>
          <div
            className="size-4 rounded-sm border"
            style={{ backgroundColor: value || '#3b82f6' }} />
          <ChevronsUpDown className="ml-auto size-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-6 gap-1">
          {COLOR_PALETTE.map(color => (
            <button
              key={color}
              type="button"
              className={cn(
                'size-6 rounded-sm border transition-transform hover:scale-110',
                value === color && 'ring-2 ring-primary ring-offset-1'
              )}
              style={{ backgroundColor: color }}
              onClick={() => onValueChange(color)} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/*
 * ---------------------------------------------------------------------------
 * RowColorRulesSection
 * ---------------------------------------------------------------------------
 */

interface RowColorRulesSectionProps {
  rules: Array<DraftRowColorRule>;
  onRulesChange: (rules: Array<DraftRowColorRule>) => void;
  disabled?: boolean;
  locale?: UiI18nLocale;
}

function RowColorRulesSection({
  rules,
  onRulesChange,
  disabled,
  locale
}: RowColorRulesSectionProps) {
  const createItem = useCallback(
    () => ({ id: nextColorRuleId(), formula: '', color: '#3b82f6' }),
    []
  );

  return (
    <div className="flex flex-col gap-2">
      <Label>{tUi(locale, 'dgvRowColorRules')}</Label>
      <SchemaRepeater
        value={rules}
        onValueChange={onRulesChange}
        createItem={createItem}
        addLabel={tUi(locale, 'dgvAddRule')}
        disabled={disabled}
        renderItem={(item, _index, { update }) => (
          <div className="flex items-center gap-2">
            <Input
              value={item.formula}
              onChange={e => update({ formula: e.target.value })}
              placeholder={tUi(locale, 'dgvFormula')}
              className="h-8 flex-1 text-sm"
              disabled={disabled} />
            <ColorSwatchPicker
              value={item.color}
              onValueChange={color => update({ color })}
              disabled={disabled} />
          </div>
        )} />
    </div>
  );
}

/*
 * ---------------------------------------------------------------------------
 * CellColorRulesSection
 * ---------------------------------------------------------------------------
 */

interface CellColorRulesSectionProps {
  rules: Array<DraftCellColorRule>;
  onRulesChange: (rules: Array<DraftCellColorRule>) => void;
  columns: Array<DraftColumn>;
  disabled?: boolean;
  locale?: UiI18nLocale;
}

function CellColorRulesSection({
  rules,
  onRulesChange,
  columns,
  disabled,
  locale
}: CellColorRulesSectionProps) {
  const selectedColumns = useMemo(
    () => columns.filter(c => c.selected),
    [columns]
  );

  const createItem = useCallback(
    () => ({
      id: nextColorRuleId(),
      column: selectedColumns[0]?.id ?? '',
      formula: '',
      color: '#3b82f6'
    }),
    [selectedColumns]
  );

  return (
    <div className="flex flex-col gap-2">
      <Label>{tUi(locale, 'dgvCellColorRules')}</Label>
      <SchemaRepeater
        value={rules}
        onValueChange={onRulesChange}
        createItem={createItem}
        addLabel={tUi(locale, 'dgvAddRule')}
        disabled={disabled}
        renderItem={(item, _index, { update }) => (
          <div className="flex items-center gap-2">
            <Select
              value={item.column}
              onValueChange={column => update({ column })}
              disabled={disabled}>
              <SelectTrigger size="sm" className="h-8 w-36">
                <SelectValue placeholder={tUi(locale, 'dgvColumn')} />
              </SelectTrigger>
              <SelectContent>
                {selectedColumns.map(col => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={item.formula}
              onChange={e => update({ formula: e.target.value })}
              placeholder={tUi(locale, 'dgvFormula')}
              className="h-8 flex-1 text-sm"
              disabled={disabled} />
            <ColorSwatchPicker
              value={item.color}
              onValueChange={color => update({ color })}
              disabled={disabled} />
          </div>
        )} />
    </div>
  );
}

/*
 * ---------------------------------------------------------------------------
 * Exports
 * ---------------------------------------------------------------------------
 */

export { DataGridViewSelect };
export type { DataGridViewSelectProps, DataGridViewSelectVariant };
export { ViewEditorDialog as DataGridViewEditor };
export type { ViewEditorDialogProps as DataGridViewEditorProps };