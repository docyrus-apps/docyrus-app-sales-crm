'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  Columns3,
  Download,
  Loader2,
  Search,
  Settings2,
  Table2,
} from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/lib/use-ui-translation'

/** Which column set the user picked from the menu. */
export type DocyrusDataExportScope = 'visible' | 'all' | 'custom'

/**
 * Per-column representation variant. For relation/user/enum-like fields the
 * server can project the same logical column as multiple physical columns
 * (display label, raw id, relation autonumber).
 */
export type DocyrusDataExportColumnVariant = 'name' | 'id' | 'autonumber_id'

/** A single column entry inside a custom export selection. */
export interface DocyrusDataExportColumn {
  /** Field slug. */
  slug: string
  /**
   * Variants to project. Empty/undefined keeps the server default (single
   * display column). Populate to ask the server for additional projections,
   * e.g. `{ slug: 'country', variants: ['id', 'name', 'autonumber_id'] }`
   * which is encoded as `country(id,name,autonumber_id)`.
   */
  variants?: ReadonlyArray<DocyrusDataExportColumnVariant>
}

/** Result reported by the menu when the user picks an entry. */
export type DocyrusDataExportSelection =
  | { scope: 'visible' }
  | { scope: 'all' }
  | { scope: 'custom'; columns: ReadonlyArray<DocyrusDataExportColumn> }

/** Minimal field shape the menu/dialog needs to render the picker. */
export interface DocyrusDataExportFieldOption {
  slug: string
  name: string
  type: string
}

export interface DocyrusDataExportMenuProps {
  /** Called when the user picks an entry. Should kick off the server export. */
  onExport: (selection: DocyrusDataExportSelection) => void | Promise<void>
  /**
   * Exportable fields. When provided the menu surfaces a "Select columns…"
   * entry that opens a dialog letting the user cherry-pick fields and pick
   * variants for relation/user/enum-like columns.
   */
  fields?: ReadonlyArray<DocyrusDataExportFieldOption>
  /**
   * Slugs that should start checked when the dialog opens. Defaults to every
   * field in `fields`.
   */
  visibleSlugs?: ReadonlyArray<string>
  /** Show a spinner on the trigger and disable interactions while true. */
  isExporting?: boolean
  /** Disable the trigger entirely (e.g. while the data source is still loading). */
  disabled?: boolean
  /** Extra className applied to the trigger button. */
  className?: string
}

const RELATION_FIELD_TYPES = new Set<string>([
  'field-relation',
  'field-relatedField',
])

const USER_FIELD_TYPES = new Set<string>([
  'field-userSelect',
  'field-userMultiSelect',
])

const ENUM_FIELD_TYPES = new Set<string>([
  'field-select',
  'field-multiSelect',
  'field-radioGroup',
  'field-tagSelect',
  'field-status',
  'field-approvalStatus',
  'field-enum',
  'field-systemEnum',
])

const VARIANT_ORDER: ReadonlyArray<DocyrusDataExportColumnVariant> = [
  'id',
  'name',
  'autonumber_id',
]

/**
 * Encode a column entry into the wire format the export endpoint expects:
 * `slug` for plain entries, `slug(v1,v2)` when variants are picked. Variants
 * are emitted in canonical order (`id`, `name`, `autonumber_id`).
 */
export function encodeDocyrusDataExportColumn(
  column: DocyrusDataExportColumn,
): string {
  const { variants } = column

  if (!variants || variants.length === 0) return column.slug

  const seen = new Set(variants)
  const ordered = VARIANT_ORDER.filter((variant) => seen.has(variant))

  if (ordered.length === 0) return column.slug

  return `${column.slug}(${ordered.join(',')})`
}

function getFieldKind(type: string): 'relation' | 'user' | 'enum' | 'plain' {
  if (RELATION_FIELD_TYPES.has(type)) return 'relation'
  if (USER_FIELD_TYPES.has(type)) return 'user'
  if (ENUM_FIELD_TYPES.has(type)) return 'enum'

  return 'plain'
}

function isVariantField(type: string): boolean {
  return getFieldKind(type) !== 'plain'
}

