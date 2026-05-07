'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactElement,
} from 'react'

import { useMutation } from '@tanstack/react-query'

import {
  DataImportWizard,
  buildAutoMapping,
  buildImportOptions,
  buildUniqueDataPayload,
  collectUniqueDataLookups,
  isEnumLikeType,
  slugify,
  type AnalysedFile,
  type DataImportWizardProps,
  type ImportPayloadOptions,
  type ImportResultPayload,
  type ImportWizardStep,
  type UploadedFileInfo,
  type WizardMappingMap,
} from '@/components/docyrus/data-import-wizard'

import {
  useDocyrusDataViewSelect,
  type UseDocyrusDataViewSelectOptions,
} from './use-docyrus-data-view-select'
import { type DocyrusFieldLike } from './use-docyrus-field-component'

interface ImportEndpoints {
  upload?: string
  analyse?: string
  import?: string
}

export interface UseDocyrusDataImportWizardOptions extends Pick<
  UseDocyrusDataViewSelectOptions,
  'client' | 'appSlug' | 'dataSourceSlug' | 'appId'
> {
  /**
   * Pre-resolved target fields. When provided, the hook skips its internal
   * data source fetch — pass the same field array your `useDocyrusDataGrid`
   * call relies on.
   */
  fields?: ReadonlyArray<DocyrusFieldLike>
  /** Field slugs that must be mapped before the user can leave the mapping step. */
  requiredFieldSlugs?: ReadonlyArray<string>
  /**
   * Field slugs covered by unique indexes. When omitted the hook reads them
   * from the analyse endpoint response (the import API knows them).
   */
  uniqueFieldSlugs?: ReadonlyArray<string>
  /** Override the three import endpoints (e.g. for tenant-specific routing). */
  endpoints?: ImportEndpoints
  /** Number of rows shown in the preview step. Default 10. */
  previewRowCount?: number
  /** Default 20 MB. */
  maxFileSizeBytes?: number
  /** Default `['xlsx','xls','csv']`. */
  acceptedExtensions?: ReadonlyArray<string>
  /** Optional default mapping seed — overrides auto-mapping. */
  initialMapping?: WizardMappingMap
  /** When false the hook returns `wizard: null` (use as a feature flag). */
  enabled?: boolean
  /** Controlled open state. When omitted the hook owns the open flag. */
  open?: boolean
  /** Called whenever the open state changes (controlled or not). */
  onOpenChange?: (open: boolean) => void
  /** Fires after a successful import. The result payload mirrors the API response. */
  onImported?: (result: ImportResultPayload) => void
  /** Fires whenever any of the three phases throws. */
  onError?: (error: Error, phase: 'upload' | 'analyse' | 'import') => void
  /** Override the wizard header title. */
  title?: DataImportWizardProps['title']
  /** Override the wizard header description. */
  description?: DataImportWizardProps['description']
}

export interface UseDocyrusDataImportWizardResult {
  open: boolean
  openWizard: () => void
  closeWizard: () => void
  resetWizard: () => void

  step: ImportWizardStep
  setStep: (next: ImportWizardStep) => void

  /** Render this once next to the trigger button — already wired. */
  wizard: ReactElement | null

  /** Imperative escape hatches — useful for custom flows or tests. */
  uploadAsync: (file: File) => Promise<UploadedFileInfo>
  analyseAsync: (fileName: string) => Promise<AnalysedFile>
  importAsync: () => Promise<ImportResultPayload>

  uploadedFile: UploadedFileInfo | null
  analysedFile: AnalysedFile | null
  importResult: ImportResultPayload | null
  fields: ReadonlyArray<DocyrusFieldLike>
  isUploading: boolean
  isAnalysing: boolean
  isImporting: boolean
  error: Error | null
}

interface WizardState {
  open: boolean
  step: ImportWizardStep
  file: File | null
  uploadedFile: UploadedFileInfo | null
  analysedFile: AnalysedFile | null
  mapping: WizardMappingMap
  upsertUniqueFields: boolean
  importResult: ImportResultPayload | null
}

