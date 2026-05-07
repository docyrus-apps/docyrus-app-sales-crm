'use client'

import { useMemo } from 'react'

import { Loader2 } from 'lucide-react'

import {
  AwesomeDialog,
  AwesomeDialogBody,
  AwesomeDialogContent,
  AwesomeDialogFooter,
  AwesomeDialogHeader,
} from '@/components/docyrus/awesome-dialog'
import { Step, Stepper } from '@/components/docyrus/stepper'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/lib/use-ui-translation'

import { MappingStep } from './mapping-step'
import { OptionsStep } from './options-step'
import { PreviewStep } from './preview-step'
import { ProgressStep } from './progress-step'
import { UploadStep } from './upload-step'
import { validateMapping } from './lib/payload'
import { type DataImportWizardProps, type ImportWizardStep } from './types'

const STEP_INDEX_MAP: Record<ImportWizardStep, number> = {
  upload: 0,
  mapping: 1,
  options: 2,
  preview: 3,
  progress: 4,
  result: 4,
}

const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024
const DEFAULT_PREVIEW_ROWS = 10
const DEFAULT_ACCEPTED_EXTENSIONS = ['xlsx', 'xls', 'csv'] as const

export function DataImportWizard(props: DataImportWizardProps) {
  const { t } = useUiTranslation()

  const acceptedExtensions =
    props.acceptedExtensions ?? DEFAULT_ACCEPTED_EXTENSIONS
  const maxFileSizeBytes = props.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE
  const previewRowCount = props.previewRowCount ?? DEFAULT_PREVIEW_ROWS

  const requiredFieldSlugs = useMemo<ReadonlyArray<string>>(
    () => props.requiredFieldSlugs ?? [],
    [props.requiredFieldSlugs],
  )
  const uniqueFieldSlugs = useMemo<ReadonlyArray<string>>(
    () => props.uniqueFieldSlugs ?? [],
    [props.uniqueFieldSlugs],
  )

  const stepIndex = STEP_INDEX_MAP[props.step]
  const validation = useMemo(
    () => validateMapping(props.mapping, requiredFieldSlugs),
    [props.mapping, requiredFieldSlugs],
  )

  const canContinueFromUpload =
    Boolean(props.analysedFile) && !props.isAnalysing && !props.isUploading
  const canContinueFromMapping = validation.valid

  const headerTitle =
    props.title ?? t('ui.dataImportWizard.title', 'Import data')
  const headerDescription =
    props.description ??
    t(
      'ui.dataImportWizard.description',
      'Upload a spreadsheet to import records into this data source.',
    )

  const isProcessing =
    props.isUploading || props.isAnalysing || props.isImporting

  return (
    <AwesomeDialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      container="modal"
      size="xl"
      fullscreenable
      resizable
      preventOutsideClose={isProcessing}
    >
      <AwesomeDialogContent>
        <AwesomeDialogHeader
          title={typeof headerTitle === 'string' ? headerTitle : undefined}
          description={
            typeof headerDescription === 'string'
              ? headerDescription
              : undefined
          }
          icon={props.icon ?? 'fal file-import'}
          closable={!isProcessing}
        />

        <AwesomeDialogBody
          className={cn('flex flex-col gap-5', props.className)}
        >
          <Stepper
            activeStep={stepIndex}
            variant="default"
            size="default"
            alternativeLabel
          >
            <Step label={t('ui.dataImportWizard.steps.upload', 'Upload')} />
            <Step
              label={t('ui.dataImportWizard.steps.mapping', 'Map fields')}
            />
            <Step label={t('ui.dataImportWizard.steps.options', 'Options')} />
            <Step label={t('ui.dataImportWizard.steps.preview', 'Preview')} />
            <Step label={t('ui.dataImportWizard.steps.result', 'Result')} />
          </Stepper>

          <div className="min-h-0 flex-1">
            {props.step === 'upload' && (
              <UploadStep
                file={props.file}
                uploadedFile={props.uploadedFile}
                isUploading={props.isUploading}
                isAnalysing={props.isAnalysing}
                uploadError={props.uploadError}
                analyseError={props.analyseError}
                acceptedExtensions={acceptedExtensions}
                maxFileSizeBytes={maxFileSizeBytes}
                onPickFile={props.onPickFile}
                onClearFile={props.onReset}
              />
            )}

            {props.step === 'mapping' && props.analysedFile && (
              <MappingStep
                analysedFile={props.analysedFile}
                targetFields={props.targetFields}
                requiredFieldSlugs={requiredFieldSlugs}
                mapping={props.mapping}
                onMappingChange={props.onMappingChange}
              />
            )}

            {props.step === 'options' && props.analysedFile && (
              <OptionsStep
                analysedFile={props.analysedFile}
                mapping={props.mapping}
                uniqueFieldSlugs={uniqueFieldSlugs}
                upsertUniqueFields={props.upsertUniqueFields}
                onUpsertChange={props.onUpsertChange}
              />
            )}

            {props.step === 'preview' && props.analysedFile && (
              <PreviewStep
                analysedFile={props.analysedFile}
                targetFields={props.targetFields}
                mapping={props.mapping}
                upsertUniqueFields={props.upsertUniqueFields}
                uniqueFieldSlugs={uniqueFieldSlugs}
                previewRowCount={previewRowCount}
              />
            )}

            {(props.step === 'progress' || props.step === 'result') && (
              <ProgressStep
                isImporting={props.isImporting}
                importError={props.importError}
                result={props.importResult}
              />
            )}
          </div>
        </AwesomeDialogBody>

        <AwesomeDialogFooter>
          <WizardFooter
            step={props.step}
            isProcessing={isProcessing}
            isUploading={props.isUploading}
            isAnalysing={props.isAnalysing}
            isImporting={props.isImporting}
            canContinueFromUpload={canContinueFromUpload}
            canContinueFromMapping={canContinueFromMapping}
            onAnalyse={props.onAnalyse}
            onConfirmMapping={props.onConfirmMapping}
            onConfirmOptions={props.onConfirmOptions}
            onStartImport={props.onStartImport}
            onStepChange={props.onStepChange}
            onReset={props.onReset}
            onClose={props.onClose}
          />
        </AwesomeDialogFooter>
      </AwesomeDialogContent>
    </AwesomeDialog>
  )
}

