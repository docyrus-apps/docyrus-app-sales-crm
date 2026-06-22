'use client';

// @ts-nocheck
/* eslint-disable */
import {
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  GripVerticalIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon
} from 'lucide-react';
import {
  PlateElement,
  type PlateElementProps,
  useEditorRef,
  useFocused,
  useReadOnly,
  useSelected
} from 'platejs/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useUiTranslation } from '@/hooks/docyrus/use-ui-translation';

import { TableConfigurationDialog } from '../components/table-configuration-dialog';
import { useHbsContext } from '../lib/hbs-context';
import {
  type ComputedColumn,
  type ComputedColumnConfig,
  type ComputedColumnContext,
  type ComputedFontSize,
  type ComputedFontWeight,
  type ComputedFooterConfig,
  type ComputedRow,
  type ComputedTableSchema,
  type TComputedTableElement
} from '../types';

/* ── Tiny formatters — used when a column doesn't provide a `format` override ── */

function defaultCurrencyLocale(currency: string): string {
  if (currency === 'TRY') return 'tr-TR';
  if (currency === 'EUR') return 'de-DE';
  if (currency === 'GBP') return 'en-GB';

  return 'en-US';
}

function formatMoney(value: unknown, currency: string, locale: string): string {
  const n = Number(value);

  if (!Number.isFinite(n)) return '';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
}

function formatPercentDisplay(value: unknown): string {
  const n = Number(value);

  if (!Number.isFinite(n)) return '';

  return `%${n % 1 === 0 ? n.toString() : n.toFixed(2)}`;
}

function formatNumberDisplay(value: unknown, locale: string): string {
  const n = Number(value);

  if (!Number.isFinite(n)) return '';

  return new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(n);
}

/* ── Per-column cell renderer — switches on column.type ── */

interface CellProps {
  column: ComputedColumn;
  row: ComputedRow;
  ctx: ComputedColumnContext;
  readOnly: boolean;
  onCommit: (next: unknown) => void;
}

function Cell({
  column, row, ctx, readOnly, onCommit
}: CellProps) {
  const rawValue = column.type === 'computed' && column.compute ? column.compute(row, ctx) : (row[column.key] as unknown);

  const formatted = column.format ? column.format(rawValue, row, ctx) : column.type === 'currency' ? formatMoney(rawValue, ctx.currency, ctx.locale) : column.type === 'percent' ? formatPercentDisplay(rawValue) : column.type === 'number' ? formatNumberDisplay(rawValue, ctx.locale) : String(rawValue ?? '');

  if (readOnly || column.type === 'computed') {
    return (
      <span className={cn('block tabular-nums', column.align === 'right' && 'text-right')}>
        {formatted}
      </span>
    );
  }

  if (column.type === 'number' || column.type === 'currency' || column.type === 'percent') {
    return (
      <NumericCellInput
        value={Number(rawValue) || 0}
        step={column.step ?? (column.type === 'currency' ? 0.01 : 1)}
        min={column.min}
        max={column.max}
        align={column.align ?? 'right'}
        onCommit={onCommit} />
    );
  }

  return (
    <TextCellInput
      value={String(rawValue ?? '')}
      onCommit={onCommit}
      align={column.align} />
  );
}

interface NumericCellInputProps {
  value: number;
  step?: number;
  min?: number;
  max?: number;
  align?: 'left' | 'right' | 'center';
  onCommit: (next: number) => void;
}

function NumericCellInput({
  value, step, min, max, align, onCommit
}: NumericCellInputProps) {
  const [draft, setDraft] = useState(String(value));
  const lastRef = useRef(value);

  useEffect(() => {
    if (value !== lastRef.current) {
      setDraft(String(value));
      lastRef.current = value;
    }
  }, [value]);

  const commit = useCallback(() => {
    const n = Number(draft);

    if (!Number.isFinite(n) || n === value) {
      setDraft(String(value));

      return;
    }
    lastRef.current = n;
    onCommit(n);
  }, [draft, value, onCommit]);

  return (
    <Input
      type="number"
      value={draft}
      step={step}
      min={min}
      max={max}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
      className={cn(
        'h-8 w-full border-transparent bg-transparent px-1.5 py-0 tabular-nums shadow-none focus-visible:border-input focus-visible:bg-background',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center'
      )} />
  );
}