/**
 * Toolbar dropdown that surfaces server-side data-source exports. The menu
 * itself doesn't know how to call the API — it just reports the user's
 * selection so the consumer can wire it up to `useDocyrusDataExport`.
 *
 * When `fields` is supplied a third entry — "Select columns…" — opens a
 * dialog that lets the user choose specific columns and pick projections
 * for relation/user/enum-like columns (Name / ID / Autonumber ID).
 */
export function DocyrusDataExportMenu({
  onExport,
  fields,
  visibleSlugs,
  isExporting = false,
  disabled = false,
  className,
}: DocyrusDataExportMenuProps) {
  const { t } = useUiTranslation()
  const [dialogOpen, setDialogOpen] = useState(false)

  const triggerExport = useCallback(
    async (selection: DocyrusDataExportSelection) => {
      await onExport(selection)
    },
    [onExport],
  )

  const handleScopeSelect = useCallback(
    (scope: 'visible' | 'all') => {
      void triggerExport({ scope })
    },
    [triggerExport],
  )

  const canPickColumns = Boolean(fields && fields.length > 0)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={t('ui.dataGrid.export', 'Export')}
            disabled={disabled || isExporting}
            className={cn(className)}
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuLabel>
            {t('ui.dataGrid.exportLabel', 'Export to Excel')}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => handleScopeSelect('visible')}>
            <Columns3 className="size-4" />
            {t('ui.dataGrid.exportVisibleColumns', 'Export visible columns')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleScopeSelect('all')}>
            <Table2 className="size-4" />
            {t('ui.dataGrid.exportAllColumns', 'Export all columns')}
          </DropdownMenuItem>
          {canPickColumns && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                <Settings2 className="size-4" />
                {t('ui.dataGrid.exportSelectColumns', 'Select columns…')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canPickColumns && (
        <DocyrusDataExportColumnDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          fields={fields ?? []}
          visibleSlugs={visibleSlugs}
          isExporting={isExporting}
          onExport={async (columns) => {
            await triggerExport({ scope: 'custom', columns })
            setDialogOpen(false)
          }}
        />
      )}
    </>
  )
}

interface DocyrusDataExportColumnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fields: ReadonlyArray<DocyrusDataExportFieldOption>
  visibleSlugs?: ReadonlyArray<string>
  isExporting: boolean
  onExport: (
    columns: ReadonlyArray<DocyrusDataExportColumn>,
  ) => Promise<void> | void
}

