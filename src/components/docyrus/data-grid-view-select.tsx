'use client'

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'

import {
  type ColumnSort,
  type SortDirection,
  type Table,
} from '@tanstack/react-table'
import {
  ArrowUpDown,
  ChevronRight,
  ChevronsUpDown,
  CircleMinus,
  CirclePlus,
  Columns3,
  EllipsisVertical,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Loader2,
  Lock,
  Paintbrush,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
} from 'lucide-react'
import { type FullField, type RuleGroupType } from 'react-querybuilder'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@/components/ui/sortable'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { DocyrusIcon } from '@/components/docyrus/docyrus-icon'
import { QueryBuilderDocyrus } from '@/components/docyrus/query-builder'

import {
  DATA_GRID_DEFAULT_PAGE_SIZE,
  DATA_GRID_PAGE_SIZE_OPTIONS,
  type DataGridCellColorRule,
  type DataGridDisplayMode,
  type DataGridPagingMode,
  type DataGridRowColorRule,
  type RowHeightValue,
  type SavedDataGridView,
} from '@/components/docyrus/data-grid/types'

import { SchemaRepeater } from '@/components/docyrus/schema-repeater'
import { isColumnGroupable } from '@/components/docyrus/data-grid/lib/data-grid-grouping'

import { useUiTranslation } from '@/lib/use-ui-translation'
import {
  allIcons,
  featuredHugeIcons,
  featuredIcons,
  hugeIcons,
} from '@/lib/icon-libraries'
import {
  applyViewToTable,
  getColumnLabel,
  getGeneratedViewId,
  getManagedColumns,
} from '@/components/docyrus/data-grid/lib/view-utils'

/*
 * ---------------------------------------------------------------------------
 * Constants & shared types
 * ---------------------------------------------------------------------------
 */

const SORT_ORDER_VALUES = ['asc', 'desc'] as const

const DEFAULT_FILTER_QUERY: RuleGroupType = {
  combinator: 'and',
  rules: [],
}

type DataGridViewSelectVariant =
  | 'dropdown'
  | 'horizontal-tabs'
  | 'vertical-tabs'

interface DraftColumn {
  id: string
  label: string
  visible: boolean
  canHide: boolean
  selected: boolean
  group?: string
  /**
   * `true` when the column is *forced* into read-only mode by the host —
   * identity / autonumber columns and fields with `readOnly: true` in the
   * data-source metadata. Surfaced to the inline-editing section so the
   * checkbox can be displayed as locked.
   */
  forcedReadOnly?: boolean
}

/*
 * ---------------------------------------------------------------------------
 * DataGridViewSelect — main component
 * ---------------------------------------------------------------------------
 */