type WizardAction =
  | { type: 'open' }
  | { type: 'close' }
  | { type: 'reset' }
  | { type: 'setStep'; step: ImportWizardStep }
  | { type: 'pickFile'; file: File }
  | { type: 'setUploadedFile'; uploadedFile: UploadedFileInfo }
  | {
      type: 'setAnalysedFile'
      analysedFile: AnalysedFile
      mapping: WizardMappingMap
    }
  | { type: 'setMapping'; mapping: WizardMappingMap }
  | { type: 'setUpsert'; value: boolean }
  | { type: 'setImportResult'; result: ImportResultPayload }

const INITIAL_STATE: WizardState = {
  open: false,
  step: 'upload',
  file: null,
  uploadedFile: null,
  analysedFile: null,
  mapping: {},
  upsertUniqueFields: false,
  importResult: null,
}

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'open':
      return { ...state, open: true }

    case 'close':
      return { ...state, open: false }

    case 'reset':
      return { ...INITIAL_STATE, open: state.open }

    case 'setStep':
      return { ...state, step: action.step }

    case 'pickFile':
      return {
        ...state,
        file: action.file,
        uploadedFile: null,
        analysedFile: null,
        mapping: {},
        importResult: null,
      }

    case 'setUploadedFile':
      return { ...state, uploadedFile: action.uploadedFile }

    case 'setAnalysedFile':
      return {
        ...state,
        analysedFile: action.analysedFile,
        mapping: action.mapping,
        step: 'mapping',
      }

    case 'setMapping':
      return { ...state, mapping: action.mapping }

    case 'setUpsert':
      return { ...state, upsertUniqueFields: action.value }

    case 'setImportResult':
      return { ...state, importResult: action.result, step: 'result' }

    default:
      return state
  }
}

function defaultEndpoint(
  base: string,
  endpoints: ImportEndpoints | undefined,
  key: keyof ImportEndpoints,
  fallback: string,
): string {
  return endpoints?.[key] ?? `${base}${fallback}`
}

function unwrap<T>(response: unknown): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data
  }

  return response as T
}

const DEFAULT_ACCEPTED_EXTENSIONS: ReadonlyArray<string> = [
  'xlsx',
  'xls',
  'csv',
]
const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024

/**
 * One-call wiring of a Docyrus data source to the `<DataImportWizard>` —
 * upload → analyse → mapping → preview → import, all the way through to a
 * result summary. Returns a ready-to-render `wizard` element plus imperative
 * helpers for advanced flows.
 *
 * The hook only POSTs `FormData` to the upload endpoint — `RestApiClient`
 * auto-detects multipart bodies via `isFormData()`, so no extra headers are
 * needed.
 */
