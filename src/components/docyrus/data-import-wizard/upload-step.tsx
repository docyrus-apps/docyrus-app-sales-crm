'use client'

import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react'

import { FileSpreadsheet, Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { useUiTranslation } from '@/lib/use-ui-translation'

interface UploadStepProps {
  file: File | null
  uploadedFile: { fileName: string; originalName: string; size: number } | null
  isUploading: boolean
  isAnalysing: boolean
  uploadError: Error | null
  analyseError: Error | null
  acceptedExtensions: ReadonlyArray<string>
  maxFileSizeBytes: number
  onPickFile: (file: File) => void
  onClearFile: () => void
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`

  return `${(size / (1024 * 1024)).toFixed(2)} MB`
}

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.')

  return dot >= 0 ? filename.slice(dot + 1).toLowerCase() : ''
}

export function UploadStep({
  file,
  uploadedFile,
  isUploading,
  isAnalysing,
  uploadError,
  analyseError,
  acceptedExtensions,
  maxFileSizeBytes,
  onPickFile,
  onClearFile,
}: UploadStepProps) {
  const { t } = useUiTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const acceptAttr = useMemo(
    () =>
      acceptedExtensions.map((ext) => `.${ext.replace(/^\./, '')}`).join(','),
    [acceptedExtensions],
  )

  const acceptedSet = useMemo(
    () =>
      new Set(
        acceptedExtensions.map((ext) => ext.replace(/^\./, '').toLowerCase()),
      ),
    [acceptedExtensions],
  )

  const validateAndPick = useCallback(
    (candidate: File) => {
      setLocalError(null)

      const ext = getExtension(candidate.name)

      if (!acceptedSet.has(ext)) {
        setLocalError(
          t(
            'ui.dataImportWizard.upload.invalidType',
            'Unsupported file type. Use XLSX, XLS, or CSV.',
          ),
        )

        return
      }

      if (candidate.size === 0) {
        setLocalError(
          t(
            'ui.dataImportWizard.upload.emptyFile',
            'The selected file is empty.',
          ),
        )

        return
      }

      if (candidate.size > maxFileSizeBytes) {
        const limitMb = Math.round(maxFileSizeBytes / (1024 * 1024))

        setLocalError(
          t(
            'ui.dataImportWizard.upload.tooLarge',
            `File exceeds the ${limitMb} MB limit.`,
          ),
        )

        return
      }

      onPickFile(candidate)
    },
    [acceptedSet, maxFileSizeBytes, onPickFile, t],
  )

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setIsDragActive(false)
      const dropped = e.dataTransfer.files?.[0]

      if (dropped) validateAndPick(dropped)
    },
    [validateAndPick],
  )

  const isWorking = isUploading || isAnalysing
  const errorMessage =
    localError ??
    (uploadError ? uploadError.message : null) ??
    (analyseError ? analyseError.message : null)

  const limitMb = Math.round(maxFileSizeBytes / (1024 * 1024))

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {t(
            'ui.dataImportWizard.upload.heading',
            'Choose a spreadsheet to import',
          )}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t(
            'ui.dataImportWizard.upload.subheading',
            'Drop an XLSX, XLS, or CSV file. The first sheet is read and headers become source columns.',
          )}
        </p>
      </div>

      {!file && !uploadedFile && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragActive(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragActive(false)
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/40',
          )}
        >
          <FileSpreadsheet
            className={cn(
              'size-10',
              isDragActive ? 'text-primary' : 'text-muted-foreground/60',
            )}
          />
          <div className="text-center">
            <p className="text-sm text-foreground">
              {t(
                'ui.dataImportWizard.upload.dropzone',
                'Drag & drop a spreadsheet here, or',
              )}
            </p>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-sm"
              onClick={() => inputRef.current?.click()}
              disabled={isWorking}
            >
              {t('ui.dataImportWizard.upload.browse', 'browse to upload')}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground/80">
              {t(
                'ui.dataImportWizard.upload.maxSize',
                `Max ${limitMb} MB · XLSX, XLS, CSV`,
              )}
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={acceptAttr}
            className="hidden"
            onChange={(e) => {
              const picked = e.target.files?.[0]

              if (picked) validateAndPick(picked)
              e.target.value = ''
            }}
          />
        </div>
      )}

      {(file || uploadedFile) && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <FileSpreadsheet className="size-8 text-primary" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-foreground">
              {uploadedFile?.originalName ?? file?.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatBytes(uploadedFile?.size ?? file?.size ?? 0)}
              {uploadedFile && (
                <>
                  {' · '}
                  {t('ui.dataImportWizard.upload.uploaded', 'Uploaded')}
                </>
              )}
            </span>
          </div>
          {isWorking ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>
                {isUploading
                  ? t('ui.dataImportWizard.upload.uploading', 'Uploading…')
                  : t('ui.dataImportWizard.upload.analysing', 'Reading file…')}
              </span>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClearFile}
              aria-label={t(
                'ui.dataImportWizard.upload.removeFile',
                'Remove file',
              )}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}
    </div>
  )
}
