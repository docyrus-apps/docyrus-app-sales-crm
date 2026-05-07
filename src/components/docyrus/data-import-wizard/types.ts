import { type ReactNode } from 'react'

import { type DocyrusFieldLike } from '@/hooks/use-docyrus-field-component'

export type ImportWizardStep =
  | 'upload'
  | 'mapping'
  | 'options'
  | 'preview'
  | 'progress'
  | 'result'

export const IMPORT_WIZARD_STEPS: ReadonlyArray<ImportWizardStep> = [
  'upload',
  'mapping',
  'options',
  'preview',
  'progress',
  'result',
]

/** Reserved target slugs that the import endpoint understands on `simple` data sources. */
export type ReservedTargetSlug =
  | 'name'
  | 'description'
  | 'created_on'
  | 'autonumber_id'

export const RESERVED_TARGET_SLUGS: ReadonlyArray<ReservedTargetSlug> = [
  'name',
  'description',
  'created_on',
  'autonumber_id',
]

/** Server response payload from the upload endpoint. */
export interface UploadedFileInfo {
  fileName: string
  originalName: string
  size: number
  mimeType: string
  filePath: string
}

/** Server response payload from the analyse endpoint (the inner `data` block). */
export interface AnalysedFile {
  fileName: string
  filePath?: string
  columns: ReadonlyArray<string>
  rows: ReadonlyArray<Record<string, unknown>>
  uniqueFieldIds: ReadonlyArray<string>
  uniqueFieldSlugs: ReadonlyArray<string>
  /** Full data source record returned by analyse. Treated opaquely — the hook also resolves fields itself. */
  dataSourceRecord?: unknown
}

/** Per-source-column UI mapping state. */
export interface ColumnMappingState {
  /** Header from the source spreadsheet. */
  sourceColumn: string
  /** Target field slug, reserved slug, or `null` to skip the column. */
  targetSlug: string | null
  /**
   * For composite fields (money/phone), an optional companion source column that
   * carries the secondary value. Stored as the source column header (not the
   * `__amount_currency` slug — `buildImportOptions` derives the secondary slug).
   */
  companionSourceColumn?: string | null
  /** Field-type specific options forwarded to `fieldOptions[col]`. */
  fieldOptions?: {
    /** Relation reference key — defaults to `'name'`. */
    reference_key?: string
    /** Phone default country code (e.g. `'+90'`) OR date format tokens (e.g. `['DAY','MONTH','YEAR']`). */
    format?: string | ReadonlyArray<string>
  }
}

/** Keyed by source column header. */
export type WizardMappingMap = Record<string, ColumnMappingState>

/** Body shape posted to the import endpoint. */
export interface ImportPayloadOptions {
  fieldMapping: Record<string, string>
  fieldOptions?: Record<
    string,
    { reference_key?: string; format?: string | ReadonlyArray<string> }
  >
  uniqueData?: Record<
    string,
    ReadonlyArray<{ id: string; rowValue: unknown; matchedId: string | null }>
  >
  upsertUniqueFields?: boolean
}

/** Server response from the import endpoint (the inner `data` block). */
export interface ImportResultPayload {
  totalSuccessfulRecords: number
  totalWarningRecords: number
  duplicates: Record<string, ReadonlyArray<string>>
  error: ReadonlyArray<{ label: string; error: unknown }>
  uniqueFieldSlugs?: ReadonlyArray<string>
  uniqueRelationIds?: Record<string, Record<string, string | null>>
  columns?: ReadonlyArray<string>
  data?: unknown
  results?: unknown
}

/** Mapping validation result. */
export interface MappingValidationResult {
  valid: boolean
  missing: ReadonlyArray<string>
  duplicateTargets: ReadonlyArray<string>
}

/** Sample value shape for preview cells. */
export type PreviewCellValue = unknown

/**
 * Props for the presentational `<DataImportWizard>` component.
 * The hook (`useDocyrusDataImportWizard`) wires every prop on this interface
 * and then returns a fully-rendered element via `wizard`.
 */
export interface DataImportWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  step: ImportWizardStep
  onStepChange: (next: ImportWizardStep) => void

  /** Target fields the user can map source columns onto. */
  targetFields: ReadonlyArray<DocyrusFieldLike>
  /** Slugs that must be mapped before the user can leave the mapping step. */
  requiredFieldSlugs?: ReadonlyArray<string>
  /** Slugs covered by unique indexes — used by the upsert toggle and uniqueData synthesis. */
  uniqueFieldSlugs?: ReadonlyArray<string>

  file: File | null
  uploadedFile: UploadedFileInfo | null
  analysedFile: AnalysedFile | null
  importResult: ImportResultPayload | null

  isUploading: boolean
  isAnalysing: boolean
  isImporting: boolean
  uploadError: Error | null
  analyseError: Error | null
  importError: Error | null

  mapping: WizardMappingMap
  onMappingChange: (next: WizardMappingMap) => void

  upsertUniqueFields: boolean
  onUpsertChange: (next: boolean) => void

  onPickFile: (file: File) => void
  onAnalyse: () => void
  onConfirmMapping: () => void
  onConfirmOptions: () => void
  onStartImport: () => void
  onReset: () => void
  onClose: () => void

  /** Header title (defaults to a translated string). */
  title?: ReactNode
  /** Header description (defaults to a translated string). */
  description?: ReactNode
  /** DocyrusIcon identifier rendered next to the title. */
  icon?: string
  /** Default 20 MB. */
  maxFileSizeBytes?: number
  /** Default `['xlsx','xls','csv']`. */
  acceptedExtensions?: ReadonlyArray<string>
  /** Number of rows shown in the preview step. Default 10. */
  previewRowCount?: number
  className?: string
}
