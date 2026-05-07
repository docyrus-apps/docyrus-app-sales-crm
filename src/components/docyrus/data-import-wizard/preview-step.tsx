'use client'

import { useMemo } from 'react'

import { Eye } from 'lucide-react'

import {
  useDocyrusFieldComponent,
  type DocyrusFieldLike,
} from '@/hooks/use-docyrus-field-component'
import {
  type IField,
  type IFieldType,
} from '@/components/docyrus/form-fields/types'

import { Badge } from '@/components/ui/badge'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/lib/use-ui-translation'

import {
  RESERVED_TARGET_SLUGS,
  type AnalysedFile,
  type WizardMappingMap,
} from './types'

interface PreviewStepProps {
  analysedFile: AnalysedFile
  targetFields: ReadonlyArray<DocyrusFieldLike>
  mapping: WizardMappingMap
  upsertUniqueFields: boolean
  uniqueFieldSlugs: ReadonlyArray<string>
  previewRowCount: number
}

interface ResolvedColumn {
  sourceColumn: string
  targetSlug: string
  field: DocyrusFieldLike | null
  /** Pseudo-IField passed to the value renderer (DocyrusFieldLike is wider). */
  asIField: IField
  isReserved: boolean
}

function reservedAsIField(slug: string): IField {
  return {
    id: slug,
    name: slug,
    slug,
    type: 'field-text',
  }
}

function fieldLikeToIField(field: DocyrusFieldLike): IField {
  return {
    id: typeof field.id === 'string' ? field.id : String(field.slug),
    name: field.name ?? String(field.slug),
    slug: String(field.slug),
    type: field.type as IFieldType,
  }
}

function PreviewCell({ field, value }: { field: IField; value: unknown }) {
  const Renderer = useDocyrusFieldComponent(field.type, 'value-renderer')

  return (
    <Renderer
      field={field}
      value={value}
      className="block max-w-[280px] truncate"
    />
  )
}

export function PreviewStep({
  analysedFile,
  targetFields,
  mapping,
  upsertUniqueFields,
  uniqueFieldSlugs,
  previewRowCount,
}: PreviewStepProps) {
  const { t } = useUiTranslation()

  const fieldsBySlug = useMemo(() => {
    const map = new Map<string, DocyrusFieldLike>()

    for (const field of targetFields) {
      if (field.slug) map.set(String(field.slug), field)
    }

    return map
  }, [targetFields])

  const resolvedColumns = useMemo<ReadonlyArray<ResolvedColumn>>(() => {
    const out: Array<ResolvedColumn> = []

    for (const sourceColumn of analysedFile.columns) {
      const entry = mapping[sourceColumn]

      if (!entry?.targetSlug) continue

      const field = fieldsBySlug.get(entry.targetSlug) ?? null
      const isReserved = RESERVED_TARGET_SLUGS.includes(
        entry.targetSlug as (typeof RESERVED_TARGET_SLUGS)[number],
      )

      out.push({
        sourceColumn,
        targetSlug: entry.targetSlug,
        field,
        asIField: field
          ? fieldLikeToIField(field)
          : reservedAsIField(entry.targetSlug),
        isReserved,
      })
    }

    return out
  }, [analysedFile.columns, fieldsBySlug, mapping])

  const previewRows = useMemo(
    () => analysedFile.rows.slice(0, previewRowCount),
    [analysedFile.rows, previewRowCount],
  )

  const totalRowCount = analysedFile.rows.length
  const remaining = Math.max(0, totalRowCount - previewRows.length)

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {t(
            'ui.dataImportWizard.preview.heading',
            `Preview first ${previewRows.length} of ${totalRowCount.toLocaleString()} rows`,
          )}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t(
            'ui.dataImportWizard.preview.subheading',
            'Values are rendered with the same widgets used in the data grid. Confirm everything looks right before kicking off the import.',
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant="secondary" className="gap-1">
          <Eye className="size-3" />
          {t(
            'ui.dataImportWizard.preview.columnCount',
            `${resolvedColumns.length} columns`,
          )}
        </Badge>
        <Badge variant={upsertUniqueFields ? 'default' : 'outline'}>
          {upsertUniqueFields
            ? t('ui.dataImportWizard.preview.upsertOn', 'Upsert mode')
            : t('ui.dataImportWizard.preview.insertOnly', 'Insert only')}
        </Badge>
        {uniqueFieldSlugs.length > 0 && (
          <Badge variant="outline">
            {t(
              'ui.dataImportWizard.preview.uniqueOn',
              `Unique on: ${uniqueFieldSlugs.join(', ')}`,
            )}
          </Badge>
        )}
      </div>

      {resolvedColumns.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          {t(
            'ui.dataImportWizard.preview.empty',
            'No columns mapped — go back and map at least one column.',
          )}
        </div>
      ) : (
        <ScrollArea className="rounded-lg border">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead className="sticky top-0 z-10 border-b bg-muted/60 backdrop-blur">
              <tr>
                {resolvedColumns.map((col) => (
                  <th
                    key={col.sourceColumn}
                    className="min-w-[160px] border-r px-3 py-2 text-left font-medium text-foreground last:border-r-0"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="truncate">
                        {col.field?.name ?? col.targetSlug}
                      </span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {col.sourceColumn}
                        {col.isReserved &&
                          ` · ${t('ui.dataImportWizard.preview.reserved', 'reserved')}`}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, idx) => (
                <tr
                  key={`row-${idx}`}
                  className="border-b last:border-b-0 hover:bg-muted/30"
                >
                  {resolvedColumns.map((col) => (
                    <td
                      key={`${col.sourceColumn}-${idx}`}
                      className={cn(
                        'min-w-[160px] border-r px-3 py-2 align-top last:border-r-0',
                        idx % 2 === 1 && 'bg-muted/10',
                      )}
                    >
                      <PreviewCell
                        field={col.asIField}
                        value={
                          (row as Record<string, unknown>)[col.sourceColumn]
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {remaining > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {t(
            'ui.dataImportWizard.preview.remaining',
            `${remaining.toLocaleString()} more rows will be imported.`,
          )}
        </p>
      )}
    </div>
  )
}