interface TextCellInputProps {
  value: string;
  onCommit: (next: string) => void;
  align?: 'left' | 'right' | 'center';
}

function TextCellInput({
  value, onCommit, align
}: TextCellInputProps) {
  const [draft, setDraft] = useState(value);
  const lastRef = useRef(value);

  useEffect(() => {
    if (value !== lastRef.current) {
      setDraft(value);
      lastRef.current = value;
    }
  }, [value]);

  const commit = useCallback(() => {
    if (draft === value) return;
    lastRef.current = draft;
    onCommit(draft);
  }, [draft, value, onCommit]);

  return (
    <Input
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          (e.currentTarget as HTMLInputElement).blur();
        }
      }}
      className={cn(
        'h-8 w-full border-transparent bg-transparent px-1.5 py-0 shadow-none focus-visible:border-input focus-visible:bg-background',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center'
      )} />
  );
}

/* ── Helpers for new-row id + initial values ── */

function makeRowId(): string {
  return `row_${Math.random().toString(36).slice(2, 10)}`;
}

function blankRow(schema: ComputedTableSchema): ComputedRow {
  const row: ComputedRow = { id: makeRowId() };

  for (const col of schema.columns) {
    if (col.type === 'computed') continue;
    if (col.defaultValue !== undefined) row[col.key] = col.defaultValue;
  }

  return row;
}

function effectiveVisibility(
  override: Record<string, boolean> | undefined,
  col: ComputedColumn
): boolean {
  if (override && col.key in override) return override[col.key] === true;
  if (col.defaultVisible === false) return false;

  return true;
}

/*
 * ── Fallback schema — rendered when the node's `schemaId` doesn't match
 *    any registered schema. Keeps the editor functional with a visible hint
 *    instead of crashing.
 * ──
 */
function buildMissingSchemaFallback(
  t: (key: string, fallback: string) => string
): ComputedTableSchema {
  return {
    id: '__missing__',
    label: t('ui.htmlTemplateEditor.tableMissingSchemaLabel', 'Missing schema'),
    columns: [{ key: 'value', label: 'Value', type: 'text' }],
    labels: {
      title: t('ui.htmlTemplateEditor.tableMissingSchemaTitle', 'Schema not found'),
      addRow: t('ui.htmlTemplateEditor.tableAddRow', '+ Add row'),
      emptyState: t('ui.htmlTemplateEditor.tableMissingSchemaEmpty', '— this table\'s `schemaId` is not registered in editor.tableSchemas —')
    }
  };
}

/* ── Ad-hoc mode helpers ───────────────────────────────────────────────── */

const FONT_SIZE_CLASS: Record<ComputedFontSize, string> = {
  xs: 'text-[10px]',
  sm: 'text-xs',
  base: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
};