interface WizardFooterProps {
  step: ImportWizardStep
  isProcessing: boolean
  isUploading: boolean
  isAnalysing: boolean
  isImporting: boolean
  canContinueFromUpload: boolean
  canContinueFromMapping: boolean
  onAnalyse: () => void
  onConfirmMapping: () => void
  onConfirmOptions: () => void
  onStartImport: () => void
  onStepChange: (next: ImportWizardStep) => void
  onReset: () => void
  onClose: () => void
}

function WizardFooter({
  step,
  isProcessing,
  isUploading,
  isAnalysing,
  isImporting,
  canContinueFromUpload,
  canContinueFromMapping,
  onAnalyse,
  onConfirmMapping,
  onConfirmOptions,
  onStartImport,
  onStepChange,
  onReset,
  onClose,
}: WizardFooterProps) {
  const { t } = useUiTranslation()

  if (step === 'result') {
    return (
      <>
        <Button variant="outline" onClick={onReset}>
          {t(
            'ui.dataImportWizard.actions.importAnother',
            'Import another file',
          )}
        </Button>
        <Button onClick={onClose}>
          {t('ui.dataImportWizard.actions.done', 'Done')}
        </Button>
      </>
    )
  }

  if (step === 'progress') {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="size-4 animate-spin" />
        {t('ui.dataImportWizard.actions.importingNow', 'Importing…')}
      </Button>
    )
  }

  const backStep: ImportWizardStep | null =
    step === 'upload'
      ? null
      : step === 'mapping'
        ? 'upload'
        : step === 'options'
          ? 'mapping'
          : step === 'preview'
            ? 'options'
            : null

  const handlePrimary = () => {
    if (step === 'upload') return onAnalyse()
    if (step === 'mapping') return onConfirmMapping()
    if (step === 'options') return onConfirmOptions()
    if (step === 'preview') return onStartImport()
  }

  const primaryLabel =
    step === 'upload'
      ? isAnalysing
        ? t('ui.dataImportWizard.actions.analysing', 'Analysing…')
        : isUploading
          ? t('ui.dataImportWizard.actions.uploading', 'Uploading…')
          : t('ui.dataImportWizard.actions.continue', 'Continue')
      : step === 'mapping'
        ? t('ui.dataImportWizard.actions.mappingNext', 'Continue to options')
        : step === 'options'
          ? t('ui.dataImportWizard.actions.optionsNext', 'Continue to preview')
          : step === 'preview'
            ? isImporting
              ? t('ui.dataImportWizard.actions.importing', 'Importing…')
              : t('ui.dataImportWizard.actions.startImport', 'Start import')
            : t('ui.dataImportWizard.actions.continue', 'Continue')

  const primaryDisabled =
    isProcessing ||
    (step === 'upload' && !canContinueFromUpload) ||
    (step === 'mapping' && !canContinueFromMapping)

  return (
    <>
      {backStep && (
        <Button
          variant="ghost"
          onClick={() => onStepChange(backStep)}
          disabled={isProcessing}
        >
          {t('ui.dataImportWizard.actions.back', 'Back')}
        </Button>
      )}
      <div className="flex-1" />
      <Button variant="outline" onClick={onClose} disabled={isProcessing}>
        {t('ui.dataImportWizard.actions.cancel', 'Cancel')}
      </Button>
      <Button onClick={handlePrimary} disabled={primaryDisabled}>
        {(isUploading || isAnalysing || isImporting) && (
          <Loader2 className="size-4 animate-spin" />
        )}
        {primaryLabel}
      </Button>
    </>
  )
}