function DocyrusDataExportColumnDialog({
  open,
  onOpenChange,
  fields,
  visibleSlugs,
  isExporting,
  onExport,
}: DocyrusDataExportColumnDialogProps) {
  const { t } = useUiTranslation()

  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [variants, setVariants] = useState<
    Record<string, Array<DocyrusDataExportColumnVariant>>
  >({})
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open) return

    const initialSelected: Record<string, boolean> = {}
    const initialVariants: Record<
      string,
      Array<DocyrusDataExportColumnVariant>
    > = {}
    const visibleSet = visibleSlugs ? new Set(visibleSlugs) : null

    for (const field of fields) {
      initialSelected[field.slug] = visibleSet
        ? visibleSet.has(field.slug)
        : true

      if (isVariantField(field.type)) {
        initialVariants[field.slug] = ['name']
      }
    }

    setSelected(initialSelected)
    setVariants(initialVariants)
    setSearch('')
  }, [open, fields, visibleSlugs])

  const filteredFields = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (query.length === 0) return fields

    return fields.filter(
      (field) =>
        field.name.toLowerCase().includes(query) ||
        field.slug.toLowerCase().includes(query),
    )
  }, [fields, search])

  const selectedCount = useMemo(
    () =>
      fields.reduce(
        (count, field) => (selected[field.slug] ? count + 1 : count),
        0,
      ),
    [fields, selected],
  )

  const allFilteredSelected =
    filteredFields.length > 0 &&
    filteredFields.every((field) => selected[field.slug])

  const handleToggleField = useCallback((slug: string, next: boolean) => {
    setSelected((prev) => ({ ...prev, [slug]: next }))
  }, [])

  const handleSelectAll = useCallback(
    (next: boolean) => {
      setSelected((prev) => {
        const updated = { ...prev }

        for (const field of filteredFields) {
          updated[field.slug] = next
        }

        return updated
      })
    },
    [filteredFields],
  )

  const handleVariantChange = useCallback(
    (slug: string, next: Array<string>) => {
      const sanitized = next.filter(
        (value): value is DocyrusDataExportColumnVariant =>
          value === 'name' || value === 'id' || value === 'autonumber_id',
      )

      setVariants((prev) => ({
        ...prev,
        [slug]: sanitized.length > 0 ? sanitized : ['name'],
      }))
    },
    [],
  )

  const buildColumns = useCallback((): Array<DocyrusDataExportColumn> => {
    return fields
      .filter((field) => selected[field.slug])
      .map((field) => {
        if (!isVariantField(field.type)) {
          return { slug: field.slug }
        }

        const picked = variants[field.slug] ?? ['name']
        const ordered = VARIANT_ORDER.filter((variant) =>
          picked.includes(variant),
        )

        return {
          slug: field.slug,
          variants:
            ordered.length > 0
              ? ordered
              : (['name'] as Array<DocyrusDataExportColumnVariant>),
        }
      })
  }, [fields, selected, variants])

  const handleSubmit = useCallback(async () => {
    const columns = buildColumns()

    if (columns.length === 0) return

    await onExport(columns)
  }, [buildColumns, onExport])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-4">
        <DialogHeader>
          <DialogTitle>
            {t(
              'ui.dataGrid.exportSelectColumnsTitle',
              'Select columns to export',
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'ui.dataGrid.exportSelectColumnsDescription',
              'Pick the columns to include. For relation, user, and choice columns you can also export the raw value alongside the display label.',
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t(
                'ui.dataGrid.exportSearchColumns',
                'Search columns',
              )}
              className="pl-8"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleSelectAll(!allFilteredSelected)}
          >
            {allFilteredSelected
              ? t('ui.dataGrid.exportClearAll', 'Clear all')
              : t('ui.dataGrid.exportSelectAll', 'Select all')}
          </Button>
        </div>

        <ScrollArea className="h-[360px] rounded-md border">
          <div className="divide-y">
            {filteredFields.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                {t('ui.dataGrid.exportNoColumns', 'No matching columns')}
              </div>
            ) : (
              filteredFields.map((field) => {
                const checked = Boolean(selected[field.slug])
                const kind = getFieldKind(field.type)
                const showAutonumber = kind === 'relation'
                const value = variants[field.slug] ?? []

                return (
                  <div
                    key={field.slug}
                    className="flex flex-wrap items-center gap-3 px-3 py-2.5"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) =>
                          handleToggleField(field.slug, next === true)
                        }
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-medium">
                          {field.name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {field.slug}
                        </span>
                      </span>
                    </label>
                    {kind !== 'plain' && (
                      <ToggleGroup
                        type="multiple"
                        size="sm"
                        variant="outline"
                        value={value}
                        onValueChange={(next) =>
                          handleVariantChange(field.slug, next)
                        }
                        disabled={!checked}
                        className="shrink-0"
                      >
                        <ToggleGroupItem
                          value="name"
                          aria-label={t(
                            'ui.dataGrid.exportVariantName',
                            'Name',
                          )}
                        >
                          {t('ui.dataGrid.exportVariantName', 'Name')}
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="id"
                          aria-label={t('ui.dataGrid.exportVariantId', 'ID')}
                        >
                          {t('ui.dataGrid.exportVariantId', 'ID')}
                        </ToggleGroupItem>
                        {showAutonumber && (
                          <ToggleGroupItem
                            value="autonumber_id"
                            aria-label={t(
                              'ui.dataGrid.exportVariantAutonumber',
                              'Autonumber ID',
                            )}
                          >
                            {t(
                              'ui.dataGrid.exportVariantAutonumber',
                              'Autonumber ID',
                            )}
                          </ToggleGroupItem>
                        )}
                      </ToggleGroup>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {`${selectedCount} / ${fields.length} ${t('ui.dataGrid.exportSelectedSuffix', 'selected')}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              {t('ui.dataGrid.exportCancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={selectedCount === 0 || isExporting}
            >
              {isExporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Download className="size-4" />
              )}
              {t('ui.dataGrid.exportSubmit', 'Export')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