interface DataGridViewSelectProps<TData> extends ComponentProps<'div'> {
  table: Table<TData>
  variant?: DataGridViewSelectVariant
  maxVisibleViews?: number
  views: Array<SavedDataGridView>
  activeViewId?: string
  defaultActiveViewId?: string
  onViewChange?: (view: SavedDataGridView) => void
  onViewSave?: (view: SavedDataGridView) => void
  onViewDelete?: (viewId: string) => void
  onViewCreate?: (
    view: SavedDataGridView,
    position?: { afterViewId?: string; beforeViewId?: string },
  ) => void
  onViewHide?: (viewId: string) => void
  onViewUnhide?: (viewId: string) => void
  /**
   * Persist a new top-to-bottom order for the saved views. Called from the
   * "Manage All Views" dialog when the user drag-reorders the list. When
   * omitted, drag handles are hidden and the manage dialog stays read-only
   * for ordering.
   */
  onViewReorder?: (orderedViewIds: Array<string>) => void
  hiddenViewIds?: Array<string>
  fields?: Array<FullField>
  editable?: boolean
  disabled?: boolean
  placeholder?: string
  /**
   * Set to `true` while a `onViewCreate` / `onViewSave` request is in flight.
   * The view editor stays open and shows a "Saving…" overlay until this flips
   * back to `false`, at which point the dialog auto-closes. When omitted, the
   * dialog closes synchronously on Save (uncontrolled / fire-and-forget).
   */
  isSaving?: boolean
  /**
   * Set to `true` while the view list is being fetched. The component shows
   * an inline loading spinner instead of the (empty) tab strip / dropdown.
   */
  isLoading?: boolean
  /**
   * Column id used as the default row-grouping column for views that do not
   * already specify a `grouping`. The host (e.g. `useDocyrusDataGrid`) is
   * responsible for actually applying it to the table; this prop lets the
   * editor surface and saved-view shape stay aware of the default.
   */
  defaultRowGroupingColumn?: string
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
  onViewReorder,
  hiddenViewIds,
  fields,
  editable = false,
  disabled,
  placeholder,
  isSaving,
  isLoading,
  defaultRowGroupingColumn,
  className,
  ...props
}: DataGridViewSelectProps<TData>) {
  const { t } = useUiTranslation()
  const [internalActiveId, setInternalActiveId] = useState(
    defaultActiveViewId ?? '',
  )

  const isControlled = controlledActiveViewId !== undefined
  const activeViewId = isControlled ? controlledActiveViewId : internalActiveId

  const activeView = useMemo(
    () => views.find((view) => view.id === activeViewId),
    [views, activeViewId],
  )

  const onSelectView = useCallback(
    (viewId: string) => {
      const view = views.find((v) => v.id === viewId)

      if (!view) return

      applyViewToTable(table, view)

      if (!isControlled) {
        setInternalActiveId(viewId)
      }

      onViewChange?.(view)
    },
    [views, table, isControlled, onViewChange],
  )

  const [editorOpen, setEditorOpen] = useState(false)
  const [editorValue, setEditorValue] = useState<SavedDataGridView | undefined>(
    undefined,
  )
  const [createPosition, setCreatePosition] = useState<
    { afterViewId?: string; beforeViewId?: string } | undefined
  >(undefined)

  const openEditorForEdit = useCallback((view: SavedDataGridView) => {
    setEditorValue(view)
    setCreatePosition(undefined)
    setEditorOpen(true)
  }, [])

  const openEditorForCreate = useCallback(
    (position?: { afterViewId?: string; beforeViewId?: string }) => {
      setEditorValue(undefined)
      setCreatePosition(position)
      setEditorOpen(true)
    },
    [],
  )

  const [manageOpen, setManageOpen] = useState(false)

  const openManageDialog = useCallback(() => {
    setManageOpen(true)
  }, [])

  const onEditorSave = useCallback(
    (view: SavedDataGridView) => {
      if (editorValue) {
        onViewSave?.(view)
      } else {
        onViewCreate?.(view, createPosition)
      }
    },
    [editorValue, onViewSave, onViewCreate, createPosition],
  )

  const onEditorViewSwitch = useCallback(
    (viewId: string) => {
      const view = views.find((v) => v.id === viewId)

      if (view) {
        setEditorValue(view)
      }
    },
    [views],
  )

  const visibleViews = useMemo(() => {
    if (!hiddenViewIds || hiddenViewIds.length === 0) return views

    const hiddenSet = new Set(hiddenViewIds)

    return views.filter((v) => !hiddenSet.has(v.id))
  }, [views, hiddenViewIds])

  const hiddenViews = useMemo(() => {
    if (!hiddenViewIds || hiddenViewIds.length === 0) return []

    const hiddenSet = new Set(hiddenViewIds)

    return views.filter((v) => hiddenSet.has(v.id))
  }, [views, hiddenViewIds])

  const { tabViews, overflowTabViews } = useMemo(() => {
    if (
      variant !== 'horizontal-tabs' ||
      !maxVisibleViews ||
      visibleViews.length <= maxVisibleViews
    ) {
      return {
        tabViews: visibleViews,
        overflowTabViews: [] as Array<SavedDataGridView>,
      }
    }

    const tabs = visibleViews.slice(0, maxVisibleViews)
    const overflow = visibleViews.slice(maxVisibleViews)

    if (activeViewId) {
      const overflowIdx = overflow.findIndex((v) => v.id === activeViewId)

      if (overflowIdx !== -1) {
        const lastTabIdx = tabs.length - 1
        const swapped = tabs[lastTabIdx] as SavedDataGridView

        tabs[lastTabIdx] = overflow[overflowIdx] as SavedDataGridView
        overflow[overflowIdx] = swapped
      }
    }

    return { tabViews: tabs, overflowTabViews: overflow }
  }, [variant, maxVisibleViews, visibleViews, activeViewId])

  /*
   * Loading state — shown while the host (e.g. `useDocyrusDataViewSelect`) is
   * fetching saved views. Once data settles the normal variant takes over.
   * Skipped when there are already views to render (e.g. system views) so
   * the user doesn't lose context during a background refetch.
   */
  if (isLoading && views.length === 0) {
    return (
      <div
        data-slot="data-grid-view-select-loading"
        aria-live="polite"
        className={cn(
          'flex h-8 items-center gap-2 px-2 text-xs text-muted-foreground',
          className,
        )}
        {...props}
      >
        <Loader2 className="size-3.5 animate-spin" />
        {t('ui.dataGridView.loadingViews', 'Loading views…')}
      </div>
    )
  }

  if (variant === 'dropdown') {
    return (
      <>
        <DropdownVariant
          views={visibleViews}
          activeView={activeView}
          onSelectView={onSelectView}
          disabled={disabled}
          placeholder={
            placeholder ?? t('ui.dataGridView.selectView', 'Select view')
          }
          editable={editable}
          hiddenViews={hiddenViews}
          onOpenEditor={openEditorForEdit}
          onOpenCreate={openEditorForCreate}
          onOpenManage={openManageDialog}
          onViewHide={onViewHide}
          onViewUnhide={onViewUnhide}
          onViewDelete={onViewDelete}
          className={className}
          {...props}
        />
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
            defaultRowGroupingColumn={defaultRowGroupingColumn}
            isSaving={isSaving}
            disabled={disabled}
            showDelete={Boolean(editorValue)}
          />
        )}
        {editable && (
          <ManageViewsDialog
            open={manageOpen}
            onOpenChange={setManageOpen}
            views={views}
            hiddenViewIds={hiddenViewIds ?? []}
            onViewHide={onViewHide}
            onViewUnhide={onViewUnhide}
            onViewDelete={onViewDelete}
            onViewReorder={onViewReorder}
            disabled={disabled}
          />
        )}
      </>
    )
  }

  const orientation = variant === 'vertical-tabs' ? 'vertical' : 'horizontal'
  const showActiveMenu = Boolean(
    (editable || overflowTabViews.length > 0) && activeView,
  )

  return (
    <>
      <div
        data-slot="data-grid-view-select"
        className={cn(
          'flex gap-1',
          orientation === 'vertical' ? 'flex-col items-start' : 'items-center',
          className,
        )}
        {...props}
      >
        <Tabs
          value={activeViewId}
          onValueChange={onSelectView}
          orientation={orientation}
        >
          <TabsList variant="line">
            {tabViews.map((view) => {
              const isActive = view.id === activeViewId
              const renderMenu = isActive && showActiveMenu && activeView

              return (
                <div
                  key={view.id}
                  className={cn(
                    'relative flex items-stretch',
                    orientation === 'vertical' && 'w-full',
                  )}
                >
                  <TabsTrigger
                    value={view.id}
                    disabled={disabled}
                    className={cn(
                      'inline-flex items-center gap-1.5',
                      renderMenu && 'pr-9',
                    )}
                  >
                    <ViewIcon icon={view.icon} />
                    {view.name}
                  </TabsTrigger>
                  {renderMenu && (
                    <div className="absolute top-1/2 right-0.5 -translate-y-1/2">
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
                        onManageAllViews={openManageDialog}
                        editable={editable}
                        disabled={disabled}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </TabsList>
        </Tabs>
        {editable && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'size-7 shrink-0',
              orientation === 'vertical' && 'self-start',
            )}
            onClick={() => openEditorForCreate()}
            disabled={disabled}
            aria-label={t('ui.dataGridView.addView', 'Add view')}
          >
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
          defaultRowGroupingColumn={defaultRowGroupingColumn}
          isSaving={isSaving}
          disabled={disabled}
          showDelete={Boolean(editorValue)}
        />
      )}
      {editable && (
        <ManageViewsDialog
          open={manageOpen}
          onOpenChange={setManageOpen}
          views={views}
          hiddenViewIds={hiddenViewIds ?? []}
          onViewHide={onViewHide}
          onViewUnhide={onViewUnhide}
          onViewDelete={onViewDelete}
          onViewReorder={onViewReorder}
          disabled={disabled}
        />
      )}
    </>
  )
}

/*
 * ---------------------------------------------------------------------------
 * ActiveViewMenu — context menu for the active view
 * ---------------------------------------------------------------------------
 */

interface ActiveViewMenuProps {
  activeView: SavedDataGridView
  hiddenViews: Array<SavedDataGridView>
  overflowViews?: Array<SavedDataGridView>
  onConfigure: (view: SavedDataGridView) => void
  onSelectOverflowView?: (viewId: string) => void
  onViewHide?: (viewId: string) => void
  onViewUnhide?: (viewId: string) => void
  onViewDelete?: (viewId: string) => void
  onAddViewAfter: (position: { afterViewId: string }) => void
  onAddViewBefore: (position: { beforeViewId: string }) => void
  onManageAllViews: () => void
  editable?: boolean
  disabled?: boolean
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
}: ActiveViewMenuProps) {
  const { t } = useUiTranslation()
  /*
   * System views are developer-defined and immutable — they can be hidden
   * but not edited, duplicated/added-around, or deleted. Drop those menu
   * items so the user never sees an action they're not allowed to take.
   */
  const isSystem = activeView.isSystem === true
  const canEdit = editable && !isSystem

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          disabled={disabled}
          aria-label={t('ui.dataGridView.viewOptions', 'View options')}
        >
          <EllipsisVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {overflowViews && overflowViews.length > 0 && (
          <>
            {overflowViews.map((view) => (
              <DropdownMenuItem
                key={view.id}
                onSelect={() => onSelectOverflowView?.(view.id)}
              >
                <ViewIcon icon={view.icon} />
                {view.name}
              </DropdownMenuItem>
            ))}
            {editable && <DropdownMenuSeparator />}
          </>
        )}
        {editable && (
          <>
            {canEdit && (
              <DropdownMenuItem onSelect={() => onConfigure(activeView)}>
                <Settings2 />
                {t('ui.dataGridView.configure', 'Configure')}
              </DropdownMenuItem>
            )}
            {onViewHide && (
              <DropdownMenuItem onSelect={() => onViewHide(activeView.id)}>
                <EyeOff />
                {t('ui.dataGridView.hideView', 'Hide')}
              </DropdownMenuItem>
            )}
            {hiddenViews.length > 0 && onViewUnhide && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Eye />
                  {t('ui.dataGridView.hiddenViews', 'Hidden Views')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {hiddenViews.map((view) => (
                    <DropdownMenuItem
                      key={view.id}
                      onSelect={() => onViewUnhide(view.id)}
                    >
                      <ViewIcon icon={view.icon} />
                      {view.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {canEdit && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    onAddViewAfter({ afterViewId: activeView.id })
                  }
                >
                  <Plus />
                  {t('ui.dataGridView.addViewAfter', 'Add View After')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    onAddViewBefore({ beforeViewId: activeView.id })
                  }
                >
                  <Plus />
                  {t('ui.dataGridView.addViewBefore', 'Add View Before')}
                </DropdownMenuItem>
              </>
            )}
            {canEdit && onViewDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onViewDelete(activeView.id)}
                >
                  <Trash2 />
                  {t('ui.dataGridView.deleteView', 'Delete')}
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onManageAllViews}>
              <Layers />
              {t('ui.dataGridView.manageAllViews', 'Manage All Views')}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/*
 * ---------------------------------------------------------------------------
 * ViewIcon — renders a saved view's icon when present
 * ---------------------------------------------------------------------------
 */

interface ViewIconProps {
  icon: string | undefined
  className?: string
}

function ViewIcon({ icon, className }: ViewIconProps) {
  if (!icon) return null

  return (
    <DocyrusIcon icon={icon} className={cn('size-4 shrink-0', className)} />
  )
}

/*
 * ---------------------------------------------------------------------------
 * IconPicker — popover icon picker for saved view editor
 * ---------------------------------------------------------------------------
 */

type IconPickerLibrary = 'fontawesome' | 'hugeicons'

function getIconPickerLibrary(
  value: string | null | undefined,
): IconPickerLibrary {
  if (value?.startsWith('huge ')) return 'hugeicons'

  return 'fontawesome'
}

interface IconPickerProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
  disabled?: boolean
  className?: string
}

function IconPicker({ value, onChange, disabled, className }: IconPickerProps) {
  const { t } = useUiTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [library, setLibrary] = useState<IconPickerLibrary>(() =>
    getIconPickerLibrary(value),
  )

  const sourceIcons = library === 'hugeicons' ? hugeIcons : allIcons
  const featuredSource =
    library === 'hugeicons' ? featuredHugeIcons : featuredIcons

  const visibleIcons = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) return featuredSource

    return sourceIcons
      .filter((iconItem) => iconItem.toLowerCase().includes(query))
      .slice(0, 120)
  }, [featuredSource, search, sourceIcons])

  const onSelect = useCallback(
    (iconValue: string) => {
      onChange(iconValue)
      setOpen(false)
    },
    [onChange],
  )

  const onClear = useCallback(() => {
    onChange(undefined)
    setOpen(false)
  }, [onChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={t('ui.dataGridView.viewIcon', 'View icon')}
          disabled={disabled}
          className={cn('size-9 shrink-0', className)}
        >
          {value ? (
            <span style={{ stroke: 'currentColor' }}>
              <DocyrusIcon icon={value} className="size-4" />
            </span>
          ) : (
            <Layers className="text-muted-foreground size-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3">
        <div className="space-y-3">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant={library === 'fontawesome' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setLibrary('fontawesome')
                setSearch('')
              }}
            >
              {t('ui.formField.iconFontAwesome', 'Font Awesome')}
            </Button>
            <Button
              type="button"
              variant={library === 'hugeicons' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setLibrary('hugeicons')
                setSearch('')
              }}
            >
              {t('ui.formField.iconHugeIcons', 'Huge Icons')}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs"
                onClick={onClear}
              >
                {t('ui.dataGridView.clearIcon', 'Clear')}
              </Button>
            )}
          </div>

          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t(
                'ui.formField.iconSearchPlaceholder',
                'Search icon...',
              )}
              className="h-8 pl-8 text-xs"
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-0.5">
            <div className="grid grid-cols-6 gap-1">
              {visibleIcons.map((iconOption) => {
                const isSelected = value === iconOption

                return (
                  <button
                    key={iconOption}
                    type="button"
                    title={iconOption}
                    className={cn(
                      'text-foreground flex h-9 w-full items-center justify-center rounded-md transition-colors',
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-accent/60',
                    )}
                    style={{ stroke: 'currentColor' }}
                    onClick={() => onSelect(iconOption)}
                  >
                    <DocyrusIcon icon={iconOption} className="size-5" />
                  </button>
                )
              })}
            </div>

            {visibleIcons.length === 0 && (
              <p className="text-muted-foreground py-4 text-center text-xs">
                {t('ui.formField.iconNoIconsFound', 'No icons found.')}
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/*
 * ---------------------------------------------------------------------------
 * ManageViewsDialog — drag-reorder, hide/unhide, delete saved views
 * ---------------------------------------------------------------------------
 */

interface ManageViewsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  views: Array<SavedDataGridView>
  hiddenViewIds: Array<string>
  onViewHide?: (viewId: string) => void
  onViewUnhide?: (viewId: string) => void
  onViewDelete?: (viewId: string) => void
  onViewReorder?: (orderedViewIds: Array<string>) => void
  disabled?: boolean
}

function ManageViewsDialog({
  open,
  onOpenChange,
  views,
  hiddenViewIds,
  onViewHide,
  onViewUnhide,
  onViewDelete,
  onViewReorder,
  disabled,
}: ManageViewsDialogProps) {
  const { t } = useUiTranslation()

  const hiddenSet = useMemo(() => new Set(hiddenViewIds), [hiddenViewIds])

  const onReorder = useCallback(
    (reordered: Array<SavedDataGridView>) => {
      onViewReorder?.(reordered.map((v) => v.id))
    },
    [onViewReorder],
  )

  const onToggleHidden = useCallback(
    (view: SavedDataGridView) => {
      if (hiddenSet.has(view.id)) {
        onViewUnhide?.(view.id)
      } else {
        onViewHide?.(view.id)
      }
    },
    [hiddenSet, onViewHide, onViewUnhide],
  )

  const canReorder = Boolean(onViewReorder)
  const canHide = Boolean(onViewHide && onViewUnhide)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {t('ui.dataGridView.manageAllViews', 'Manage All Views')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'ui.dataGridView.manageAllViewsDescription',
              'Drag to reorder, hide views from the tab list, or delete saved views.',
            )}
          </DialogDescription>
        </DialogHeader>
        {views.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-xs">
            {t('ui.dataGridView.noViews', 'No views found.')}
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-md border p-2">
            <Sortable
              value={views}
              getItemValue={(item) => item.id}
              onValueChange={onReorder}
              orientation="vertical"
            >
              <SortableContent className="space-y-1">
                {views.map((view) => {
                  const isHidden = hiddenSet.has(view.id)
                  const isSystem = view.isSystem === true
                  const canDelete = Boolean(onViewDelete) && !isSystem
                  const hideLabelTemplate = isHidden
                    ? t('ui.dataGridView.showView', 'Show {view}')
                    : t('ui.dataGridView.hideView', 'Hide {view}')
                  const hideLabel = hideLabelTemplate.replace(
                    '{view}',
                    view.name,
                  )

                  return (
                    <SortableItem key={view.id} value={view.id} asChild>
                      <div
                        className={cn(
                          'bg-background flex items-center gap-2 rounded-sm border px-2 py-1',
                          isHidden && 'opacity-60',
                        )}
                      >
                        {canReorder ? (
                          <SortableItemHandle asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground size-7 shrink-0 cursor-grab active:cursor-grabbing"
                              disabled={disabled}
                              aria-label={t(
                                'ui.dataGridView.reorderView',
                                'Reorder {view}',
                              ).replace('{view}', view.name)}
                            >
                              <GripVertical className="size-4" />
                            </Button>
                          </SortableItemHandle>
                        ) : (
                          <div className="size-7 shrink-0" />
                        )}
                        <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm">
                          <ViewIcon icon={view.icon} />
                          <span className="truncate">{view.name}</span>
                          {isSystem && (
                            <Lock
                              className="text-muted-foreground size-3 shrink-0"
                              aria-label={t(
                                'ui.dataGridView.systemView',
                                'System view',
                              )}
                            />
                          )}
                        </span>
                        {canHide && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground size-7 shrink-0"
                            disabled={disabled}
                            onClick={() => onToggleHidden(view)}
                            aria-label={hideLabel}
                          >
                            {isHidden ? (
                              <EyeOff className="size-3.5" />
                            ) : (
                              <Eye className="size-3.5" />
                            )}
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive size-7 shrink-0"
                            disabled={disabled}
                            onClick={() => onViewDelete?.(view.id)}
                            aria-label={t(
                              'ui.dataGridView.deleteView',
                              'Delete {view}',
                            ).replace('{view}', view.name)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </SortableItem>
                  )
                })}
              </SortableContent>
              <SortableOverlay>
                <div className="bg-background flex items-center gap-2 rounded-sm border px-2 py-1">
                  <div className="bg-primary/10 size-7 rounded-sm" />
                  <div className="bg-primary/10 h-4 flex-1 rounded-sm" />
                  <div className="bg-primary/10 size-7 rounded-sm" />
                  <div className="bg-primary/10 size-7 rounded-sm" />
                </div>
              </SortableOverlay>
            </Sortable>
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              {t('ui.dataGridView.done', 'Done')}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/*
 * ---------------------------------------------------------------------------
 * DropdownVariant
 * ---------------------------------------------------------------------------
 */

interface DropdownVariantProps extends ComponentProps<'div'> {
  views: Array<SavedDataGridView>
  activeView: SavedDataGridView | undefined
  onSelectView: (viewId: string) => void
  disabled?: boolean
  placeholder: string
  editable: boolean
  hiddenViews: Array<SavedDataGridView>
  onOpenEditor: (view: SavedDataGridView) => void
  onOpenCreate: (position?: {
    afterViewId?: string
    beforeViewId?: string
  }) => void
  onOpenManage: () => void
  onViewHide?: (viewId: string) => void
  onViewUnhide?: (viewId: string) => void
  onViewDelete?: (viewId: string) => void
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
  className,
  ...props
}: DropdownVariantProps) {
  const { t } = useUiTranslation()
  const [open, setOpen] = useState(false)

  const onSelect = useCallback(
    (viewId: string) => {
      onSelectView(viewId)
      setOpen(false)
    },
    [onSelectView],
  )

  return (
    <div
      data-slot="data-grid-view-select"
      className={cn('flex items-center gap-1', className)}
      {...props}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 font-normal"
            disabled={disabled || views.length === 0}
          >
            {activeView?.icon ? (
              <ViewIcon icon={activeView.icon} />
            ) : (
              <Layers className="text-muted-foreground" />
            )}
            {activeView?.name ?? placeholder}
            {views.length > 0 && (
              <Badge
                variant="secondary"
                className="h-[18.24px] rounded-[3.2px] px-[5.12px] font-mono font-normal text-[10.4px]"
              >
                {views.length}
              </Badge>
            )}
            <ChevronsUpDown className="ml-auto opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-55 p-0">
          <Command>
            <CommandInput
              placeholder={t('ui.dataGridView.searchViews', 'Search views...')}
            />
            <CommandList>
              <CommandEmpty>
                {t('ui.dataGridView.noViews', 'No views found.')}
              </CommandEmpty>
              <CommandGroup>
                {views.map((view) => (
                  <CommandItem
                    key={view.id}
                    value={view.id}
                    keywords={[view.name]}
                    onSelect={onSelect}
                  >
                    <ViewIcon icon={view.icon} />
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
                    keywords={[t('ui.dataGridView.addView', 'Add view')]}
                    onSelect={() => {
                      setOpen(false)
                      onOpenCreate()
                    }}
                  >
                    <Plus className="text-muted-foreground" />
                    <span>{t('ui.dataGridView.addView', 'Add view')}</span>
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
        />
      )}
    </div>
  )
}

/*
 * ---------------------------------------------------------------------------
 * ViewEditorDialog (exported also as DataGridViewEditor for backward compat)
 * ---------------------------------------------------------------------------
 */

interface ViewEditorDialogProps<TData> extends Omit<
  ComponentProps<typeof DialogContent>,
  'children'
> {
  table: Table<TData>
  open?: boolean
  onOpenChange?: (open: boolean) => void
  value?: SavedDataGridView
  views?: Array<SavedDataGridView>
  onSave?: (view: SavedDataGridView) => void
  onDelete?: (viewId: string) => void
  onCancel?: () => void
  onViewSwitch?: (viewId: string) => void
  fields?: Array<FullField>
  defaultRowGroupingColumn?: string
  /**
   * `true` while a save request is in flight. The dialog stays open with a
   * "Saving…" overlay until this flips back to `false`, then auto-closes.
   * When omitted, the dialog closes synchronously on Save.
   */
  isSaving?: boolean
  disabled?: boolean
  showDelete?: boolean
  trigger?: ReactNode
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
    filterQuery: { ...DEFAULT_FILTER_QUERY },
    pagingEnabled: true,
    pagingMode: 'standard',
    pageSize: DATA_GRID_DEFAULT_PAGE_SIZE,
  }
}

function buildDraftColumns<TData>(
  table: Table<TData>,
  value: SavedDataGridView | undefined,
): Array<DraftColumn> {
  const managed = getManagedColumns(table)
  const allLeafColumns = table.getAllLeafColumns()

  const columnOrder =
    value?.columnOrder ??
    (table.getState().columnOrder.length > 0
      ? table.getState().columnOrder
      : allLeafColumns.map((c) => c.id))

  const columnVisibility =
    value?.columnVisibility ?? table.getState().columnVisibility

  const managedMap = new Map(managed.map((c) => [c.id, c]))

  const ordered: Array<DraftColumn> = []
  const seen = new Set<string>()

  for (const id of columnOrder) {
    const column = managedMap.get(id)

    if (!column) continue

    seen.add(id)

    ordered.push({
      id: column.id,
      label: getColumnLabel(column),
      visible: columnVisibility[column.id] !== false,
      canHide: column.getCanHide(),
      selected: true,
      group: column.columnDef.meta?.group,
      forcedReadOnly: column.columnDef.meta?.forcedReadOnly === true,
    })
  }

  for (const column of managed) {
    if (seen.has(column.id)) continue

    ordered.push({
      id: column.id,
      label: getColumnLabel(column),
      visible: columnVisibility[column.id] !== false,
      canHide: column.getCanHide(),
      selected: false,
      group: column.columnDef.meta?.group,
      forcedReadOnly: column.columnDef.meta?.forcedReadOnly === true,
    })
  }

  return ordered
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
  defaultRowGroupingColumn,
  isSaving,
  disabled,
  showDelete,
  trigger,
  className,
  ...dialogContentProps
}: ViewEditorDialogProps<TData>) {
  const { t } = useUiTranslation()
  const id = useId()
  const isEditing = Boolean(value)

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const onOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen)
      }

      controlledOnOpenChange?.(nextOpen)
    },
    [isControlled, controlledOnOpenChange],
  )

  const [draftName, setDraftName] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftIcon, setDraftIcon] = useState<string | undefined>(undefined)
  const [draftColumns, setDraftColumns] = useState<Array<DraftColumn>>([])
  const [draftSorting, setDraftSorting] = useState<Array<ColumnSort>>([])
  const [draftFilterQuery, setDraftFilterQuery] =
    useState<RuleGroupType>(DEFAULT_FILTER_QUERY)
  const [draftRowColorRules, setDraftRowColorRules] = useState<
    Array<DraftRowColorRule>
  >([])
  const [draftCellColorRules, setDraftCellColorRules] = useState<
    Array<DraftCellColorRule>
  >([])
  const [draftGrouping, setDraftGrouping] = useState<string | undefined>()
  const [draftRowHeight, setDraftRowHeight] = useState<RowHeightValue>('short')
  const [draftDisplayMode, setDraftDisplayMode] =
    useState<DataGridDisplayMode>('table')
  const [draftPagingEnabled, setDraftPagingEnabled] = useState<boolean>(true)
  const [draftPagingMode, setDraftPagingMode] =
    useState<DataGridPagingMode>('standard')
  const [draftPageSize, setDraftPageSize] = useState<number>(
    DATA_GRID_DEFAULT_PAGE_SIZE,
  )
  const [draftInlineEditingEnabled, setDraftInlineEditingEnabled] =
    useState<boolean>(false)
  const [draftReadOnlyColumns, setDraftReadOnlyColumns] = useState<
    Array<string>
  >([])

  const initDraft = useCallback(() => {
    if (value) {
      setDraftName(value.name)
      setDraftDescription(value.description ?? '')
      setDraftIcon(value.icon)
      setDraftSorting(value.sorting ? [...value.sorting] : [])
      setDraftFilterQuery(value.filterQuery ?? { ...DEFAULT_FILTER_QUERY })
      setDraftRowColorRules(
        value.rowColorRules?.map((rule, i) => ({ ...rule, id: `rcr-${i}` })) ??
          [],
      )
      setDraftCellColorRules(
        value.cellColorRules?.map((rule, i) => ({ ...rule, id: `ccr-${i}` })) ??
          [],
      )
      setDraftGrouping(value.grouping?.[0])
      setDraftRowHeight(value.rowHeight ?? 'short')
      setDraftDisplayMode(value.displayMode ?? 'table')
      setDraftPagingEnabled(value.pagingEnabled ?? true)
      setDraftPagingMode('standard')
      setDraftPageSize(value.pageSize ?? DATA_GRID_DEFAULT_PAGE_SIZE)
      setDraftInlineEditingEnabled(value.inlineEditingEnabled ?? false)
      setDraftReadOnlyColumns(
        value.readOnlyColumns ? [...value.readOnlyColumns] : [],
      )
    } else {
      const empty = createEmptyDraft()

      setDraftName(empty.name)
      setDraftDescription(empty.description ?? '')
      setDraftIcon(undefined)
      setDraftSorting([])
      setDraftFilterQuery({ ...DEFAULT_FILTER_QUERY })
      setDraftRowColorRules([])
      setDraftCellColorRules([])
      setDraftGrouping(undefined)
      setDraftRowHeight(table.options.meta?.rowHeight ?? 'short')
      setDraftDisplayMode(table.options.meta?.displayMode ?? 'table')
      setDraftPagingEnabled(empty.pagingEnabled ?? true)
      setDraftPagingMode(empty.pagingMode ?? 'standard')
      setDraftPageSize(DATA_GRID_DEFAULT_PAGE_SIZE)
      setDraftInlineEditingEnabled(false)
      setDraftReadOnlyColumns([])
    }

    setDraftColumns(buildDraftColumns(table, value))
  }, [table, value])

  const prevOpenRef = useRef(open)

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      initDraft()
    }

    prevOpenRef.current = open
  }, [open, initDraft])

  const onDialogOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        initDraft()
      }

      onOpenChange(nextOpen)
    },
    [initDraft, onOpenChange],
  )

  const onSaveClick = useCallback(() => {
    const selectedCols = draftColumns.filter((col) => col.selected)
    const columnVisibility: Record<string, boolean> = {}
    const columnOrder: Array<string> = []

    for (const col of selectedCols) {
      columnVisibility[col.id] = col.visible
      columnOrder.push(col.id)
    }

    const trimmedIcon = draftIcon?.trim()

    const savedView: SavedDataGridView = {
      id: value?.id ?? getGeneratedViewId(),
      name: draftName.trim(),
      description: draftDescription.trim() || undefined,
      icon: trimmedIcon ? trimmedIcon : undefined,
      columnVisibility,
      columnOrder,
      columnPinning: value?.columnPinning ?? { left: [], right: [] },
      rowHeight: draftRowHeight,
      displayMode: draftDisplayMode,
      sorting: draftSorting.length > 0 ? draftSorting : undefined,
      columnFilters: value?.columnFilters,
      grouping: draftGrouping ? [draftGrouping] : undefined,
      filterQuery:
        draftFilterQuery.rules.length > 0 ? draftFilterQuery : undefined,
      rowColorRules:
        draftRowColorRules.length > 0
          ? draftRowColorRules.map(({ id: _id, ...rule }) => rule)
          : undefined,
      cellColorRules:
        draftCellColorRules.length > 0
          ? draftCellColorRules.map(({ id: _id, ...rule }) => rule)
          : undefined,
      pagingEnabled: draftPagingEnabled || undefined,
      pagingMode: draftPagingEnabled ? draftPagingMode : undefined,
      pageSize: draftPagingEnabled ? draftPageSize : undefined,
      inlineEditingEnabled: draftInlineEditingEnabled || undefined,
      /*
       * Persist only the user-toggled read-only list. Forced-read-only
       * columns (id / autonumber / metadata-locked) are recomputed at
       * apply time and don't need to be redundantly stored.
       */
      readOnlyColumns:
        draftInlineEditingEnabled && draftReadOnlyColumns.length > 0
          ? [...draftReadOnlyColumns]
          : undefined,
    }

    onSave?.(savedView)

    /*
     * When `isSaving` is controlled by the host (e.g. `useDocyrusDataViewSelect`
     * exposes the create/update mutation pending state), keep the dialog open
     * so the saving overlay is visible. The effect below auto-closes once
     * `isSaving` flips back to `false`. Without that prop, fall back to the
     * legacy "close immediately on save click" behavior.
     */
    if (isSaving === undefined) {
      onOpenChange(false)
    } else {
      pendingSaveRef.current = true
    }
  }, [
    draftPagingEnabled,
    draftPagingMode,
    draftPageSize,
    draftInlineEditingEnabled,
    draftReadOnlyColumns,
    draftColumns,
    draftName,
    draftDescription,
    draftIcon,
    draftSorting,
    draftFilterQuery,
    draftRowColorRules,
    draftCellColorRules,
    draftGrouping,
    draftRowHeight,
    draftDisplayMode,
    value,
    onSave,
    onOpenChange,
    isSaving,
  ])

  /*
   * Auto-close the dialog when an in-flight save completes. We only close on
   * the saving=true → saving=false transition so the dialog doesn't slam shut
   * if the host's `isSaving` was already false at click time.
   */
  const pendingSaveRef = useRef(false)

  useEffect(() => {
    if (isSaving) {
      pendingSaveRef.current = true

      return
    }

    if (pendingSaveRef.current) {
      pendingSaveRef.current = false
      onOpenChange(false)
    }
  }, [isSaving, onOpenChange])

  const onDeleteClick = useCallback(() => {
    if (!value?.id) return

    onDelete?.(value.id)
    onOpenChange(false)
  }, [value, onDelete, onOpenChange])

  const onCancelClick = useCallback(() => {
    onCancel?.()
    onOpenChange(false)
  }, [onCancel, onOpenChange])

  const onColumnVisibilityChange = useCallback(
    (columnId: string, visible: boolean) => {
      setDraftColumns((prev) =>
        prev.map((col) => (col.id === columnId ? { ...col, visible } : col)),
      )
    },
    [],
  )

  const onColumnSelectedChange = useCallback(
    (columnId: string, selected: boolean) => {
      setDraftColumns((prev) =>
        prev.map((col) => (col.id === columnId ? { ...col, selected } : col)),
      )
    },
    [],
  )

  const onPagingEnabledChange = useCallback((enabled: boolean) => {
    setDraftPagingEnabled(enabled)

    if (enabled) setDraftPagingMode('standard')
  }, [])

  const canSave = draftName.trim().length > 0

  /*
   * System views can't be edited, so leaving them in the editor's switcher
   * would break expectations (you'd flip to a system view but the form
   * would still show Save / Delete). Filter them out for the dropdown only.
   */
  const switchableViews = useMemo(
    () => (views ?? []).filter((view) => !view.isSystem),
    [views],
  )
  const showViewSwitcher = isEditing && switchableViews.length > 1

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        className={cn('sm:max-w-270 gap-0 p-0', className)}
        {...dialogContentProps}
      >
        {isSaving && (
          <div
            data-slot="grid-view-editor-saving-overlay"
            aria-live="polite"
            className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-background/70 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-md">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>{t('ui.dataGridView.saving', 'Saving…')}</span>
            </div>
          </div>
        )}
        <DialogHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            {showViewSwitcher && (
              <Select
                value={value?.id ?? ''}
                onValueChange={(viewId) => onViewSwitch?.(viewId)}
              >
                <SelectTrigger size="sm" className="w-48">
                  <SelectValue
                    placeholder={t('ui.dataGridView.switchView', 'Switch view')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {switchableViews.map((view) => (
                    <SelectItem key={view.id} value={view.id}>
                      <span className="inline-flex items-center gap-1.5">
                        <ViewIcon icon={view.icon} />
                        {view.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex-1">
              <DialogTitle>
                {isEditing
                  ? t('ui.dataGridView.editView', 'Edit view')
                  : t('ui.dataGridView.newView', 'New view')}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? t(
                      'ui.dataGridView.editViewDescription',
                      'Modify the view configuration.',
                    )
                  : t(
                      'ui.dataGridView.newViewDescription',
                      'Configure a new view for your data grid.',
                    )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <EditorBody
          id={id}
          table={table}
          draftName={draftName}
          draftDescription={draftDescription}
          draftIcon={draftIcon}
          draftColumns={draftColumns}
          draftSorting={draftSorting}
          draftFilterQuery={draftFilterQuery}
          draftRowColorRules={draftRowColorRules}
          draftCellColorRules={draftCellColorRules}
          draftGrouping={draftGrouping}
          draftRowHeight={draftRowHeight}
          draftDisplayMode={draftDisplayMode}
          draftPagingEnabled={draftPagingEnabled}
          draftPagingMode={draftPagingMode}
          draftPageSize={draftPageSize}
          draftInlineEditingEnabled={draftInlineEditingEnabled}
          draftReadOnlyColumns={draftReadOnlyColumns}
          onNameChange={setDraftName}
          onDescriptionChange={setDraftDescription}
          onIconChange={setDraftIcon}
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
          onPagingEnabledChange={onPagingEnabledChange}
          onPagingModeChange={setDraftPagingMode}
          onPageSizeChange={setDraftPageSize}
          onInlineEditingEnabledChange={setDraftInlineEditingEnabled}
          onReadOnlyColumnsChange={setDraftReadOnlyColumns}
          fields={fields}
          defaultRowGroupingColumn={defaultRowGroupingColumn}
          disabled={disabled}
        />

        <DialogFooter className="border-t px-6 py-4">
          {showDelete && isEditing && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteClick}
              disabled={disabled}
              className="mr-auto"
            >
              <Trash2 />
              {t('ui.dataGridView.deleteView', 'Delete')}
            </Button>
          )}
          <DialogClose asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancelClick}
              disabled={disabled || isSaving}
            >
              {t('ui.dataGridView.cancel', 'Cancel')}
            </Button>
          </DialogClose>
          <Button
            size="sm"
            onClick={onSaveClick}
            disabled={disabled || !canSave || isSaving}
          >
            {isSaving && <Loader2 className="size-4 animate-spin" />}
            {t('ui.dataGridView.saveView', 'Save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
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
  rowGrouping: 'rowGrouping',
  paging: 'paging',
  inlineEditing: 'inlineEditing',
  filters: 'filters',
  rowColorRules: 'rowColorRules',
  cellColorRules: 'cellColorRules',
} as const

interface DraftRowColorRule extends DataGridRowColorRule {
  id: string
}
interface DraftCellColorRule extends DataGridCellColorRule {
  id: string
}

interface EditorBodyProps<TData> {
  id: string
  table: Table<TData>
  draftName: string
  draftDescription: string
  draftIcon: string | undefined
  draftColumns: Array<DraftColumn>
  draftSorting: Array<ColumnSort>
  draftFilterQuery: RuleGroupType
  draftRowColorRules: Array<DraftRowColorRule>
  draftCellColorRules: Array<DraftCellColorRule>
  draftGrouping: string | undefined
  draftRowHeight: RowHeightValue
  draftDisplayMode: DataGridDisplayMode
  draftPagingEnabled: boolean
  draftPagingMode: DataGridPagingMode
  draftPageSize: number
  draftInlineEditingEnabled: boolean
  draftReadOnlyColumns: Array<string>
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  onIconChange: (icon: string | undefined) => void
  onColumnsChange: (columns: Array<DraftColumn>) => void
  onColumnVisibilityChange: (columnId: string, visible: boolean) => void
  onColumnSelectedChange: (columnId: string, selected: boolean) => void
  onSortingChange: (sorting: Array<ColumnSort>) => void
  onFilterQueryChange: (query: RuleGroupType) => void
  onRowColorRulesChange: (rules: Array<DraftRowColorRule>) => void
  onCellColorRulesChange: (rules: Array<DraftCellColorRule>) => void
  onGroupingChange: (grouping: string | undefined) => void
  onRowHeightChange: (rowHeight: RowHeightValue) => void
  onDisplayModeChange: (displayMode: DataGridDisplayMode) => void
  onPagingEnabledChange: (enabled: boolean) => void
  onPagingModeChange: (mode: DataGridPagingMode) => void
  onPageSizeChange: (size: number) => void
  onInlineEditingEnabledChange: (enabled: boolean) => void
  onReadOnlyColumnsChange: (columns: Array<string>) => void
  fields?: Array<FullField>
  defaultRowGroupingColumn?: string
  disabled?: boolean
}

function EditorBody<TData>({
  id,
  table,
  draftName,
  draftDescription,
  draftIcon,
  draftColumns,
  draftSorting,
  draftFilterQuery,
  draftRowColorRules,
  draftCellColorRules,
  draftGrouping,
  draftRowHeight,
  draftDisplayMode,
  draftPagingEnabled,
  draftPagingMode,
  draftPageSize,
  draftInlineEditingEnabled,
  draftReadOnlyColumns,
  onNameChange,
  onDescriptionChange,
  onIconChange,
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
  onPagingEnabledChange,
  onPagingModeChange,
  onPageSizeChange,
  onInlineEditingEnabledChange,
  onReadOnlyColumnsChange,
  fields,
  defaultRowGroupingColumn,
  disabled,
}: EditorBodyProps<TData>) {
  const { t } = useUiTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState<string>(
    SECTION_IDS.general,
  )

  const hasFilters = fields && fields.length > 0

  const sections = useMemo(() => {
    const base: Array<{ id: string; label: string; icon: typeof Settings2 }> = [
      {
        id: SECTION_IDS.general,
        label: t('ui.dataGridView.general', 'General'),
        icon: Settings2,
      },
      {
        id: SECTION_IDS.columns,
        label: t('ui.dataGridView.columns', 'Columns'),
        icon: Columns3,
      },
      {
        id: SECTION_IDS.sorting,
        label: t('ui.dataGridView.sorting', 'Sorting'),
        icon: ArrowUpDown,
      },
      {
        id: SECTION_IDS.rowGrouping,
        label: t('ui.dataGridView.rowGrouping', 'Row Grouping'),
        icon: Layers,
      },
      {
        id: SECTION_IDS.paging,
        label: t('ui.dataGridView.paging', 'Paging'),
        icon: Layers,
      },
      {
        id: SECTION_IDS.inlineEditing,
        label: t('ui.dataGridView.inlineEditing', 'Inline Editing'),
        icon: Pencil,
      },
    ]

    if (hasFilters) {
      base.push({
        id: SECTION_IDS.filters,
        label: t('ui.dataGridView.filters', 'Filters'),
        icon: Settings2,
      })
    }

    base.push(
      {
        id: SECTION_IDS.rowColorRules,
        label: t('ui.dataGridView.rowColorRules', 'Row Color Rules'),
        icon: Paintbrush,
      },
      {
        id: SECTION_IDS.cellColorRules,
        label: t('ui.dataGridView.cellColorRules', 'Cell Color Rules'),
        icon: Paintbrush,
      },
    )

    return base
  }, [hasFilters, t])

  const scrollToSection = useCallback((sectionId: string) => {
    const el = scrollRef.current?.querySelector(`[data-section="${sectionId}"]`)

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    setActiveSection(sectionId)
  }, [])

  const onScroll = useCallback(() => {
    const container = scrollRef.current

    if (!container) return

    const containerTop = container.getBoundingClientRect().top
    let current: string = SECTION_IDS.general

    for (const section of sections) {
      const el = container.querySelector(`[data-section="${section.id}"]`)

      if (!el) continue

      const elTop = el.getBoundingClientRect().top - containerTop

      if (elTop <= 8) {
        current = section.id
      }
    }

    setActiveSection(current)
  }, [sections])

  return (
    <div className="flex max-h-[60vh] border-t">
      <nav className="flex w-40 shrink-0 flex-col gap-0.5 border-r bg-muted p-2">
        {sections.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollToSection(section.id)}
            className={cn(
              'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm font-medium transition-colors',
              activeSection === section.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
            )}
          >
            <section.icon className="size-4 shrink-0" />
            {section.label}
          </button>
        ))}
      </nav>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6"
        onScroll={onScroll}
      >
        <div className="flex flex-col gap-6 py-6">
          <div data-section={SECTION_IDS.general}>
            <TitleSection
              id={id}
              name={draftName}
              description={draftDescription}
              icon={draftIcon}
              rowHeight={draftRowHeight}
              displayMode={draftDisplayMode}
              onNameChange={onNameChange}
              onDescriptionChange={onDescriptionChange}
              onIconChange={onIconChange}
              onRowHeightChange={onRowHeightChange}
              onDisplayModeChange={onDisplayModeChange}
              disabled={disabled}
            />
          </div>

          <div data-section={SECTION_IDS.columns}>
            <DualColumnPicker
              columns={draftColumns}
              onColumnsChange={onColumnsChange}
              onVisibilityChange={onColumnVisibilityChange}
              onSelectedChange={onColumnSelectedChange}
              disabled={disabled}
            />
          </div>

          <div data-section={SECTION_IDS.sorting}>
            <SortSection
              id={id}
              table={table}
              sorting={draftSorting}
              onSortingChange={onSortingChange}
              disabled={disabled}
            />
          </div>

          <div data-section={SECTION_IDS.rowGrouping}>
            <RowGroupingSection
              id={id}
              table={table}
              grouping={draftGrouping}
              defaultRowGroupingColumn={defaultRowGroupingColumn}
              onGroupingChange={onGroupingChange}
              disabled={disabled}
            />
          </div>

          <div data-section={SECTION_IDS.paging}>
            <PagingSection
              id={id}
              enabled={draftPagingEnabled}
              mode={draftPagingMode}
              pageSize={draftPageSize}
              onEnabledChange={onPagingEnabledChange}
              onModeChange={onPagingModeChange}
              onPageSizeChange={onPageSizeChange}
              disabled={disabled}
            />
          </div>

          <div data-section={SECTION_IDS.inlineEditing}>
            <InlineEditingSection
              id={id}
              enabled={draftInlineEditingEnabled}
              readOnlyColumns={draftReadOnlyColumns}
              columns={draftColumns}
              onEnabledChange={onInlineEditingEnabledChange}
              onReadOnlyColumnsChange={onReadOnlyColumnsChange}
              disabled={disabled}
            />
          </div>

          {hasFilters && (
            <div data-section={SECTION_IDS.filters}>
              <FilterSection
                fields={fields}
                query={draftFilterQuery}
                onQueryChange={onFilterQueryChange}
                disabled={disabled}
              />
            </div>
          )}

          <div data-section={SECTION_IDS.rowColorRules}>
            <RowColorRulesSection
              rules={draftRowColorRules}
              onRulesChange={onRowColorRulesChange}
              disabled={disabled}
            />
          </div>

          <div data-section={SECTION_IDS.cellColorRules}>
            <CellColorRulesSection
              rules={draftCellColorRules}
              onRulesChange={onCellColorRulesChange}
              columns={draftColumns}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/*
 * ---------------------------------------------------------------------------
 * TitleSection
 * ---------------------------------------------------------------------------
 */

interface TitleSectionProps {
  id: string
  name: string
  description: string
  icon: string | undefined
  rowHeight: RowHeightValue
  displayMode: DataGridDisplayMode
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  onIconChange: (icon: string | undefined) => void
  onRowHeightChange: (rowHeight: RowHeightValue) => void
  onDisplayModeChange: (displayMode: DataGridDisplayMode) => void
  disabled?: boolean
}

const ROW_HEIGHT_OPTIONS: Array<{
  value: RowHeightValue
  labelKey: string
  labelFallback: string
}> = [
  { value: 'short', labelKey: 'ui.dataGridView.short', labelFallback: 'Short' },
  {
    value: 'medium',
    labelKey: 'ui.dataGridView.medium',
    labelFallback: 'Medium',
  },
  { value: 'tall', labelKey: 'ui.dataGridView.tall', labelFallback: 'Tall' },
  {
    value: 'extra-tall',
    labelKey: 'ui.dataGridView.extraTall',
    labelFallback: 'Extra Tall',
  },
]

function TitleSection({
  id,
  name,
  description,
  icon,
  rowHeight,
  displayMode,
  onNameChange,
  onDescriptionChange,
  onIconChange,
  onRowHeightChange,
  onDisplayModeChange,
  disabled,
}: TitleSectionProps) {
  const { t } = useUiTranslation()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-name`}>
          {t('ui.dataGridView.viewName', 'Name')}
        </Label>
        <div className="flex items-stretch gap-2">
          <IconPicker
            value={icon}
            onChange={onIconChange}
            disabled={disabled}
          />
          <Input
            id={`${id}-name`}
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t('ui.dataGridView.viewNamePlaceholder', 'View name')}
            disabled={disabled}
            className="flex-1"
            autoFocus
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-description`}>
          {t('ui.dataGridView.viewDescription', 'Description')}
        </Label>
        <Textarea
          id={`${id}-description`}
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t(
            'ui.dataGridView.viewDescriptionPlaceholder',
            'Optional description',
          )}
          disabled={disabled}
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={`${id}-row-height`}>
            {t('ui.dataGridView.rowHeight', 'Row Height')}
          </Label>
          <Select
            value={rowHeight}
            onValueChange={(v) => onRowHeightChange(v as RowHeightValue)}
            disabled={disabled}
          >
            <SelectTrigger id={`${id}-row-height`} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROW_HEIGHT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(opt.labelKey, opt.labelFallback)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={`${id}-display-mode`}>
            {t('ui.dataGridView.displayMode', 'Display Mode')}
          </Label>
          <Select
            value={displayMode}
            onValueChange={(v) => onDisplayModeChange(v as DataGridDisplayMode)}
            disabled={disabled}
          >
            <SelectTrigger id={`${id}-display-mode`} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">
                {t('ui.dataGridView.table', 'Table')}
              </SelectItem>
              <SelectItem value="gallery">
                {t('ui.dataGridView.gallery', 'Gallery')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

/*
 * ---------------------------------------------------------------------------
 * DualColumnPicker — two-box column selection with groups
 * ---------------------------------------------------------------------------
 */

interface DualColumnPickerProps {
  columns: Array<DraftColumn>
  onColumnsChange: (columns: Array<DraftColumn>) => void
  onVisibilityChange: (columnId: string, visible: boolean) => void
  onSelectedChange: (columnId: string, selected: boolean) => void
  disabled?: boolean
}

const DEFAULT_GROUP_KEY = '__default__'

interface ColumnGroup {
  key: string
  label: string
  columns: Array<DraftColumn>
}

function DualColumnPicker({
  columns,
  onColumnsChange,
  onVisibilityChange,
  onSelectedChange,
  disabled,
}: DualColumnPickerProps) {
  const { t } = useUiTranslation()

  const [availableSearch, setAvailableSearch] = useState('')
  const [selectedSearch, setSelectedSearch] = useState('')

  const availableColumns = useMemo(
    () => columns.filter((col) => !col.selected),
    [columns],
  )

  const selectedColumns = useMemo(
    () => columns.filter((col) => col.selected),
    [columns],
  )

  const availableGroups = useMemo(() => {
    const groupMap = new Map<string, Array<DraftColumn>>()
    const searchLower = availableSearch.toLowerCase()

    for (const col of availableColumns) {
      if (searchLower && !col.label.toLowerCase().includes(searchLower))
        continue

      const groupKey = col.group ?? DEFAULT_GROUP_KEY

      const existing = groupMap.get(groupKey)

      if (existing) {
        existing.push(col)
      } else {
        groupMap.set(groupKey, [col])
      }
    }

    const groups: Array<ColumnGroup> = []

    for (const [key, cols] of groupMap) {
      groups.push({
        key,
        label:
          key === DEFAULT_GROUP_KEY
            ? t('ui.dataGridView.columns', 'Columns')
            : key,
        columns: cols,
      })
    }

    return groups
  }, [availableColumns, availableSearch, t])

  const filteredSelectedColumns = useMemo(() => {
    if (!selectedSearch) return selectedColumns

    const searchLower = selectedSearch.toLowerCase()

    return selectedColumns.filter((col) =>
      col.label.toLowerCase().includes(searchLower),
    )
  }, [selectedColumns, selectedSearch])

  const onAddToSelected = useCallback(
    (columnId: string) => {
      onSelectedChange(columnId, true)
    },
    [onSelectedChange],
  )

  const onRemoveFromSelected = useCallback(
    (columnId: string) => {
      onSelectedChange(columnId, false)
    },
    [onSelectedChange],
  )

  const onSelectedColumnsReorder = useCallback(
    (reordered: Array<DraftColumn>) => {
      const reorderedIds = reordered.map((c) => c.id)
      const reorderedSet = new Set(reorderedIds)

      const next = [
        ...reordered,
        ...columns.filter((c) => !reorderedSet.has(c.id)),
      ]

      onColumnsChange(next)
    },
    [columns, onColumnsChange],
  )

  return (
    <div className="flex flex-col gap-2">
      <Label>{t('ui.dataGridView.columns', 'Columns')}</Label>
      <div className="flex gap-3">
        {/* Left: Available Columns */}
        <div className="flex flex-1 flex-col rounded-md border">
          <div className="border-b px-3 py-2">
            <span className="text-muted-foreground text-xs font-medium">
              {t('ui.dataGridView.availableColumns', 'Available Columns')}
            </span>
          </div>
          <div className="px-2 pt-2">
            <Input
              value={availableSearch}
              onChange={(e) => setAvailableSearch(e.target.value)}
              placeholder={t(
                'ui.dataGridView.searchAvailable',
                'Search available...',
              )}
              className="h-7 text-xs"
              disabled={disabled}
            />
          </div>
          <div className="min-h-30 max-h-70 overflow-y-auto p-2">
            {availableGroups.length === 0 && (
              <p className="text-muted-foreground py-3 text-center text-xs">
                {t(
                  'ui.dataGridView.noAvailableColumns',
                  'No available columns.',
                )}
              </p>
            )}
            {availableGroups.map((group) => (
              <AvailableGroup
                key={group.key}
                group={group}
                onAdd={onAddToSelected}
                disabled={disabled}
                defaultOpen={availableGroups.length <= 3}
              />
            ))}
          </div>
        </div>

        {/* Right: Selected Columns */}
        <div className="flex flex-1 flex-col rounded-md border">
          <div className="border-b px-3 py-2">
            <span className="text-muted-foreground text-xs font-medium">
              {t('ui.dataGridView.selectedColumns', 'Selected Columns')}
            </span>
          </div>
          <div className="px-2 pt-2">
            <Input
              value={selectedSearch}
              onChange={(e) => setSelectedSearch(e.target.value)}
              placeholder={t(
                'ui.dataGridView.searchSelected',
                'Search selected...',
              )}
              className="h-7 text-xs"
              disabled={disabled}
            />
          </div>
          <div className="min-h-30 max-h-70 overflow-y-auto p-2">
            {selectedColumns.length === 0 && (
              <p className="text-muted-foreground py-3 text-center text-xs">
                {t('ui.dataGridView.noSelectedColumns', 'No selected columns.')}
              </p>
            )}
            <Sortable
              value={selectedColumns}
              getItemValue={(item) => item.id}
              onValueChange={onSelectedColumnsReorder}
              orientation="vertical"
            >
              <SortableContent className="space-y-1">
                {filteredSelectedColumns.map((column) => (
                  <SortableItem key={column.id} value={column.id} asChild>
                    <div
                      className={cn(
                        'flex items-center gap-2 rounded-sm border px-2 py-1',
                        !column.visible && 'opacity-50',
                      )}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-muted-foreground"
                        onClick={() => onRemoveFromSelected(column.id)}
                        disabled={disabled}
                        aria-label={t(
                          'ui.dataGridView.removeColumn',
                          'Remove {column}',
                        ).replace('{column}', column.label)}
                      >
                        <CircleMinus className="size-4" />
                      </Button>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {column.label}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-muted-foreground"
                        onClick={() =>
                          onVisibilityChange(column.id, !column.visible)
                        }
                        disabled={disabled || !column.canHide}
                        aria-label={t(
                          'ui.dataGridView.toggleColumnVisibility',
                          'Toggle {column} visibility',
                        ).replace('{column}', column.label)}
                      >
                        {column.visible ? (
                          <Eye className="size-3.5" />
                        ) : (
                          <EyeOff className="size-3.5" />
                        )}
                      </Button>
                      <SortableItemHandle asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground"
                          disabled={disabled}
                          aria-label={t(
                            'ui.dataGridView.reorderColumn',
                            'Reorder {column}',
                          ).replace('{column}', column.label)}
                        >
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
  )
}

/*
 * ---------------------------------------------------------------------------
 * AvailableGroup — collapsible group in left column picker
 * ---------------------------------------------------------------------------
 */

interface AvailableGroupProps {
  group: ColumnGroup
  onAdd: (columnId: string) => void
  disabled?: boolean
  defaultOpen?: boolean
}

function AvailableGroup({
  group,
  onAdd,
  disabled,
  defaultOpen = true,
}: AvailableGroupProps) {
  const { t } = useUiTranslation()

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1 py-1 text-xs font-medium transition-colors [&[data-state=open]>svg:first-child]:rotate-90"
        >
          <ChevronRight className="size-3 transition-transform" />
          {group.label}
          <span className="text-muted-foreground/60 ml-auto text-[10px]">
            {group.columns.length}
          </span>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-0.5 pb-1 pl-1">
          {group.columns.map((column) => (
            <div
              key={column.id}
              className="flex items-center gap-2 rounded-sm px-1.5 py-1"
            >
              <span className="min-w-0 flex-1 truncate text-sm">
                {column.label}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto size-7 shrink-0 text-muted-foreground"
                onClick={() => onAdd(column.id)}
                disabled={disabled}
                aria-label={t(
                  'ui.dataGridView.addColumn',
                  'Add {column}',
                ).replace('{column}', column.label)}
              >
                <CirclePlus className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/*
 * ---------------------------------------------------------------------------
 * SortSection
 * ---------------------------------------------------------------------------
 */

interface SortSectionProps<TData> {
  id: string
  table: Table<TData>
  sorting: Array<ColumnSort>
  onSortingChange: (sorting: Array<ColumnSort>) => void
  disabled?: boolean
}

function SortSection<TData>({
  id,
  table,
  sorting,
  onSortingChange,
  disabled,
}: SortSectionProps<TData>) {
  const { t } = useUiTranslation()

  const { columnLabels, availableColumns } = useMemo(() => {
    const labels = new Map<string, string>()
    const sortingIds = new Set(sorting.map((s) => s.id))
    const available: Array<{ id: string; label: string }> = []

    for (const column of table.getAllColumns()) {
      if (!column.getCanSort()) continue

      const label = column.columnDef.meta?.label ?? column.id

      labels.set(column.id, label)

      if (!sortingIds.has(column.id)) {
        available.push({ id: column.id, label })
      }
    }

    return { columnLabels: labels, availableColumns: available }
  }, [sorting, table])

  const onSortAdd = useCallback(() => {
    const first = availableColumns[0]

    if (!first) return

    onSortingChange([...sorting, { id: first.id, desc: false }])
  }, [availableColumns, sorting, onSortingChange])

  const onSortUpdate = useCallback(
    (sortId: string, updates: Partial<ColumnSort>) => {
      onSortingChange(
        sorting.map((s) => (s.id === sortId ? { ...s, ...updates } : s)),
      )
    },
    [sorting, onSortingChange],
  )

  const onSortRemove = useCallback(
    (sortId: string) => {
      onSortingChange(sorting.filter((s) => s.id !== sortId))
    },
    [sorting, onSortingChange],
  )

  return (
    <div className="flex flex-col gap-2">
      <Label>{t('ui.dataGridView.sorting', 'Sorting')}</Label>
      <Sortable
        value={sorting}
        getItemValue={(item) => item.id}
        onValueChange={onSortingChange}
        orientation="vertical"
      >
        {sorting.length > 0 && (
          <SortableContent className="max-h-50 space-y-2 overflow-y-auto">
            {sorting.map((sort) => (
              <SortItem
                key={sort.id}
                sort={sort}
                sortItemId={`${id}-sort-${sort.id}`}
                availableColumns={availableColumns}
                columnLabels={columnLabels}
                onSortUpdate={onSortUpdate}
                onSortRemove={onSortRemove}
                disabled={disabled}
              />
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
        disabled={disabled || availableColumns.length === 0}
      >
        <Plus className="size-4" />
        {t('ui.dataGridView.addSort', 'Add sort')}
      </Button>
    </div>
  )
}

/*
 * ---------------------------------------------------------------------------
 * SortItem
 * ---------------------------------------------------------------------------
 */

interface SortItemProps {
  sort: ColumnSort
  sortItemId: string
  availableColumns: Array<{ id: string; label: string }>
  columnLabels: Map<string, string>
  onSortUpdate: (sortId: string, updates: Partial<ColumnSort>) => void
  onSortRemove: (sortId: string) => void
  disabled?: boolean
}

function SortItem({
  sort,
  sortItemId,
  availableColumns,
  columnLabels,
  onSortUpdate,
  onSortRemove,
  disabled,
}: SortItemProps) {
  const { t } = useUiTranslation()

  const [showFieldSelector, setShowFieldSelector] = useState(false)

  return (
    <SortableItem value={sort.id} asChild>
      <div id={sortItemId} className="flex items-center gap-2">
        <Popover open={showFieldSelector} onOpenChange={setShowFieldSelector}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-44 justify-between rounded font-normal"
              disabled={disabled}
            >
              <span className="truncate">
                {columnLabels.get(sort.id) ?? sort.id}
              </span>
              <ChevronsUpDown className="opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
            <Command>
              <CommandInput
                placeholder={t(
                  'ui.dataGridView.searchColumns',
                  'Search columns...',
                )}
              />
              <CommandList>
                <CommandEmpty>
                  {t('ui.dataGridView.noColumnsFound', 'No columns found.')}
                </CommandEmpty>
                <CommandGroup>
                  {availableColumns.map((column) => (
                    <CommandItem
                      key={column.id}
                      value={column.id}
                      onSelect={(val) => {
                        onSortUpdate(sort.id, { id: val })
                        setShowFieldSelector(false)
                      }}
                    >
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
          onValueChange={(val: SortDirection) =>
            onSortUpdate(sort.id, { desc: val === 'desc' })
          }
          disabled={disabled}
        >
          <SelectTrigger size="sm" className="w-24 rounded">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-(--radix-select-trigger-width)">
            {SORT_ORDER_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {value === 'asc'
                  ? t('ui.dataGridView.asc', 'Asc')
                  : t('ui.dataGridView.desc', 'Desc')}
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
          aria-label={t('ui.dataGridView.removeSortRule', 'Remove sort rule')}
        >
          <Trash2 />
        </Button>

        <SortableItemHandle asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-8 shrink-0 rounded"
            disabled={disabled}
            aria-label={t(
              'ui.dataGridView.reorderSortRule',
              'Reorder sort rule',
            )}
          >
            <GripVertical />
          </Button>
        </SortableItemHandle>
      </div>
    </SortableItem>
  )
}

/*
 * ---------------------------------------------------------------------------
 * RowGroupingSection — pick the row-grouping column for the view
 * ---------------------------------------------------------------------------
 */

interface RowGroupingSectionProps<TData> {
  id: string
  table: Table<TData>
  grouping: string | undefined
  defaultRowGroupingColumn?: string
  onGroupingChange: (grouping: string | undefined) => void
  disabled?: boolean
}

function RowGroupingSection<TData>({
  id,
  table,
  grouping,
  defaultRowGroupingColumn,
  onGroupingChange,
  disabled,
}: RowGroupingSectionProps<TData>) {
  const { t } = useUiTranslation()
  /*
   * Recompute on every render: `table` is a stable ref so a memo keyed on
   * `[table]` would cache an empty list when this section mounts before
   * the data source's field columns are added.
   */
  const groupableColumns = table.getAllLeafColumns().filter(isColumnGroupable)

  const defaultColumn = groupableColumns.find(
    (column) => column.id === defaultRowGroupingColumn,
  )
  const hasDefault = Boolean(defaultColumn)

  const value = grouping ?? 'none'

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold">
          {t('ui.dataGridView.rowGrouping', 'Row Grouping')}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {t(
            'ui.dataGridView.rowGroupingDescription',
            'Group rows by a column. Eligible types: select, status, relation, date, datetime, user.',
          )}
        </p>
      </div>

      {groupableColumns.length === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
          {t(
            'ui.dataGridView.noGroupableColumns',
            'No groupable columns are available for this data source.',
          )}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-row-grouping`}>
            {t('ui.dataGridView.groupingColumn', 'Grouping column')}
          </Label>
          <Select
            value={value}
            onValueChange={(next) =>
              onGroupingChange(next === 'none' ? undefined : next)
            }
            disabled={disabled}
          >
            <SelectTrigger id={`${id}-row-grouping`} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                {t('ui.dataGridView.noGrouping', 'No grouping')}
              </SelectItem>
              {groupableColumns.map((column) => {
                const isDefault = column.id === defaultRowGroupingColumn

                return (
                  <SelectItem key={column.id} value={column.id}>
                    <span className="flex items-center gap-2">
                      <span>{getColumnLabel(column)}</span>
                      {isDefault && (
                        <Badge variant="secondary" className="text-[10px]">
                          {t('ui.dataGridView.default', 'Default')}
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {hasDefault && defaultColumn && grouping === undefined && (
            <p className="text-xs text-muted-foreground">
              {t(
                'ui.dataGridView.willUseDefaultGrouping',
                'Saving without a grouping column will use the default ({label}).',
              ).replace('{label}', getColumnLabel(defaultColumn))}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/*
 * ---------------------------------------------------------------------------
 * PagingSection — toggle paging footer + pick mode and page size
 * ---------------------------------------------------------------------------
 */

interface PagingSectionProps {
  id: string
  enabled: boolean
  mode: DataGridPagingMode
  pageSize: number
  onEnabledChange: (enabled: boolean) => void
  onModeChange: (mode: DataGridPagingMode) => void
  onPageSizeChange: (pageSize: number) => void
  disabled?: boolean
}

function PagingSection({
  id,
  enabled,
  mode,
  pageSize,
  onEnabledChange,
  onModeChange,
  onPageSizeChange,
  disabled,
}: PagingSectionProps) {
  const { t } = useUiTranslation()

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold">
          {t('ui.dataGridView.paging', 'Paging')}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {t(
            'ui.dataGridView.pagingDescription',
            'Activate the paging footer and choose how rows are laid out.',
          )}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
        <div className="flex flex-col">
          <Label htmlFor={`${id}-paging-enabled`} className="text-sm">
            {t(
              'ui.dataGridView.activatePagingFooter',
              'Activate paging footer',
            )}
          </Label>
          <span className="text-xs text-muted-foreground">
            {t(
              'ui.dataGridView.activatePagingFooterHint',
              'Show prev/next controls and a page-size selector under the grid.',
            )}
          </span>
        </div>
        <Switch
          id={`${id}-paging-enabled`}
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-paging-mode`}>
          {t('ui.dataGridView.pagingMode', 'Paging mode')}
        </Label>
        <Select
          value={mode}
          onValueChange={(value) => onModeChange(value as DataGridPagingMode)}
          disabled={disabled || !enabled}
        >
          <SelectTrigger id={`${id}-paging-mode`} size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">
              {t('ui.dataGridView.pagingModeStandard', 'Standard')}
            </SelectItem>
            <SelectItem value="virtual-scroll">
              {t('ui.dataGridView.pagingModeVirtualScroll', 'Virtual scroll')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-paging-page-size`}>
          {t('ui.dataGridView.pageSize', 'Page size')}
        </Label>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          disabled={disabled || !enabled}
        >
          <SelectTrigger id={`${id}-paging-page-size`} size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATA_GRID_PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

/*
 * ---------------------------------------------------------------------------
 * InlineEditingSection — toggle inline cell editing + per-column read-only
 * ---------------------------------------------------------------------------
 */

interface InlineEditingSectionProps {
  id: string
  enabled: boolean
  readOnlyColumns: Array<string>
  columns: Array<DraftColumn>
  onEnabledChange: (enabled: boolean) => void
  onReadOnlyColumnsChange: (columns: Array<string>) => void
  disabled?: boolean
}

function InlineEditingSection({
  id,
  enabled,
  readOnlyColumns,
  columns,
  onEnabledChange,
  onReadOnlyColumnsChange,
  disabled,
}: InlineEditingSectionProps) {
  const { t } = useUiTranslation()

  /*
   * Identity / metadata-locked columns are always read-only — surfaced via
   * `forcedReadOnly` from `buildDraftColumns` (which itself reads
   * `column.columnDef.meta.readOnly`, set by `useDocyrusDataGrid` for
   * `id`, `autonumber_id`, and fields the data source flags as
   * `readOnly: true`). The user can toggle the rest.
   */
  const explicitSet = useMemo(() => new Set(readOnlyColumns), [readOnlyColumns])

  const onToggleColumn = useCallback(
    (columnId: string, nextReadOnly: boolean) => {
      if (nextReadOnly) {
        if (explicitSet.has(columnId)) return
        onReadOnlyColumnsChange([...readOnlyColumns, columnId])
      } else {
        onReadOnlyColumnsChange(readOnlyColumns.filter((id) => id !== columnId))
      }
    },
    [explicitSet, readOnlyColumns, onReadOnlyColumnsChange],
  )

  const onSetAllReadOnly = useCallback(
    (allReadOnly: boolean) => {
      if (allReadOnly) {
        onReadOnlyColumnsChange(
          columns.filter((col) => !col.forcedReadOnly).map((col) => col.id),
        )
      } else {
        onReadOnlyColumnsChange([])
      }
    },
    [columns, onReadOnlyColumnsChange],
  )

  const editableColumns = columns.filter((col) => !col.forcedReadOnly)
  const allEditable = editableColumns.every((col) => !explicitSet.has(col.id))
  const allReadOnly =
    editableColumns.length > 0 &&
    editableColumns.every((col) => explicitSet.has(col.id))

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-sm font-semibold">
          {t('ui.dataGridView.inlineEditing', 'Inline Editing')}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {t(
            'ui.dataGridView.inlineEditingDescription',
            'Allow cells to be edited directly in the grid. Identity and metadata-locked columns stay read-only regardless of these settings.',
          )}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
        <div className="flex flex-col">
          <Label htmlFor={`${id}-inline-editing-enabled`} className="text-sm">
            {t(
              'ui.dataGridView.inlineEditingActivate',
              'Enable inline editing',
            )}
          </Label>
          <span className="text-xs text-muted-foreground">
            {t(
              'ui.dataGridView.inlineEditingActivateHint',
              'Cells become click-to-edit and a save / discard banner appears when you have unsaved changes.',
            )}
          </span>
        </div>
        <Switch
          id={`${id}-inline-editing-enabled`}
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={disabled}
        />
      </div>

      <div
        className={cn(
          'flex flex-col gap-2 rounded-md border bg-card transition-opacity',
          !enabled && 'opacity-60',
        )}
        aria-disabled={!enabled}
      >
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t('ui.dataGridView.columnPermissions', 'Column permissions')}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onSetAllReadOnly(false)}
              disabled={disabled || !enabled || allEditable}
            >
              {t('ui.dataGridView.allEditable', 'All editable')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => onSetAllReadOnly(true)}
              disabled={disabled || !enabled || allReadOnly}
            >
              {t('ui.dataGridView.allReadOnly', 'All read-only')}
            </Button>
          </div>
        </div>

        <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto px-2 py-2">
          {columns.map((column) => {
            const isForced = column.forcedReadOnly === true
            const isExplicitReadOnly = explicitSet.has(column.id)
            const isReadOnly = isForced || isExplicitReadOnly
            const checkboxId = `${id}-readonly-${column.id}`

            return (
              <li
                key={column.id}
                className="flex items-center justify-between gap-3 rounded-sm px-2 py-1.5 hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-2">
                  {isForced && (
                    <Lock
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-label={t('ui.dataGridView.lockedColumn', 'Locked')}
                    />
                  )}
                  <span className="truncate text-sm" title={column.label}>
                    {column.label}
                  </span>
                  {isForced && (
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {t('ui.dataGridView.lockedColumnHint', 'metadata')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={checkboxId}
                    className="text-xs text-muted-foreground"
                  >
                    {t('ui.dataGridView.readOnly', 'Read-only')}
                  </Label>
                  <Switch
                    id={checkboxId}
                    checked={isReadOnly}
                    onCheckedChange={(value) =>
                      onToggleColumn(column.id, value)
                    }
                    disabled={disabled || !enabled || isForced}
                  />
                </div>
              </li>
            )
          })}
          {columns.length === 0 && (
            <li className="px-2 py-3 text-xs text-muted-foreground">
              {t('ui.dataGridView.noColumns', 'No columns to configure.')}
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

/*
 * ---------------------------------------------------------------------------
 * FilterSection
 * ---------------------------------------------------------------------------
 */

interface FilterSectionProps {
  fields: Array<FullField>
  query: RuleGroupType
  onQueryChange: (query: RuleGroupType) => void
  disabled?: boolean
}

function FilterSection({
  fields,
  query,
  onQueryChange,
  disabled,
}: FilterSectionProps) {
  const { t } = useUiTranslation()

  return (
    <div className="flex flex-col gap-2">
      <Label>{t('ui.dataGridView.filters', 'Filters')}</Label>
      <div className={cn(disabled && 'pointer-events-none opacity-60')}>
        <QueryBuilderDocyrus
          fields={fields}
          query={query}
          onQueryChange={onQueryChange}
          variant="compact"
          size="sm"
        />
      </div>
    </div>
  )
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
  '#1e293b',
]

let colorRuleIdCounter = 0

function nextColorRuleId() {
  return `cr-${Date.now()}-${++colorRuleIdCounter}`
}

function ColorSwatchPicker({
  value,
  onValueChange,
  disabled,
}: {
  value: string
  onValueChange: (color: string) => void
  disabled?: boolean
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-16 px-2"
          disabled={disabled}
        >
          <div
            className="size-4 rounded-sm border"
            style={{ backgroundColor: value || '#3b82f6' }}
          />
          <ChevronsUpDown className="ml-auto size-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-6 gap-1">
          {COLOR_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              className={cn(
                'size-6 rounded-sm border transition-transform hover:scale-110',
                value === color && 'ring-2 ring-primary ring-offset-1',
              )}
              style={{ backgroundColor: color }}
              onClick={() => onValueChange(color)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

/*
 * ---------------------------------------------------------------------------
 * RowColorRulesSection
 * ---------------------------------------------------------------------------
 */

interface RowColorRulesSectionProps {
  rules: Array<DraftRowColorRule>
  onRulesChange: (rules: Array<DraftRowColorRule>) => void
  disabled?: boolean
}

function RowColorRulesSection({
  rules,
  onRulesChange,
  disabled,
}: RowColorRulesSectionProps) {
  const { t } = useUiTranslation()

  const createItem = useCallback(
    () => ({ id: nextColorRuleId(), formula: '', color: '#3b82f6' }),
    [],
  )

  return (
    <div className="flex flex-col gap-2">
      <Label>{t('ui.dataGridView.rowColorRules', 'Row Color Rules')}</Label>
      <SchemaRepeater
        value={rules}
        onValueChange={onRulesChange}
        createItem={createItem}
        addLabel={t('ui.dataGridView.addRule', 'Add rule')}
        disabled={disabled}
        renderItem={(item, _index, { update }) => (
          <div className="flex items-center gap-2">
            <Input
              value={item.formula}
              onChange={(e) => update({ formula: e.target.value })}
              placeholder={t('ui.dataGridView.formula', 'Formula')}
              className="h-8 flex-1 text-sm"
              disabled={disabled}
            />
            <ColorSwatchPicker
              value={item.color}
              onValueChange={(color) => update({ color })}
              disabled={disabled}
            />
          </div>
        )}
      />
    </div>
  )
}

/*
 * ---------------------------------------------------------------------------
 * CellColorRulesSection
 * ---------------------------------------------------------------------------
 */

interface CellColorRulesSectionProps {
  rules: Array<DraftCellColorRule>
  onRulesChange: (rules: Array<DraftCellColorRule>) => void
  columns: Array<DraftColumn>
  disabled?: boolean
}

function CellColorRulesSection({
  rules,
  onRulesChange,
  columns,
  disabled,
}: CellColorRulesSectionProps) {
  const { t } = useUiTranslation()

  const selectedColumns = useMemo(
    () => columns.filter((c) => c.selected),
    [columns],
  )

  const createItem = useCallback(
    () => ({
      id: nextColorRuleId(),
      column: selectedColumns[0]?.id ?? '',
      formula: '',
      color: '#3b82f6',
    }),
    [selectedColumns],
  )

  return (
    <div className="flex flex-col gap-2">
      <Label>{t('ui.dataGridView.cellColorRules', 'Cell Color Rules')}</Label>
      <SchemaRepeater
        value={rules}
        onValueChange={onRulesChange}
        createItem={createItem}
        addLabel={t('ui.dataGridView.addRule', 'Add rule')}
        disabled={disabled}
        renderItem={(item, _index, { update }) => (
          <div className="flex items-center gap-2">
            <Select
              value={item.column}
              onValueChange={(column) => update({ column })}
              disabled={disabled}
            >
              <SelectTrigger size="sm" className="h-8 w-36">
                <SelectValue
                  placeholder={t('ui.dataGridView.column', 'Column')}
                />
              </SelectTrigger>
              <SelectContent>
                {selectedColumns.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={item.formula}
              onChange={(e) => update({ formula: e.target.value })}
              placeholder={t('ui.dataGridView.formula', 'Formula')}
              className="h-8 flex-1 text-sm"
              disabled={disabled}
            />
            <ColorSwatchPicker
              value={item.color}
              onValueChange={(color) => update({ color })}
              disabled={disabled}
            />
          </div>
        )}
      />
    </div>
  )
}

/*
 * ---------------------------------------------------------------------------
 * Exports
 * ---------------------------------------------------------------------------
 */

export { DataGridViewSelect }
export type { DataGridViewSelectProps, DataGridViewSelectVariant }
export { ViewEditorDialog as DataGridViewEditor }
export type { ViewEditorDialogProps as DataGridViewEditorProps }
