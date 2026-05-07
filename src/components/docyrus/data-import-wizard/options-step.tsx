'use client'

import { useMemo, type ReactNode } from 'react'

import { CheckCircle2, ListChecks, Rows3, ShieldCheck } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/lib/use-ui-translation'

import { type AnalysedFile, type WizardMappingMap } from './types'

interface OptionsStepProps {
  analysedFile: AnalysedFile
  mapping: WizardMappingMap
  uniqueFieldSlugs: ReadonlyArray<string>
  upsertUniqueFields: boolean
  onUpsertChange: (next: boolean) => void
}

interface StatTileProps {
  icon: ReactNode
  label: string
  value: ReactNode
  hint?: ReactNode
}

function StatTile({ icon, label, value, hint }: StatTileProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border bg-card p-3">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-base font-semibold text-foreground">{value}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </div>
  )
}

export function OptionsStep({
  analysedFile,
  mapping,
  uniqueFieldSlugs,
  upsertUniqueFields,
  onUpsertChange,
}: OptionsStepProps) {
  const { t } = useUiTranslation()

  const stats = useMemo(() => {
    let mapped = 0

    for (const entry of Object.values(mapping)) {
      if (entry.targetSlug) mapped += 1
    }

    return {
      rowCount: analysedFile.rows.length,
      columnCount: analysedFile.columns.length,
      mappedCount: mapped,
      unmappedCount: analysedFile.columns.length - mapped,
    }
  }, [analysedFile.columns.length, analysedFile.rows.length, mapping])

  const hasUniqueFields = uniqueFieldSlugs.length > 0

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {t(
            'ui.dataImportWizard.options.heading',
            'Review options before importing',
          )}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t(
            'ui.dataImportWizard.options.subheading',
            'Decide whether existing records should be updated when their unique key matches.',
          )}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={<Rows3 className="size-4" />}
          label={t('ui.dataImportWizard.options.rowsLabel', 'Rows in file')}
          value={stats.rowCount.toLocaleString()}
        />
        <StatTile
          icon={<ListChecks className="size-4" />}
          label={t(
            'ui.dataImportWizard.options.columnsLabel',
            'Source columns',
          )}
          value={stats.columnCount.toLocaleString()}
          hint={t(
            'ui.dataImportWizard.options.columnsHint',
            `${stats.mappedCount} mapped · ${stats.unmappedCount} skipped`,
          )}
        />
        <StatTile
          icon={<CheckCircle2 className="size-4" />}
          label={t('ui.dataImportWizard.options.uniqueLabel', 'Unique fields')}
          value={
            hasUniqueFields
              ? uniqueFieldSlugs.length
              : t('ui.dataImportWizard.options.noUniqueShort', 'None')
          }
          hint={
            hasUniqueFields
              ? undefined
              : t(
                  'ui.dataImportWizard.options.noUniqueHint',
                  'Duplicates are skipped on insert.',
                )
          }
        />
        <StatTile
          icon={<ShieldCheck className="size-4" />}
          label={t('ui.dataImportWizard.options.modeLabel', 'Mode')}
          value={
            upsertUniqueFields
              ? t('ui.dataImportWizard.options.modeUpsert', 'Upsert')
              : t('ui.dataImportWizard.options.modeInsert', 'Insert only')
          }
          hint={
            upsertUniqueFields && !hasUniqueFields
              ? t(
                  'ui.dataImportWizard.options.modeWarning',
                  'No unique fields — upsert will not match anything.',
                )
              : undefined
          }
        />
      </div>

      <div
        className={cn(
          'flex items-start gap-3 rounded-lg border p-4',
          upsertUniqueFields && hasUniqueFields
            ? 'border-primary/40 bg-primary/5'
            : 'bg-card',
        )}
      >
        <Switch
          id="data-import-wizard-upsert"
          checked={upsertUniqueFields}
          onCheckedChange={onUpsertChange}
          disabled={!hasUniqueFields}
        />
        <div className="flex flex-1 flex-col gap-1">
          <Label
            htmlFor="data-import-wizard-upsert"
            className="text-sm font-medium text-foreground"
          >
            {t(
              'ui.dataImportWizard.options.upsert',
              'Update existing records on unique-key match',
            )}
          </Label>
          <p className="text-sm text-muted-foreground">
            {t(
              'ui.dataImportWizard.options.upsertHelp',
              'When enabled, rows whose unique fields already exist will overwrite the existing record instead of being skipped as duplicates.',
            )}
          </p>
          {hasUniqueFields && (
            <div className="mt-1 flex flex-wrap gap-1">
              {uniqueFieldSlugs.map((slug) => (
                <Badge key={slug} variant="outline" className="text-xs">
                  {slug}
                </Badge>
              ))}
            </div>
          )}
          {!hasUniqueFields && (
            <p className="mt-1 text-xs text-muted-foreground/80">
              {t(
                'ui.dataImportWizard.options.noUniqueDetailed',
                "This data source has no unique indexes, so upsert isn't available. Imported rows will be inserted as new records.",
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