function fontWeightClass(weight?: ComputedFontWeight): string {
  return weight === 'bold' ? 'font-semibold' : 'font-normal';
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Reads an array path out of the editor's bound JSON. Accepts dot-paths with
 * numeric segments (e.g. `users.0.orders`). Returns `[]` if the path doesn't
 * resolve to an array of objects.
 */
function readAdhocRows(data: unknown, path: string | undefined): ComputedRow[] {
  if (!path) return [];
  const segments = path.split('.');
  let cur: unknown = data;

  for (const seg of segments) {
    if (cur === null || cur === undefined) return [];
    if (Array.isArray(cur)) {
      const idx = Number(seg);

      if (!Number.isInteger(idx)) return [];
      cur = cur[idx];
    } else if (isPlainObject(cur)) {
      cur = cur[seg];
    } else {
      return [];
    }
  }
  if (!Array.isArray(cur)) return [];

  return cur.map((row, i) => {
    if (isPlainObject(row)) {
      return { id: `adhoc-${i}`, ...row };
    }

    return { id: `adhoc-${i}`, value: row };
  });
}

/**
 * Maps an ad-hoc ColumnConfig → the runtime ComputedColumn the table renderer
 * already knows how to draw. `date` and `computed` fall back to `text` for
 * the editor preview (full formatting kicks in during serialize / preview tab).
 */
function configToColumn(cfg: ComputedColumnConfig): ComputedColumn {
  const type: ComputedColumn['type']
    = cfg.format === 'date' || cfg.format === 'computed' ? 'text' : cfg.format;

  return {
    key: cfg.key,
    label: cfg.label,
    type,
    align: cfg.align,
    width: cfg.width
  };
}

function adhocSchemaFrom(
  el: TComputedTableElement,
  t: (key: string, fallback: string) => string
): ComputedTableSchema {
  /*
   * Only include columns the user has marked visible — ad-hoc tables don't
   * surface a toolbar columns menu, so a hidden config column must not leak
   * into `visibleColumns` at the schema level either.
   */
  const columns = (el.columns ?? [])
    .filter(c => c.visible !== false)
    .map(configToColumn);
  const title = el.label?.trim()
    || el.dataPath
    || t('ui.htmlTemplateEditor.tableDefaultTitle', 'Table');

  return {
    id: el.schemaId,
    label: title,
    columns,
    labels: {
      title,
      emptyState: t('ui.htmlTemplateEditor.tableAdhocEmpty', '— bound data path is empty or not found —')
    }
  };
}

/* ── Element ── */

export function ComputedTableElement(
  props: PlateElementProps<TComputedTableElement>
) {
  const { element, children } = props;
  const editor = useEditorRef();
  const selected = useSelected();
  const focused = useFocused();
  const editorReadOnly = useReadOnly();
  const { tableSchemas, data, defaultCurrency } = useHbsContext();
  const { t } = useUiTranslation();

  /*
   * Ad-hoc mode = node carries its own column configs. Editor row editing is
   * disabled in this mode — rows are projected from the bound JSON data.
   */
  const adhocColumns = element.columns;
  const isAdhoc = Array.isArray(adhocColumns) && adhocColumns.length > 0;
  const adhocColumnMap = useMemo(() => {
    const map = new Map<string, ComputedColumnConfig>();

    if (adhocColumns) {
      for (const c of adhocColumns) map.set(c.key, c);
    }

    return map;
  }, [adhocColumns]);

  const schema: ComputedTableSchema = isAdhoc ? adhocSchemaFrom(element, t) : tableSchemas[element.schemaId] ?? buildMissingSchemaFallback(t);

  const readOnly = editorReadOnly || isAdhoc;

  const rawRows = element.rows;
  const adhocRows = useMemo(
    () => (isAdhoc ? readAdhocRows(data, element.dataPath) : []),
    [isAdhoc, data, element.dataPath]
  );
  const rows = useMemo<ComputedRow[]>(
    () => (isAdhoc ? adhocRows : rawRows ?? []),
    [isAdhoc, adhocRows, rawRows]
  );
  const currency = element.currency ?? schema.defaultCurrency ?? defaultCurrency;
  const locale = element.locale ?? schema.defaultLocale ?? defaultCurrencyLocale(currency);
  const { columnVisibility } = element;

  const visibleColumns = useMemo(
    () => schema.columns.filter(col => effectiveVisibility(columnVisibility, col)),
    [schema, columnVisibility]
  );

  const labels = schema.labels ?? {};
  const titleLabel = labels.title ?? schema.label;
  const addRowLabel = labels.addRow ?? t('ui.htmlTemplateEditor.tableAddRow', '+ Add row');
  const emptyLabel = labels.emptyState ?? t('ui.htmlTemplateEditor.tableEmptyState', 'No rows yet.');

  /* ── Patch helpers ── */

  const patch = useCallback(
    (next: Partial<TComputedTableElement>) => {
      editor.tf.setNodes(next, { at: [], match: n => n === element });
    },
    [editor, element]
  );

  const updateRow = useCallback(
    (id: string, changes: Partial<ComputedRow>) => {
      patch({
        rows: rows.map(r => (r.id === id ? { ...r, ...changes } : r))
      });
    },
    [rows, patch]
  );

  const removeRow = useCallback(
    (id: string) => {
      patch({ rows: rows.filter(r => r.id !== id) });
    },
    [rows, patch]
  );

  const addRow = useCallback(() => {
    patch({ rows: [...rows, blankRow(schema)] });
  }, [rows, patch, schema]);

  const toggleColumn = useCallback(
    (key: string, visible: boolean) => {
      patch({ columnVisibility: { ...columnVisibility, [key]: visible } });
    },
    [columnVisibility, patch]
  );

  /* ── Drag reorder ── */

  const dragIdRef = useRef<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const onDragStart = useCallback((id: string) => (e: DragEvent) => {
    dragIdRef.current = id;
    e.dataTransfer.effectAllowed = 'move';
    e.stopPropagation();
  }, []);

  const onDragOver = useCallback((id: string) => (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) setDragOverId(id);
  }, [dragOverId]);

  const onDragEnd = useCallback(() => {
    dragIdRef.current = null;
    setDragOverId(null);
  }, []);

  const onDrop = useCallback((id: string) => (e: DragEvent) => {
    e.preventDefault();
    const draggedId = dragIdRef.current;

    dragIdRef.current = null;
    setDragOverId(null);
    if (!draggedId || draggedId === id) return;
    const from = rows.findIndex(r => r.id === draggedId);
    const to = rows.findIndex(r => r.id === id);

    if (from < 0 || to < 0) return;
    const next = [...rows];
    const [moved] = next.splice(from, 1);

    if (!moved) return;
    next.splice(to, 0, moved);
    patch({ rows: next });
  }, [rows, patch]);

  /* ── Currency picker ── */

  const currencyOptions = schema.currencyOptions ?? [];
  const showCurrencyPicker = currencyOptions.length > 0;
  const activeCurrencyOption = currencyOptions.find(opt => opt.code === currency);

  /* ── Footer aggregates ── */

  /*
   * Editor never renders the totals table inline; aggregates live in the
   * Preview tab (for schema-driven tables) only.
   */

  /* ── Column toggle menu items ── */

  const toggleableColumns = schema.columns.filter(c => c.toggleable);
  const showColumnsMenu = !readOnly && toggleableColumns.length > 0;

  /* ── Ad-hoc edit-in-place dialog ── */

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const initialEditConfig = isAdhoc && element.dataPath ? {
    dataPath: element.dataPath,
    label: element.label,
    columns: element.columns ?? [],
    footer: element.footer ?? []
  } : undefined;
  const handleEditConfirm = useCallback((next: {
    dataPath: string;
    label?: string;
    columns: ComputedColumnConfig[];
    footer: ComputedFooterConfig[];
  }) => {
    setEditDialogOpen(false);
    patch({
      dataPath: next.dataPath,
      label: next.label,
      columns: next.columns,
      footer: next.footer
    });
  }, [patch]);

  const colSpan = visibleColumns.length + (readOnly ? 0 : 1); // +1 for actions column

  return (
    <PlateElement
      {...props}
      className={cn(
        'my-3 rounded-lg border bg-card',
        selected && focused && 'ring-2 ring-ring ring-offset-2'
      )}
      attributes={{
        ...props.attributes,
        contentEditable: false
      }}>
      <div className="hidden">{children}</div>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {titleLabel}
          {isAdhoc && element.dataPath && (
            <code className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] normal-case tracking-normal text-muted-foreground/80">
              {element.dataPath}
            </code>
          )}
        </span>
        <div className="flex items-center gap-1">
          {isAdhoc && !editorReadOnly && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => {
                /*
                 * See `insert-computed-table-button.tsx` for the full
                 * rationale — release Plate's focus state and DOM blur
                 * before mounting the Radix Dialog, then defer the open
                 * by a frame so the deselect-driven blur flushes first.
                 */
                try {
                  (editor as { deselect?: () => void }).deselect?.();
                } catch {
                  /* swallow */
                }
                const slateEl = document.querySelector('[data-slate-editor="true"]') as HTMLElement | null;

                slateEl?.blur();
                (document.activeElement as HTMLElement | null)?.blur?.();
                requestAnimationFrame(() => setEditDialogOpen(true));
              }}>
              <PencilIcon className="size-3.5" />
              {t('ui.htmlTemplateEditor.tableEditButton', 'Edit')}
            </Button>
          )}
          {!readOnly && showCurrencyPicker && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs">
                  {activeCurrencyOption?.label ?? currency}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  {labels.currencyLabel ?? t('ui.htmlTemplateEditor.tableCurrencyLabel', 'Currency')}
                </DropdownMenuLabel>
                <DropdownMenuRadioGroup
                  value={currency}
                  onValueChange={(val) => {
                    const next = currencyOptions.find(c => c.code === val);

                    if (next) {
                      patch({
                        currency: next.code,
                        locale: next.locale ?? defaultCurrencyLocale(next.code)
                      });
                    }
                  }}>
                  {currencyOptions.map(opt => (
                    <DropdownMenuRadioItem key={opt.code} value={opt.code}>
                      {opt.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {showColumnsMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="size-7">
                  <MoreVerticalIcon className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{t('ui.htmlTemplateEditor.tableColumns', 'Columns')}</DropdownMenuLabel>
                {toggleableColumns.map((col) => {
                  const visible = effectiveVisibility(columnVisibility, col);

                  return (
                    <DropdownMenuCheckboxItem
                      key={col.key}
                      checked={visible}
                      onCheckedChange={v => toggleColumn(col.key, v)}>
                      {col.label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b bg-muted/50 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {visibleColumns.map((col) => {
                const cfg = adhocColumnMap.get(col.key);
                const style: Record<string, string | undefined> = {};

                if (col.width) style.width = col.width;
                if (cfg?.backgroundColor) style.backgroundColor = cfg.backgroundColor;

                return (
                  <th
                    key={col.key}
                    className={cn(
                      'px-2 py-1.5',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      (col.align ?? 'left') === 'left' && 'text-left'
                    )}
                    style={style}>
                    {col.label}
                  </th>
                );
              })}
              {!readOnly && <th className="w-8 px-1 py-1.5" aria-label="actions" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-3 py-6 text-center text-muted-foreground">
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => {
                const ctx: ComputedColumnContext = {
                  currency, locale, rows, index: i
                };
                const isDragOver = dragOverId === row.id;

                return (
                  <tr
                    key={row.id}
                    draggable={!readOnly}
                    onDragStart={onDragStart(row.id)}
                    onDragOver={onDragOver(row.id)}
                    onDragEnd={onDragEnd}
                    onDrop={onDrop(row.id)}
                    className={cn(
                      'group border-b transition-colors last:border-b-0',
                      isDragOver && 'bg-primary/5 outline outline-1 -outline-offset-1 outline-primary/40'
                    )}>
                    {visibleColumns.map((col) => {
                      const cfg = adhocColumnMap.get(col.key);
                      const tdStyle: Record<string, string | undefined> = {};

                      if (cfg?.backgroundColor) tdStyle.backgroundColor = cfg.backgroundColor;

                      const cellTextClass = cfg ? cn(
                        FONT_SIZE_CLASS[cfg.fontSize ?? 'sm'],
                        fontWeightClass(cfg.fontWeight)
                      ) : undefined;
                      const cellTextStyle = cfg?.textColor ? { color: cfg.textColor } : undefined;

                      return (
                        <td
                          key={col.key}
                          className={cn(
                            'px-1 py-1 align-top',
                            col.align === 'right' && 'text-right',
                            col.align === 'center' && 'text-center'
                          )}
                          style={tdStyle}>
                          <div className="flex items-start gap-1">
                            {col === visibleColumns[0] && !readOnly && (
                              <GripVerticalIcon
                                className="mt-1 size-3 shrink-0 cursor-grab text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
                            )}
                            <div
                              className={cn('min-w-0 flex-1', cellTextClass)}
                              style={cellTextStyle}>
                              <Cell
                                column={col}
                                row={row}
                                ctx={ctx}
                                readOnly={readOnly}
                                onCommit={v => updateRow(row.id, { [col.key]: v })} />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                    {!readOnly && (
                      <td className="px-1 py-1 align-top">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                          onClick={() => removeRow(row.id)}
                          aria-label={t('ui.htmlTemplateEditor.tableRemoveRow', 'Remove row')}>
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/*
       * Editor footer slot — only renders the "+ Add row" button in
       * schema-driven, editable mode. Totals stay in the Preview tab without
       * any inline badge so the editor is fully clean.
       */}
      {!readOnly && (
        <div className="flex items-center border-t bg-muted/30 px-3 py-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={addRow}
            className="h-7 gap-1.5 text-xs">
            <PlusIcon className="size-3.5" />
            {addRowLabel}
          </Button>
        </div>
      )}

      {isAdhoc && (
        <TableConfigurationDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          data={data}
          initialConfig={initialEditConfig}
          onConfirm={handleEditConfirm} />
      )}
    </PlateElement>
  );
}