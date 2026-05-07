'use client'

export { DataImportWizard } from './data-import-wizard'
export { UploadStep } from './upload-step'
export { MappingStep } from './mapping-step'
export { OptionsStep } from './options-step'
export { PreviewStep } from './preview-step'
export { ProgressStep } from './progress-step'

export {
  buildAutoMapping,
  inferFieldOptions,
  normalizeKey,
  slugify,
} from './lib/auto-mapping'

export {
  buildImportOptions,
  buildUniqueDataPayload,
  collectUniqueDataLookups,
  getSecondarySlug,
  isEnumLikeType,
  isRelationLikeType,
  validateMapping,
  type UniqueDataLookupSpec,
} from './lib/payload'

export { IMPORT_WIZARD_STEPS, RESERVED_TARGET_SLUGS } from './types'

export type {
  AnalysedFile,
  ColumnMappingState,
  DataImportWizardProps,
  ImportPayloadOptions,
  ImportResultPayload,
  ImportWizardStep,
  MappingValidationResult,
  ReservedTargetSlug,
  UploadedFileInfo,
  WizardMappingMap,
} from './types'
