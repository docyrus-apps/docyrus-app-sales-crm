'use client'

import { useMemo } from 'react'

import { AlertCircle, Link2, Sparkles } from 'lucide-react'

import { type DocyrusFieldLike } from '@/hooks/use-docyrus-field-component'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/lib/use-ui-translation'

import {
  RESERVED_TARGET_SLUGS,
  type AnalysedFile,
  type ColumnMappingState,
  type WizardMappingMap,
} from './types'
import { validateMapping } from './lib/payload'
import { inferFieldOptions } from './lib/auto-mapping'

const SKIP_VALUE = '__skip__'
const COMPANION_NONE_VALUE = '__none__'

const RESERVED_LABELS: Record<string, string> = {
  name: 'Name',
  description: 'Description',
  created_on: 'Created on',
  autonumber_id: 'Autonumber',
}

/** Date format token options surfaced for `field-date` / `field-dateTime`. */
const DATE_FORMAT_OPTIONS = [
  'DAY-MONTH-YEAR',
  'MONTH-DAY-YEAR',
  'YEAR-MONTH-DAY',
  'YEAR-DAY-MONTH',
] as const

const COMMON_REFERENCE_KEYS = [
  'name',
  'email',
  'slug',
  'code',
  'autonumber_id',
  'identity',
] as const

interface MappingStepProps {
  analysedFile: AnalysedFile
  targetFields: ReadonlyArray<DocyrusFieldLike>
  requiredFieldSlugs: ReadonlyArray<string>
  mapping: WizardMappingMap
  onMappingChange: (next: WizardMappingMap) => void
}

interface FieldOption {
  slug: string
  field: DocyrusFieldLike | null
  isReserved: boolean
  required: boolean
}

function getFieldLabel(field: DocyrusFieldLike): string {
  return field.name || field.slug
}

function shortenType(type: string | undefined): string {
  if (!type) return ''

  return type.replace(/^field-/, '')
}