export function useDocyrusDataImportWizard(
  options: UseDocyrusDataImportWizardOptions,
): UseDocyrusDataImportWizardResult {
  const {
    client,
    appSlug,
    dataSourceSlug,
    appId,
    fields: providedFields,
    requiredFieldSlugs = [],
    uniqueFieldSlugs: providedUniqueFieldSlugs,
    endpoints,
    previewRowCount = 10,
    maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE,
    acceptedExtensions = DEFAULT_ACCEPTED_EXTENSIONS,
    initialMapping,
    enabled = true,
    open: controlledOpen,
    onOpenChange,
    onImported,
    onError,
    title,
    description,
  } = options

  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : state.open

  /*
   * Resolve target fields. If the caller passes them in we skip the data
   * source fetch entirely — saves a network round-trip and keeps the data
   * grid + import wizard sharing one source of truth.
   */
  const fieldFetchEnabled = enabled && !providedFields
  const dataViewSelect = useDocyrusDataViewSelect({
    client,
    appSlug,
    dataSourceSlug,
    appId,
    enabled: fieldFetchEnabled,
    persistActiveView: false,
  })

  const fields = useMemo<ReadonlyArray<DocyrusFieldLike>>(() => {
    if (providedFields) return providedFields

    const ds = dataViewSelect.dataSource as
      | { fields?: ReadonlyArray<DocyrusFieldLike> }
      | undefined

    return ds?.fields ?? []
  }, [providedFields, dataViewSelect.dataSource])

  const apiBase = useMemo(
    () => `/v1/apps/${appSlug}/data-sources/${dataSourceSlug}`,
    [appSlug, dataSourceSlug],
  )
  const uploadUrl = defaultEndpoint(
    apiBase,
    endpoints,
    'upload',
    '/import/upload',
  )
  const analyseUrl = defaultEndpoint(
    apiBase,
    endpoints,
    'analyse',
    '/import/details',
  )
  const importUrl = defaultEndpoint(apiBase, endpoints, 'import', '/import')

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData()

      body.append('file', file)

      const response = await client.post<unknown>(uploadUrl, body)

      return unwrap<UploadedFileInfo>(response)
    },
  })

  const analyseMutation = useMutation({
    mutationFn: async (fileName: string) => {
      const response = await client.get<unknown>(analyseUrl, { fileName })
      const payload = unwrap<{
        data?: ReadonlyArray<Record<string, unknown>>
        rows?: ReadonlyArray<Record<string, unknown>>
        fileName: string
        filePath?: string
        columns: ReadonlyArray<string>
        uniqueFieldIds?: ReadonlyArray<string>
        uniqueFieldSlugs?: ReadonlyArray<string>
        dataSourceRecord?: unknown
      }>(response)

      const rows = payload.rows ?? payload.data ?? []

      const analysed: AnalysedFile = {
        fileName: payload.fileName,
        filePath: payload.filePath,
        columns: payload.columns ?? [],
        rows,
        uniqueFieldIds: payload.uniqueFieldIds ?? [],
        uniqueFieldSlugs: payload.uniqueFieldSlugs ?? [],
        dataSourceRecord: payload.dataSourceRecord,
      }

      return analysed
    },
  })

  const importMutation = useMutation({
    mutationFn: async (body: {
      fileName: string
      options: ImportPayloadOptions
    }) => {
      const response = await client.post<unknown>(importUrl, body)

      return unwrap<ImportResultPayload>(response)
    },
  })

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        dispatch({ type: next ? 'open' : 'close' })
      }
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange],
  )

  const openWizard = useCallback(() => setOpen(true), [setOpen])
  const closeWizard = useCallback(() => setOpen(false), [setOpen])

  const resetWizard = useCallback(() => {
    dispatch({ type: 'reset' })
    uploadMutation.reset()
    analyseMutation.reset()
    importMutation.reset()
  }, [uploadMutation, analyseMutation, importMutation])

  const setStep = useCallback((next: ImportWizardStep) => {
    dispatch({ type: 'setStep', step: next })
  }, [])

  const handlePickFile = useCallback(
    (file: File) => {
      dispatch({ type: 'pickFile', file })

      uploadMutation.mutate(file, {
        onSuccess: (uploadedFile) => {
          dispatch({ type: 'setUploadedFile', uploadedFile })
          analyseMutation.mutate(uploadedFile.fileName, {
            onSuccess: (analysedFile) => {
              const mapping =
                initialMapping ?? buildAutoMapping(analysedFile.columns, fields)

              dispatch({ type: 'setAnalysedFile', analysedFile, mapping })
            },
            onError: (err) => {
              onError?.(err as Error, 'analyse')
            },
          })
        },
        onError: (err) => {
          onError?.(err as Error, 'upload')
        },
      })
    },
    [uploadMutation, analyseMutation, fields, initialMapping, onError],
  )

  const handleAnalyse = useCallback(() => {
    /*
     * If the upload already succeeded but analyse failed (or hasn't run),
     * just re-run analyse with the existing fileName — re-uploading would
     * waste a round-trip and produce a different server-side fileName.
     */
    if (state.uploadedFile && !state.analysedFile) {
      analyseMutation.mutate(state.uploadedFile.fileName, {
        onSuccess: (analysedFile) => {
          const mapping =
            initialMapping ?? buildAutoMapping(analysedFile.columns, fields)

          dispatch({ type: 'setAnalysedFile', analysedFile, mapping })
        },
        onError: (err) => {
          onError?.(err as Error, 'analyse')
        },
      })

      return
    }

    if (!state.file) return
    handlePickFile(state.file)
  }, [
    analyseMutation,
    fields,
    handlePickFile,
    initialMapping,
    onError,
    state.analysedFile,
    state.file,
    state.uploadedFile,
  ])

  const handleConfirmMapping = useCallback(() => {
    dispatch({ type: 'setStep', step: 'options' })
  }, [])

  const handleConfirmOptions = useCallback(() => {
    dispatch({ type: 'setStep', step: 'preview' })
  }, [])

  const handleStartImport = useCallback(() => {
    if (!state.analysedFile) return
    dispatch({ type: 'setStep', step: 'progress' })

    /*
     * Resolve uniqueData client-side for enum-like fields by walking the
     * field's `enums` / `options` array. Relation lookups are intentionally
     * left out of the payload entirely — sending uniqueData with null
     * `matchedId`s would short-circuit the server's relation lookup and
     * silently null out every relation value. Without uniqueData the server
     * runs its own `(field.slug, value)` cache lookup against the relation
     * data source, which is exactly what we want.
     */
    const enumLookups = collectUniqueDataLookups(
      state.mapping,
      fields,
      state.analysedFile,
    ).filter((spec) => isEnumLikeType(String(spec.field.type)))
    const resolvedById: Record<string, Record<string, string | null>> = {}

    for (const spec of enumLookups) {
      const resolved: Record<string, string | null> = {}
      const enumOptions: Array<Record<string, unknown>> = Array.isArray(
        spec.field.enums,
      )
        ? (spec.field.enums as Array<Record<string, unknown>>)
        : Array.isArray(spec.field.options)
          ? (spec.field.options as Array<Record<string, unknown>>)
          : []

      for (const value of spec.values) {
        const sluggedValue = slugify(value)
        const match = enumOptions.find((opt) => {
          const optSlug = typeof opt.slug === 'string' ? opt.slug : null
          const optName = typeof opt.name === 'string' ? opt.name : null

          return (
            (optSlug && optSlug === sluggedValue) ||
            (optName && optName === value) ||
            (optName && slugify(optName) === sluggedValue)
          )
        })

        resolved[value] =
          match && typeof match.id === 'string' ? match.id : null
      }
      resolvedById[spec.sourceColumn] = resolved
    }

    const uniqueData = buildUniqueDataPayload(enumLookups, resolvedById)
    const payload = buildImportOptions(
      state.mapping,
      fields,
      state.upsertUniqueFields,
      uniqueData,
    )

    importMutation.mutate(
      {
        fileName: state.analysedFile.fileName,
        options: payload,
      },
      {
        onSuccess: (result) => {
          dispatch({ type: 'setImportResult', result })
          onImported?.(result)
        },
        onError: (err) => {
          onError?.(err as Error, 'import')
        },
      },
    )
  }, [
    fields,
    importMutation,
    onImported,
    onError,
    state.analysedFile,
    state.mapping,
    state.upsertUniqueFields,
  ])

  const handleMappingChange = useCallback((next: WizardMappingMap) => {
    dispatch({ type: 'setMapping', mapping: next })
  }, [])

  const handleUpsertChange = useCallback((value: boolean) => {
    dispatch({ type: 'setUpsert', value })
  }, [])

  const requiredFieldSlugsKey = requiredFieldSlugs.join(',')
  const stableRequiredFieldSlugs = useMemo(
    () => requiredFieldSlugs,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requiredFieldSlugsKey],
  )

  const uniqueFieldSlugs = useMemo<ReadonlyArray<string>>(
    () =>
      providedUniqueFieldSlugs ?? state.analysedFile?.uniqueFieldSlugs ?? [],
    [providedUniqueFieldSlugs, state.analysedFile],
  )

  const error = useMemo<Error | null>(() => {
    return (
      (uploadMutation.error as Error | null) ??
      (analyseMutation.error as Error | null) ??
      (importMutation.error as Error | null)
    )
  }, [uploadMutation.error, analyseMutation.error, importMutation.error])

  const wasOpenRef = useRef(open)

  useEffect(() => {
    if (open && !wasOpenRef.current && state.step === 'result') {
      resetWizard()
    }
    wasOpenRef.current = open
  }, [open, state.step, resetWizard])

  /*
   * Re-run auto-mapping if the data source resolved AFTER the file was
   * analysed. Otherwise the user lands on an empty mapping step (the
   * initial `buildAutoMapping(columns, [])` ran with no fields).
   */
  useEffect(() => {
    if (!state.analysedFile || fields.length === 0) return
    const hasAnyMapped = Object.values(state.mapping).some(
      (entry) => entry.targetSlug,
    )

    if (hasAnyMapped) return

    const next =
      initialMapping ?? buildAutoMapping(state.analysedFile.columns, fields)

    if (Object.values(next).some((entry) => entry.targetSlug)) {
      dispatch({ type: 'setMapping', mapping: next })
    }
  }, [fields, state.analysedFile, state.mapping, initialMapping])

  const wizardElement = useMemo<ReactElement | null>(() => {
    if (!enabled) return null

    return (
      <DataImportWizard
        open={open}
        onOpenChange={setOpen}
        step={state.step}
        onStepChange={setStep}
        targetFields={fields}
        requiredFieldSlugs={stableRequiredFieldSlugs}
        uniqueFieldSlugs={uniqueFieldSlugs}
        file={state.file}
        uploadedFile={state.uploadedFile}
        analysedFile={state.analysedFile}
        importResult={state.importResult}
        isUploading={uploadMutation.isPending}
        isAnalysing={analyseMutation.isPending}
        isImporting={importMutation.isPending}
        uploadError={(uploadMutation.error as Error | null) ?? null}
        analyseError={(analyseMutation.error as Error | null) ?? null}
        importError={(importMutation.error as Error | null) ?? null}
        mapping={state.mapping}
        onMappingChange={handleMappingChange}
        upsertUniqueFields={state.upsertUniqueFields}
        onUpsertChange={handleUpsertChange}
        onPickFile={handlePickFile}
        onAnalyse={handleAnalyse}
        onConfirmMapping={handleConfirmMapping}
        onConfirmOptions={handleConfirmOptions}
        onStartImport={handleStartImport}
        onReset={resetWizard}
        onClose={closeWizard}
        title={title}
        description={description}
        previewRowCount={previewRowCount}
        maxFileSizeBytes={maxFileSizeBytes}
        acceptedExtensions={acceptedExtensions}
      />
    )
  }, [
    acceptedExtensions,
    analyseMutation.error,
    analyseMutation.isPending,
    closeWizard,
    description,
    enabled,
    fields,
    handleAnalyse,
    handleConfirmMapping,
    handleConfirmOptions,
    handleMappingChange,
    handlePickFile,
    handleStartImport,
    handleUpsertChange,
    importMutation.error,
    importMutation.isPending,
    maxFileSizeBytes,
    open,
    previewRowCount,
    resetWizard,
    setOpen,
    setStep,
    stableRequiredFieldSlugs,
    state.analysedFile,
    state.file,
    state.importResult,
    state.mapping,
    state.step,
    state.upsertUniqueFields,
    state.uploadedFile,
    title,
    uniqueFieldSlugs,
    uploadMutation.error,
    uploadMutation.isPending,
  ])

  /*
   * Imperative escape hatches — useful when the consumer wants to skip the
   * wizard UI altogether (e.g. drag-drop on a different surface).
   */
  const uploadAsync = useCallback(
    (file: File) => uploadMutation.mutateAsync(file),
    [uploadMutation],
  )
  const analyseAsync = useCallback(
    (fileName: string) => analyseMutation.mutateAsync(fileName),
    [analyseMutation],
  )
  const importAsync = useCallback(async () => {
    if (!state.analysedFile) {
      throw new Error('Cannot import — file has not been analysed yet.')
    }

    /*
     * Imperative mode: skip pre-resolution entirely. Sending an empty
     * `uniqueData` lets the server run its own enum / relation lookups and
     * avoids poisoning relation columns with null `matchedId`s.
     */
    const payload = buildImportOptions(
      state.mapping,
      fields,
      state.upsertUniqueFields,
    )

    return importMutation.mutateAsync({
      fileName: state.analysedFile.fileName,
      options: payload,
    })
  }, [
    importMutation,
    fields,
    state.analysedFile,
    state.mapping,
    state.upsertUniqueFields,
  ])

  return {
    open,
    openWizard,
    closeWizard,
    resetWizard,
    step: state.step,
    setStep,
    wizard: wizardElement,
    uploadAsync,
    analyseAsync,
    importAsync,
    uploadedFile: state.uploadedFile,
    analysedFile: state.analysedFile,
    importResult: state.importResult,
    fields,
    isUploading: uploadMutation.isPending,
    isAnalysing: analyseMutation.isPending,
    isImporting: importMutation.isPending,
    error,
  }
}