export function MappingStep({
  analysedFile,
  targetFields,
  requiredFieldSlugs,
  mapping,
  onMappingChange,
}: MappingStepProps) {
  const { t } = useUiTranslation()

  const requiredSet = useMemo(
    () => new Set(requiredFieldSlugs),
    [requiredFieldSlugs],
  )

  const fieldOptions = useMemo<Array<FieldOption>>(() => {
    const list: Array<FieldOption> = []

    for (const field of targetFields) {
      list.push({
        slug: String(field.slug),
        field,
        isReserved: false,
        required: requiredSet.has(String(field.slug)),
      })
    }

    for (const slug of RESERVED_TARGET_SLUGS) {
      if (!list.some((opt) => opt.slug === slug)) {
        list.push({
          slug,
          field: null,
          isReserved: true,
          required: false,
        })
      }
    }

    return list
  }, [targetFields, requiredSet])

  const fieldsBySlug = useMemo(() => {
    const map = new Map<string, DocyrusFieldLike>()

    for (const field of targetFields) {
      if (field.slug) map.set(String(field.slug), field)
    }

    return map
  }, [targetFields])

  const claimedTargets = useMemo(() => {
    const map = new Map<string, string>() // slug → owning sourceColumn

    for (const entry of Object.values(mapping)) {
      if (entry.targetSlug) map.set(entry.targetSlug, entry.sourceColumn)
    }

    return map
  }, [mapping])

  const companionsByOwner = useMemo(() => {
    const map = new Map<string, string>() // companionColumn → ownerColumn

    for (const entry of Object.values(mapping)) {
      if (entry.companionSourceColumn)
        map.set(entry.companionSourceColumn, entry.sourceColumn)
    }

    return map
  }, [mapping])

  const validation = useMemo(
    () => validateMapping(mapping, requiredFieldSlugs),
    [mapping, requiredFieldSlugs],
  )

  const summary = useMemo(() => {
    let mapped = 0

    for (const entry of Object.values(mapping)) {
      if (entry.targetSlug) mapped += 1
    }

    return {
      mapped,
      total: analysedFile.columns.length,
      unmapped: analysedFile.columns.length - mapped,
    }
  }, [mapping, analysedFile.columns.length])

  const handleTargetChange = (sourceColumn: string, value: string) => {
    const next: WizardMappingMap = { ...mapping }
    const existing = next[sourceColumn] ?? { sourceColumn, targetSlug: null }

    if (value === SKIP_VALUE) {
      next[sourceColumn] = {
        sourceColumn,
        targetSlug: null,
      }
    } else {
      const matched = fieldsBySlug.get(value)
      const inferred = matched ? inferFieldOptions(matched) : undefined

      next[sourceColumn] = {
        ...existing,
        sourceColumn,
        targetSlug: value,
        companionSourceColumn: null,
        fieldOptions: inferred,
      }

      for (const [otherKey, otherEntry] of Object.entries(next)) {
        if (otherKey === sourceColumn) continue
        if (otherEntry.targetSlug === value) {
          next[otherKey] = { sourceColumn: otherKey, targetSlug: null }
        }
      }
    }

    onMappingChange(next)
  }

  const updateEntry = (
    sourceColumn: string,
    patch: Partial<ColumnMappingState>,
  ) => {
    const existing = mapping[sourceColumn] ?? { sourceColumn, targetSlug: null }

    onMappingChange({
      ...mapping,
      [sourceColumn]: { ...existing, ...patch, sourceColumn },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {t(
            'ui.dataImportWizard.mapping.heading',
            'Map source columns to target fields',
          )}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t(
            'ui.dataImportWizard.mapping.subheading',
            "We pre-fill the obvious matches. Adjust each row, configure type-specific options, and skip columns you don't need.",
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="size-3" />
          {t(
            'ui.dataImportWizard.mapping.statsMapped',
            `${summary.mapped} of ${summary.total} mapped`,
          )}
        </Badge>
        {summary.unmapped > 0 && (
          <Badge variant="outline" className="gap-1">
            {t(
              'ui.dataImportWizard.mapping.statsUnmapped',
              `${summary.unmapped} unmapped`,
            )}
          </Badge>
        )}
      </div>

      {(validation.missing.length > 0 ||
        validation.duplicateTargets.length > 0) && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300"
        >
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="size-4" />
            {t(
              'ui.dataImportWizard.mapping.validationHeading',
              'Resolve before continuing',
            )}
          </div>
          {validation.missing.length > 0 && (
            <p>
              {t(
                'ui.dataImportWizard.mapping.missingRequired',
                'Required fields not mapped:',
              )}{' '}
              {validation.missing.join(', ')}
            </p>
          )}
          {validation.duplicateTargets.length > 0 && (
            <p>
              {t(
                'ui.dataImportWizard.mapping.duplicateTargets',
                'Multiple columns map to the same target:',
              )}{' '}
              {validation.duplicateTargets.join(', ')}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {analysedFile.columns.map((column) => {
          const entry = mapping[column] ?? {
            sourceColumn: column,
            targetSlug: null,
          }
          const matchedField = entry.targetSlug
            ? (fieldsBySlug.get(entry.targetSlug) ?? null)
            : null

          return (
            <MappingRow
              key={column}
              column={column}
              entry={entry}
              sampleValues={sampleValues(analysedFile, column)}
              fieldOptions={fieldOptions}
              claimedTargets={claimedTargets}
              companionsByOwner={companionsByOwner}
              allColumns={analysedFile.columns}
              field={matchedField}
              onTargetChange={(value) => handleTargetChange(column, value)}
              onPatch={(patch) => updateEntry(column, patch)}
            />
          )
        })}
      </div>
    </div>
  )
}

function sampleValues(
  analysedFile: AnalysedFile,
  column: string,
): Array<string> {
  const samples: Array<string> = []

  for (const row of analysedFile.rows) {
    if (samples.length >= 3) break
    const raw = (row as Record<string, unknown>)[column]

    if (raw === null || raw === undefined || raw === '') continue
    samples.push(String(raw).slice(0, 40))
  }

  return samples
}

interface MappingRowProps {
  column: string
  entry: ColumnMappingState
  sampleValues: ReadonlyArray<string>
  fieldOptions: ReadonlyArray<FieldOption>
  claimedTargets: Map<string, string>
  companionsByOwner: Map<string, string>
  allColumns: ReadonlyArray<string>
  field: DocyrusFieldLike | null
  onTargetChange: (value: string) => void
  onPatch: (patch: Partial<ColumnMappingState>) => void
}

function MappingRow({
  column,
  entry,
  sampleValues,
  fieldOptions,
  claimedTargets,
  companionsByOwner,
  allColumns,
  field,
  onTargetChange,
  onPatch,
}: MappingRowProps) {
  const { t } = useUiTranslation()

  const isCompanionTo = companionsByOwner.get(column) ?? null
  const fieldType = field ? String(field.type) : null

  const required = fieldOptions.filter((opt) => opt.required)
  const standard = fieldOptions.filter(
    (opt) => !opt.required && !opt.isReserved,
  )
  const reserved = fieldOptions.filter((opt) => opt.isReserved)

  const renderItem = (opt: FieldOption) => {
    const claimedBy = claimedTargets.get(opt.slug)
    const isClaimedElsewhere = Boolean(claimedBy && claimedBy !== column)
    const labelText = opt.field
      ? getFieldLabel(opt.field)
      : (RESERVED_LABELS[opt.slug] ?? opt.slug)

    return (
      <SelectItem key={opt.slug} value={opt.slug} disabled={isClaimedElsewhere}>
        <span className="flex items-center gap-2">
          <span>{labelText}</span>
          {opt.required && (
            <Badge variant="destructive" className="text-[10px]">
              {t('ui.dataImportWizard.mapping.required', 'Required')}
            </Badge>
          )}
          {opt.field?.type && (
            <span className="text-xs text-muted-foreground">
              {shortenType(String(opt.field.type))}
            </span>
          )}
          {isClaimedElsewhere && (
            <span className="text-xs text-muted-foreground">
              (
              {t(
                'ui.dataImportWizard.mapping.usedBy',
                `used by "${claimedBy}"`,
              )}
              )
            </span>
          )}
        </span>
      </SelectItem>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-3 transition-colors',
        isCompanionTo && 'border-primary/40 bg-primary/5',
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <div className="md:w-1/3">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-foreground">
              {column}
            </span>
            {isCompanionTo && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Link2 className="size-3" />
                {t(
                  'ui.dataImportWizard.mapping.companionTo',
                  `Companion of "${isCompanionTo}"`,
                )}
              </Badge>
            )}
          </div>
          {sampleValues.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {sampleValues.map((sample, idx) => (
                <Badge
                  key={`${column}-sample-${idx}`}
                  variant="outline"
                  className="font-normal text-muted-foreground"
                >
                  {sample}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label className="text-xs text-muted-foreground">
              {t('ui.dataImportWizard.mapping.targetLabel', 'Map to')}
            </Label>
            <Select
              value={entry.targetSlug ?? SKIP_VALUE}
              onValueChange={onTargetChange}
              disabled={Boolean(isCompanionTo)}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={t(
                    'ui.dataImportWizard.mapping.selectPlaceholder',
                    'Select a target field…',
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SKIP_VALUE}>
                  <span className="text-muted-foreground">
                    {t(
                      'ui.dataImportWizard.mapping.skipColumn',
                      'Skip this column',
                    )}
                  </span>
                </SelectItem>
                {required.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>
                      {t(
                        'ui.dataImportWizard.mapping.groupRequired',
                        'Required',
                      )}
                    </SelectLabel>
                    {required.map(renderItem)}
                  </SelectGroup>
                )}
                {standard.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>
                      {t(
                        'ui.dataImportWizard.mapping.groupOptional',
                        'Optional',
                      )}
                    </SelectLabel>
                    {standard.map(renderItem)}
                  </SelectGroup>
                )}
                {reserved.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>
                      {t('ui.dataImportWizard.mapping.groupReserved', 'System')}
                    </SelectLabel>
                    {reserved.map(renderItem)}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          {field && fieldType === 'field-relation' && (
            <RelationOptions entry={entry} onPatch={onPatch} />
          )}

          {field && fieldType === 'field-phone' && (
            <PhoneOptions
              entry={entry}
              onPatch={onPatch}
              allColumns={allColumns}
              currentColumn={column}
              companionsByOwner={companionsByOwner}
            />
          )}

          {field &&
            (fieldType === 'field-date' ||
              fieldType === 'field-dateTime' ||
              fieldType === 'field-dateRange') && (
              <DateOptions entry={entry} onPatch={onPatch} />
            )}

          {field && fieldType === 'field-money' && (
            <MoneyOptions
              entry={entry}
              onPatch={onPatch}
              allColumns={allColumns}
              currentColumn={column}
              companionsByOwner={companionsByOwner}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function RelationOptions({
  entry,
  onPatch,
}: {
  entry: ColumnMappingState
  onPatch: (patch: Partial<ColumnMappingState>) => void
}) {
  const { t } = useUiTranslation()
  const referenceKey =
    typeof entry.fieldOptions?.reference_key === 'string'
      ? entry.fieldOptions.reference_key
      : 'name'

  return (
    <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
      <Label className="text-xs text-muted-foreground">
        {t('ui.dataImportWizard.mapping.referenceKey', 'Match relation by')}
      </Label>
      <Input
        value={referenceKey}
        list={`reference-key-suggestions-${entry.sourceColumn}`}
        onChange={(e) =>
          onPatch({
            fieldOptions: {
              ...entry.fieldOptions,
              reference_key: e.target.value,
            },
          })
        }
        placeholder="name"
      />
      <datalist id={`reference-key-suggestions-${entry.sourceColumn}`}>
        {COMMON_REFERENCE_KEYS.map((key) => (
          <option key={key} value={key} />
        ))}
      </datalist>
    </div>
  )
}

function PhoneOptions({
  entry,
  onPatch,
  allColumns,
  currentColumn,
  companionsByOwner,
}: {
  entry: ColumnMappingState
  onPatch: (patch: Partial<ColumnMappingState>) => void
  allColumns: ReadonlyArray<string>
  currentColumn: string
  companionsByOwner: Map<string, string>
}) {
  const { t } = useUiTranslation()
  const format =
    typeof entry.fieldOptions?.format === 'string'
      ? entry.fieldOptions.format
      : '+90'
  const eligibleColumns = allColumns.filter((col) => {
    if (col === currentColumn) return false
    const owner = companionsByOwner.get(col)

    return !owner || owner === currentColumn
  })

  return (
    <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
      <Label className="text-xs text-muted-foreground">
        {t('ui.dataImportWizard.mapping.phoneFormat', 'Default country code')}
      </Label>
      <Input
        value={format}
        onChange={(e) =>
          onPatch({
            fieldOptions: { ...entry.fieldOptions, format: e.target.value },
          })
        }
        placeholder="+90"
      />

      <Label className="text-xs text-muted-foreground">
        {t(
          'ui.dataImportWizard.mapping.phoneCompanion',
          'Country code from column',
        )}
      </Label>
      <Select
        value={entry.companionSourceColumn ?? COMPANION_NONE_VALUE}
        onValueChange={(value) =>
          onPatch({
            companionSourceColumn:
              value === COMPANION_NONE_VALUE ? null : value,
          })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={t(
              'ui.dataImportWizard.mapping.companionNone',
              'No companion column',
            )}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={COMPANION_NONE_VALUE}>
            <span className="text-muted-foreground">
              {t(
                'ui.dataImportWizard.mapping.companionNone',
                'No companion column',
              )}
            </span>
          </SelectItem>
          {eligibleColumns.map((col) => (
            <SelectItem key={col} value={col}>
              {col}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function DateOptions({
  entry,
  onPatch,
}: {
  entry: ColumnMappingState
  onPatch: (patch: Partial<ColumnMappingState>) => void
}) {
  const { t } = useUiTranslation()
  const tokens = Array.isArray(entry.fieldOptions?.format)
    ? (entry.fieldOptions?.format as ReadonlyArray<string>)
    : ['DAY', 'MONTH', 'YEAR']
  const value = tokens.join('-')

  return (
    <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
      <Label className="text-xs text-muted-foreground">
        {t('ui.dataImportWizard.mapping.dateFormat', 'Date order')}
      </Label>
      <Select
        value={value}
        onValueChange={(next) => {
          const parts = next.split('-').filter(Boolean)

          onPatch({ fieldOptions: { ...entry.fieldOptions, format: parts } })
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_FORMAT_OPTIONS.map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt.replaceAll('-', ' / ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function MoneyOptions({
  entry,
  onPatch,
  allColumns,
  currentColumn,
  companionsByOwner,
}: {
  entry: ColumnMappingState
  onPatch: (patch: Partial<ColumnMappingState>) => void
  allColumns: ReadonlyArray<string>
  currentColumn: string
  companionsByOwner: Map<string, string>
}) {
  const { t } = useUiTranslation()
  const eligibleColumns = allColumns.filter((col) => {
    if (col === currentColumn) return false
    const owner = companionsByOwner.get(col)

    return !owner || owner === currentColumn
  })

  return (
    <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
      <Label className="text-xs text-muted-foreground">
        {t(
          'ui.dataImportWizard.mapping.moneyCompanion',
          'Currency from column',
        )}
      </Label>
      <Select
        value={entry.companionSourceColumn ?? COMPANION_NONE_VALUE}
        onValueChange={(value) =>
          onPatch({
            companionSourceColumn:
              value === COMPANION_NONE_VALUE ? null : value,
          })
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue
            placeholder={t(
              'ui.dataImportWizard.mapping.companionNone',
              'No companion column',
            )}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={COMPANION_NONE_VALUE}>
            <span className="text-muted-foreground">
              {t(
                'ui.dataImportWizard.mapping.companionNone',
                'No companion column',
              )}
            </span>
          </SelectItem>
          {eligibleColumns.map((col) => (
            <SelectItem key={col} value={col}>
              {col}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
