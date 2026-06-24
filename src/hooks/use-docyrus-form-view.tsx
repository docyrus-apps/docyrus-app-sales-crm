'use client'

import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useMemo,
  useRef,
  useState
} from 'react'

import { type RestApiClient } from '@docyrus/api-client'

import type {
  DocyrusFormFieldProps,
  EnumOption,
  IField,
  IFieldType
} from '@/components/docyrus/form-fields/types'

import {
  createDataSourceClient,
  type DataSource,
  type DataSourceField
} from '@docyrus/app-utils'
import { useMutation, useQuery } from '@tanstack/react-query'

import {
  getCompanionFieldSlug,
  isReadOnlyField
} from '@/components/docyrus/form-fields/lib/utils'
import {
  EditableRecordDetail,
  EditableRecordDetailField
} from '@/components/docyrus/editable-record-detail'

import {
  type FieldChange,
  type RecordDetailField
} from '@/components/docyrus/editable-record-detail'

import type { DocyrusValueProps } from '@/components/docyrus/value-renderers/types'

import { FORM_FIELD_MAP } from '@/hooks/use-docyrus-field-component'

import { cn } from '@/lib/utils'
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/field'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/*
 * Lives in `library/hooks/_internal/` (a sub-directory the registry
 * scanner does not recurse into) so it gets bundled as a transitive
 * file under this hook without showing up as its own documented hook.
 * Imported via the `@ui/library/hooks/...` alias so the BFS resolver in
 * `scripts/lib/dependencies.ts` picks it up — relative imports inside
 * `library/hooks/` are not followed.
 */
import {
  DocyrusFormViewMappedFormField,
  DocyrusFormViewMappedValueField,
  MacroFormField
} from '@/hooks/_internal/use-docyrus-form-view-fields'

export interface DocyrusFormViewCollection<TItem extends object> {
  get?: (
    recordId: string,
    params?: Record<string, unknown>
  ) => Promise<TItem | { data: TItem }>;
  create?: (data: Record<string, unknown>) => Promise<unknown>;
  update?: (recordId: string, data: Record<string, unknown>) => Promise<unknown>;
}

export interface DocyrusFormViewGetParams {
  columns?: string | Array<string>;
  expand?: string | Array<string>;
  expandTypes?: Array<'user' | 'enum' | 'relation'>;
  [key: string]: unknown;
}

export type DocyrusFormViewMode = 'create' | 'edit' | 'view'

export type DocyrusFormViewRenderMode = 'form' | 'value'

export type DocyrusFormViewColSpan = 1 | 2 | 3 | 4 | 'full'

export interface DocyrusFormViewLayoutFieldItem {
  type: 'field';
  slug: string;
  colSpan?: DocyrusFormViewColSpan;
  className?: string;
}

interface DocyrusFormViewLayoutSectionBase {
  id: string;
  variant: 'fieldset' | 'tabpanel' | 'tab';
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  contentClassName?: string;
  colSpan?: DocyrusFormViewColSpan;
}

export interface DocyrusFormViewFieldsetSection extends DocyrusFormViewLayoutSectionBase {
  variant: 'fieldset';
  items: Array<DocyrusFormViewLayoutItem>;
}

export interface DocyrusFormViewTabSection extends DocyrusFormViewLayoutSectionBase {
  variant: 'tab';
  items: Array<DocyrusFormViewLayoutItem>;
}

export interface DocyrusFormViewTabPanelSection extends DocyrusFormViewLayoutSectionBase {
  variant: 'tabpanel';
  items: Array<DocyrusFormViewTabSection>;
  defaultTabId?: string;
}

export type DocyrusFormViewSection =
  | DocyrusFormViewFieldsetSection
  | DocyrusFormViewTabPanelSection
  | DocyrusFormViewTabSection

export type DocyrusFormViewLayoutItem =
  | string
  | DocyrusFormViewLayoutFieldItem
  | DocyrusFormViewSection

export interface DocyrusFormViewFieldLayout {
  hidden?: boolean | ((values: Record<string, unknown>) => boolean);
  required?: boolean | ((values: Record<string, unknown>) => boolean);
  readOnly?: boolean;
  disabled?: boolean;
  colSpan?: DocyrusFormViewColSpan;
  className?: string;
  label?: ReactNode;
  description?: ReactNode;
  fieldProps?: Partial<DocyrusFormFieldProps>;
  valueProps?: Partial<DocyrusValueProps>;
}

export interface DocyrusFormViewRenderFieldOptions {
  mode?: DocyrusFormViewMode;
  wrapperClassName?: string;
  className?: string;
  label?: ReactNode;
  description?: ReactNode;
}

export interface DocyrusFormViewRenderLayoutOptions {
  mode?: DocyrusFormViewMode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
  wrapperClassName?: string;
  fieldClassName?: string;
}

export interface UseDocyrusFormViewOptions<TItem extends object> {
  client: RestApiClient;
  appSlug: string;
  dataSourceSlug: string;
  itemId?: string;
  mode?: DocyrusFormViewMode;
  item?: Record<string, unknown> | null;
  collection?: DocyrusFormViewCollection<TItem>;
  enabled?: boolean;
  staleTime?: number;
  disabled?: boolean;
  defaultValues?: Record<string, unknown>;
  itemQueryParams?: DocyrusFormViewGetParams;
  fieldSlugs?: Array<string>;
  fieldOrder?: Array<string>;
  hiddenFieldSlugs?: Array<string>;
  fieldLayout?: Record<string, DocyrusFormViewFieldLayout>;
  layout?: Array<DocyrusFormViewLayoutItem>;
  mapField?: (field: DataSourceField, defaultMapped: IField) => IField | null;
  includeReadOnlyFields?: boolean;
  unsupportedFieldBehavior?: 'skip' | 'value';
  gridColumns?: 1 | 2 | 3 | 4;
  clickToEdit?: boolean;
  resolveUserOptions?: boolean;
  resolveRelationOptions?: boolean;
  optionLimit?: number;
  enumOptions?: Record<string, Array<EnumOption>>;
  transformSubmit?: (
    payload: Record<string, unknown>,
    context: {
      mode: DocyrusFormViewMode;
      itemId?: string;
      values: Record<string, unknown>;
      fields: Array<DocyrusFormViewField>;
      dataSource?: DataSource;
    }
  ) => Record<string, unknown>;
  onSubmit?: (
    payload: Record<string, unknown>,
    context: {
      mode: DocyrusFormViewMode;
      itemId?: string;
      values: Record<string, unknown>;
      fields: Array<DocyrusFormViewField>;
      dataSource?: DataSource;
    }
  ) => Promise<unknown> | unknown;
  onSubmitSuccess?: (result: unknown, payload: Record<string, unknown>) => void;
  onSubmitError?: (error: unknown, payload: Record<string, unknown>) => void;
}

export interface DocyrusFormViewField {
  slug: string;
  sourceField: DataSourceField;
  field: IField;
  enumOptions: Array<EnumOption>;
  value: unknown;
  required: boolean;
  hidden: boolean;
  readOnly: boolean;
  disabled: boolean;
  editable: boolean;
  renderMode: DocyrusFormViewRenderMode;
  colSpan?: DocyrusFormViewColSpan;
  className?: string;
  label?: ReactNode;
  description?: ReactNode;
  fieldProps?: Partial<DocyrusFormFieldProps>;
  valueProps?: Partial<DocyrusValueProps>;
  queryKeys: Array<string>;
  submitKeys: Array<string>;
}

export interface UseDocyrusFormViewResult {
  mode: DocyrusFormViewMode;
  dataSource: DataSource | undefined;
  item: Record<string, unknown>;
  form: {
    Field: ({
      name,
      children
    }: {
      name: string;
      children: (field: any) => ReactNode;
    }) => ReactNode;
  };
  values: Record<string, unknown>;
  defaultValues: Record<string, unknown>;
  columns: Array<string>;
  fields: Array<DocyrusFormViewField>;
  allFields: Array<DocyrusFormViewField>;
  unsupportedFields: Array<DocyrusFormViewField>;
  validationErrors: Map<string, string>;
  isDirty: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  error: Error | null;
  setValue: (slug: string, value: unknown) => void;
  reset: () => void;
  submit: () => Promise<unknown>;
  refetch: () => void;
  renderField: (
    slug: string,
    options?: DocyrusFormViewRenderFieldOptions
  ) => ReactNode;
  renderLayout: (options?: DocyrusFormViewRenderLayoutOptions) => ReactNode;
}

interface RemoteFieldOptionsResult {
  users: Array<EnumOption>;
  relations: Record<string, Array<EnumOption>>;
  enums: Record<string, Array<EnumOption>>;
}

interface ClickToEditFieldConfig {
  recordField: RecordDetailField;
  readOnly: boolean;
  disabled: boolean;
  submitKeys: Array<string>;
  label?: ReactNode;
  className?: string;
}

interface SortedClickToEditFieldConfig extends ClickToEditFieldConfig {
  sortOrder: number;
}

interface SubmitMutationContext {
  mode: DocyrusFormViewMode;
  itemId?: string;
  values: Record<string, unknown>;
  fields: Array<DocyrusFormViewField>;
  dataSource?: DataSource;
}

interface SubmitMutationInput {
  payload: Record<string, unknown>;
  context: SubmitMutationContext;
  forceUpdate?: boolean;
}

/*
 * Exported so the extracted field-renderer components in
 * `./use-docyrus-form-view-fields` can type their `form` prop without
 * needing access to the rest of `LocalFormState`.
 */
export interface LocalFormShape {
  Field: ({
    name,
    children
  }: {
    name: string;
    children: (field: any) => ReactNode;
  }) => ReactNode;
}

interface LocalFormState {
  form: LocalFormShape;
  valuesRef: RefObject<Record<string, unknown>>;
  baselineRef: RefObject<Record<string, unknown>>;
  validationErrors: Map<string, string>;
  valuesVersion: number;
  setValue: (slug: string, value: unknown) => void;
  reset: () => void;
  replaceValues: (
    nextValues: Record<string, unknown>,
    updateBaseline?: boolean
  ) => void;
  setValidationErrors: (errors: Map<string, string>) => void;
  commit: (nextBaseline?: Record<string, unknown>) => void;
}

function hasDocyrusFormFieldComponent(fieldType: IFieldType): boolean {
  return Boolean(FORM_FIELD_MAP[fieldType])
}

const TEXTUAL_FIELD_TYPES = new Set<IFieldType>([
  'field-text',
  'field-textarea',
  'field-email',
  'field-phone',
  'field-url',
  'field-color',
  'field-icon',
  'field-display',
  'field-htmlEditor',
  'field-emailEditor',
  'field-codeEditor',
  'field-formula',
  'field-relatedField',
  'field-enum',
  'field-code',
  'field-number',
  'field-money',
  'field-percent',
  'field-duration',
  'field-rating',
  'field-select',
  'field-radioGroup',
  'field-status',
  'field-json',
  'field-docEditor',
  'field-systemEnum'
])

const ENUM_OPTION_FIELD_TYPES = new Set<IFieldType>([
  'field-select',
  'field-radioGroup',
  'field-enum',
  'field-systemEnum',
  'field-status',
  'field-multiSelect',
  'field-tagSelect'
])

const LABEL_FIELD_CANDIDATES = [
  'name',
  'title',
  'display_name',
  'displayName',
  'full_name',
  'fullName',
  'subject',
  'code',
  'email',
  'label',
  'slug'
] as const

function useLocalDocyrusForm(
  initialValues: Record<string, unknown>
): LocalFormState {
  const valuesRef = useRef<Record<string, unknown>>({ ...initialValues })
  const baselineRef = useRef<Record<string, unknown>>({ ...initialValues })
  const validationErrorsRef = useRef<Map<string, string>>(new Map())
  const resetSignalRef = useRef(0)
  const [valuesVersion, setValuesVersion] = useState(0)
  const initialValuesKey = useMemo(
    () => stableStringify(initialValues),
    [initialValues]
  )

  const onFieldChangeRef = useRef((slug: string, value: unknown) => {
    valuesRef.current[slug] = value
    if (validationErrorsRef.current.has(slug)) {
      const next = new Map(validationErrorsRef.current)

      next.delete(slug)
      validationErrorsRef.current = next
    }
    setValuesVersion(version => version + 1)
  })

  /*
   * `form.Field` is a stable wrapper around MacroFormField that threads the
   * hook's refs/state version into each rendered field. We freeze it via
   * useState so the component identity is stable across renders (preventing
   * re-mounts of every field cell on every keystroke). The
   * @eslint-react/component-hook-factories rule normally forbids defining
   * components inside other functions for that exact reason — but here the
   * stability comes from useState itself, and Field is part of the hook's
   * public surface (`<form.Field name="...">{(field) => ...}</form.Field>`).
   */
  const [form] = useState(() => ({
    Field: ({
      name,
      children
    }: {
      name: string;
      children: (field: any) => ReactNode;
    }) => (
      <MacroFormField
        slug={name}
        valuesRef={valuesRef}
        resetSignal={resetSignalRef.current}
        onFieldChange={onFieldChangeRef}
        validationErrors={validationErrorsRef}
        valuesVersion={valuesVersion}>
        {children}
      </MacroFormField>
    )
  }))

  const replaceValues = useCallback(
    (nextValues: Record<string, unknown>, updateBaseline = false) => {
      valuesRef.current = { ...nextValues }
      if (updateBaseline) {
        baselineRef.current = { ...nextValues }
      }
      validationErrorsRef.current = new Map()
      resetSignalRef.current += 1
      setValuesVersion(version => version + 1)
    },
    []
  )

  /*
   * Re-seed values + baseline whenever the parent passes a new identity
   * for `initialValues` (compared by `stableStringify`-keyed identity).
   * Store-and-compare so the inner setState bump doesn't trip
   * `set-state-in-effect`.
   */
  const [trackedInitialValuesKey, setTrackedInitialValuesKey] =
    useState(initialValuesKey)

  if (trackedInitialValuesKey !== initialValuesKey) {
    setTrackedInitialValuesKey(initialValuesKey)
    replaceValues(initialValues, true)
  }

  const setValue = useCallback((slug: string, value: unknown) => {
    valuesRef.current[slug] = value
    if (validationErrorsRef.current.has(slug)) {
      const next = new Map(validationErrorsRef.current)

      next.delete(slug)
      validationErrorsRef.current = next
    }
    setValuesVersion(version => version + 1)
  }, [])

  const setValidationErrors = useCallback((errors: Map<string, string>) => {
    validationErrorsRef.current = new Map(errors)
    setValuesVersion(version => version + 1)
  }, [])

  const reset = useCallback(() => {
    replaceValues(baselineRef.current, false)
  }, [replaceValues])

  const commit = useCallback((nextBaseline?: Record<string, unknown>) => {
    baselineRef.current = { ...(nextBaseline ?? valuesRef.current) }
    validationErrorsRef.current = new Map()
    setValuesVersion(version => version + 1)
  }, [])

  return {
    form,
    valuesRef,
    baselineRef,
    validationErrors: validationErrorsRef.current,
    valuesVersion,
    setValue,
    reset,
    replaceValues,
    setValidationErrors,
    commit
  }
}

export function useDocyrusFormView<
  TItem extends object = Record<string, unknown>,
>(options: UseDocyrusFormViewOptions<TItem>): UseDocyrusFormViewResult {
  const {
    client,
    appSlug,
    dataSourceSlug,
    itemId,
    mode: providedMode,
    item: providedItem,
    collection,
    enabled = true,
    staleTime = 30_000,
    disabled = false,
    defaultValues: providedDefaultValues,
    itemQueryParams,
    fieldSlugs,
    fieldOrder,
    hiddenFieldSlugs,
    fieldLayout,
    layout,
    mapField,
    includeReadOnlyFields: includeReadOnlyFieldsOption,
    unsupportedFieldBehavior: unsupportedFieldBehaviorOption,
    gridColumns = 2,
    clickToEdit = false,
    resolveUserOptions = true,
    resolveRelationOptions = true,
    optionLimit = 100,
    enumOptions: enumOptionsOverrides,
    transformSubmit,
    onSubmit,
    onSubmitSuccess,
    onSubmitError
  } = options

  const mode: DocyrusFormViewMode = providedMode ?? (itemId ? 'edit' : 'create')
  const includeReadOnlyFields = includeReadOnlyFieldsOption ?? mode !== 'create'
  const unsupportedFieldBehavior =
    unsupportedFieldBehaviorOption ?? (mode === 'create' ? 'skip' : 'value')

  const dataSourcesClient = useMemo(
    () => createDataSourceClient(client),
    [client]
  )

  const dataSourceQuery = useQuery({
    queryKey: [
'docyrus',
'formView',
'dataSource',
appSlug,
dataSourceSlug
],
    queryFn: () => dataSourcesClient.getBySlug(appSlug, dataSourceSlug, { expand: 'enums' }),
    enabled: enabled && Boolean(appSlug) && Boolean(dataSourceSlug),
    staleTime
  })

  const mappedFields = useMemo<
    Array<{ sourceField: DataSourceField; field: IField }>
  >(() => {
    const sourceFields = dataSourceQuery.data?.fields ?? []

    return sourceFields
      .map((sourceField) => {
        const base = dataSourceFieldToIField(sourceField)
        const mapped = mapField ? mapField(sourceField, base) : base

        if (!mapped) return null
        if (fieldSlugs && !fieldSlugs.includes(mapped.slug)) return null

        return { sourceField, field: mapped }
      })
      .filter(
        (entry): entry is { sourceField: DataSourceField; field: IField } => entry !== null
      )
  }, [dataSourceQuery.data?.fields, fieldSlugs, mapField])

  const baseColumns = useMemo(
    () => buildFieldQueryColumns(mappedFields.map(entry => entry.field)),
    [mappedFields]
  )
  const columns = useMemo(() => {
    const extraColumns = normalizeColumnsInput(itemQueryParams?.columns)

    return uniqueStrings([...baseColumns, ...extraColumns])
  }, [baseColumns, itemQueryParams?.columns])

  const itemQuery = useQuery<Record<string, unknown>>({
    queryKey: [
      'docyrus',
      'formView',
      'item',
      appSlug,
      dataSourceSlug,
      itemId,
      columns,
      itemQueryParams
    ],
    queryFn: async () => {
      if (!itemId) return {}
      if (collection?.get) {
        return unwrapRecord(
          await collection.get(itemId, {
            columns,
            ...itemQueryParams
          })
        )
      }

      const response = await client.get<
        Record<string, unknown> | { data: Record<string, unknown> }
      >(`/v1/apps/${appSlug}/data-sources/${dataSourceSlug}/items/${itemId}`, {
        ...(itemQueryParams ?? {}),
        columns: columns.join(', ')
      })

      return unwrapRecord(response)
    },
    enabled:
      enabled &&
      mode !== 'create' &&
      !providedItem &&
      Boolean(itemId) &&
      columns.length > 0,
    staleTime
  })

  const relationFields = useMemo(
    () => mappedFields.filter(
        ({ field }) => field.type === 'field-relation' &&
          !enumOptionsOverrides?.[field.slug]
      ),
    [mappedFields, enumOptionsOverrides]
  )

  const userFields = useMemo(
    () => mappedFields.filter(
        ({ field }) => (field.type === 'field-userSelect' ||
          field.type === 'field-userMultiSelect') &&
          !enumOptionsOverrides?.[field.slug]
      ),
    [mappedFields, enumOptionsOverrides]
  )

  const enumFields = useMemo(
    () => mappedFields.filter(({ field }) => {
        if (!ENUM_OPTION_FIELD_TYPES.has(field.type)) {
          return false
        }

        if (enumOptionsOverrides?.[field.slug]) {
          return false
        }

        return extractStaticEnumOptions(field).length === 0
      }),
    [mappedFields, enumOptionsOverrides]
  )

  const remoteFieldOptionsQuery = useQuery<RemoteFieldOptionsResult>({
    queryKey: [
      'docyrus',
      'formView',
      'remoteOptions',
      appSlug,
      dataSourceSlug,
      mappedFields.map(entry => ({
        slug: entry.field.slug,
        type: entry.field.type,
        relationDataSourceId: entry.field.relationDataSourceId ?? null
      })),
      optionLimit,
      resolveUserOptions,
      resolveRelationOptions,
      enumFields.map(({ field }) => field.slug)
    ],
    queryFn: async () => {
      const result: RemoteFieldOptionsResult = {
        users: [],
        relations: {},
        enums: {}
      }

      const [usersResponse, dataSourcesResponse, enumsResponse] =
        await Promise.all([
          resolveUserOptions && userFields.length > 0
            ? client.get<{ data: Array<Record<string, unknown>> }>('/v1/users')
            : Promise.resolve(null),
          resolveRelationOptions && relationFields.length > 0
            ? client.get<{ data: Array<Record<string, unknown>> }>(
                '/v1/apps/data-sources',
                {
                  expand: 'fields'
                }
              )
            : Promise.resolve(null),
          enumFields.length > 0
            ? client.get<{ data: Record<string, unknown> }>('/v1/apps/enums')
            : Promise.resolve(null)
        ])

      if (usersResponse) {
        result.users = unwrapArray(usersResponse)
          .map(userRecordToEnumOption)
          .filter((option): option is EnumOption => option !== null)
      }

      if (dataSourcesResponse) {
        const allDataSources = unwrapArray(dataSourcesResponse)

        await Promise.all(
          relationFields.map(async ({ field }) => {
            const { relationDataSourceId } = field

            if (!relationDataSourceId) return

            const target = allDataSources.find((dataSource) => {
              const raw = toRecord(dataSource)

              return pickString(raw, 'id') === relationDataSourceId
            })

            if (!target) return

            const targetRecord = toRecord(target)
            const targetAppSlug = pickString(
              targetRecord,
              'appSlug',
              'app_slug'
            )
            const targetSlug = pickString(targetRecord, 'slug')

            if (!targetAppSlug || !targetSlug) return

            const targetFields = Array.isArray(targetRecord.fields)
              ? (targetRecord.fields as Array<DataSourceField>)
              : []

            const optionColumns = buildRelationOptionColumns(
              field,
              targetFields
            )

            const relationItemsResponse = await client.get<
              | Array<Record<string, unknown>>
              | { data: Array<Record<string, unknown>> }
            >(`/v1/apps/${targetAppSlug}/data-sources/${targetSlug}/items`, {
              columns: optionColumns.join(', '),
              limit: optionLimit
            })

            const items = unwrapArray(relationItemsResponse)

            result.relations[field.slug] = items
              .map(record => relationRecordToEnumOption(record, field, targetFields))
              .filter((option): option is EnumOption => option !== null)
          })
        )
      }

      if (enumsResponse) {
        const enumAppTree = toRecord(toRecord(enumsResponse).data)[appSlug]
        const enumDataSourceTree = toRecord(
          toRecord(enumAppTree)[dataSourceSlug]
        )

        for (const { field } of enumFields) {
          const rawFieldEnums = enumDataSourceTree[field.slug]
          const fieldEnums = Array.isArray(rawFieldEnums) ? rawFieldEnums : []

          result.enums[field.slug] = fieldEnums
            .map(item => normalizeEnumOption(item))
            .filter((option): option is EnumOption => option !== null)
        }
      }

      return result
    },
    enabled:
      enabled &&
      mappedFields.length > 0 &&
      ((resolveUserOptions && userFields.length > 0) ||
        (resolveRelationOptions && relationFields.length > 0) ||
        enumFields.length > 0),
    staleTime
  })

  const rawItem = useMemo(
    () => providedItem ?? itemQuery.data ?? {},
    [providedItem, itemQuery.data]
  )

  const mergedDefaultValues = useMemo(
    () => buildInitialValues(
        mappedFields.map(entry => entry.field),
        rawItem,
        providedDefaultValues
      ),
    [mappedFields, rawItem, providedDefaultValues]
  )
  const localForm = useLocalDocyrusForm(mergedDefaultValues)

  const values = useMemo(() => {
    void localForm.valuesVersion

    return { ...localForm.valuesRef.current }
  }, [localForm.valuesRef, localForm.valuesVersion])

  const resolvedFields = useMemo<Array<DocyrusFormViewField>>(() => {
    const orderLookup = new Map(
      (fieldOrder ?? []).map((slug, index) => [slug, index])
    )
    const hiddenSlugSet = new Set(hiddenFieldSlugs ?? [])

    const entries = mappedFields.map(({ sourceField, field }) => {
      const layout = fieldLayout?.[field.slug]
      const enumOptions = resolveEnumOptions(
        field,
        remoteFieldOptionsQuery.data,
        enumOptionsOverrides
      )
      const required =
        resolveBooleanOrResolver(layout?.required, values) ??
        isFieldRequired(field)
      const hidden =
        hiddenSlugSet.has(field.slug) ||
        (resolveBooleanOrResolver(layout?.hidden, values) ?? false)
      const readOnly =
        mode === 'view' ||
        layout?.readOnly === true ||
        field.readOnly === true ||
        isReadOnlyField(field.type)
      const supported = hasDocyrusFormFieldComponent(field.type)
      const editable = supported && !readOnly
      const shouldShowValue = readOnly || unsupportedFieldBehavior === 'value'
      const renderMode: DocyrusFormViewRenderMode = editable ? 'form' : 'value'
      const queryKeys = getFieldQueryKeys(field)
      const submitKeys = getFieldSubmitKeys(field)

      return {
        slug: field.slug,
        sourceField,
        field,
        enumOptions,
        value: values[field.slug],
        required,
        hidden,
        readOnly,
        disabled: disabled || layout?.disabled === true,
        editable,
        renderMode,
        colSpan: layout?.colSpan,
        className: layout?.className,
        label: layout?.label,
        description: layout?.description,
        fieldProps: layout?.fieldProps,
        valueProps: layout?.valueProps,
        queryKeys,
        submitKeys,
        supported,
        shouldShowValue,
        sortOrder: orderLookup.get(field.slug) ?? Number.MAX_SAFE_INTEGER
      }
    })

    entries.sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder
      }

      return left.field.name.localeCompare(right.field.name)
    })

    return entries
      .filter((entry) => {
        if (entry.hidden) return false
        if (entry.editable) return true
        if (entry.readOnly && includeReadOnlyFields) return true

        return entry.shouldShowValue
      })
      .map(
        ({
          supported: _supported,
          shouldShowValue: _shouldShowValue,
          sortOrder: _sortOrder,
          ...field
        }) => ({
          ...field,
          renderMode: field.editable ? 'form' : 'value'
        })
      )
  }, [
    mappedFields,
    fieldOrder,
    hiddenFieldSlugs,
    fieldLayout,
    remoteFieldOptionsQuery.data,
    enumOptionsOverrides,
    values,
    mode,
    disabled,
    includeReadOnlyFields,
    unsupportedFieldBehavior
  ])

  const clickToEditFieldConfigs = useMemo<Array<ClickToEditFieldConfig>>(() => {
    if (!clickToEdit || mode !== 'view') {
      return []
    }

    const orderLookup = new Map(
      (fieldOrder ?? []).map((slug, index) => [slug, index])
    )
    const hiddenSlugSet = new Set(hiddenFieldSlugs ?? [])

    return mappedFields
      .map(({ field }) => {
        if (hiddenSlugSet.has(field.slug)) {
          return null
        }

        const layout = fieldLayout?.[field.slug]

        if (layout?.hidden === true) {
          return null
        }

        const supported = hasDocyrusFormFieldComponent(field.type)
        const readOnly =
          layout?.readOnly === true ||
          field.readOnly === true ||
          isReadOnlyField(field.type) ||
          !supported
        const recordField: RecordDetailField = {
          field,
          enumOptions: resolveEnumOptions(
            field,
            remoteFieldOptionsQuery.data,
            enumOptionsOverrides
          ),
          readOnly,
          required: layout?.required ?? isFieldRequired(field),
          hidden:
            typeof layout?.hidden === 'function' ? layout.hidden : undefined,
          appSlug,
          dataSourceSlug
        }

        const config: SortedClickToEditFieldConfig = {
          recordField,
          readOnly,
          disabled: disabled || layout?.disabled === true,
          submitKeys: getFieldSubmitKeys(field),
          label: layout?.label,
          className: layout?.className,
          sortOrder: orderLookup.get(field.slug) ?? Number.MAX_SAFE_INTEGER
        }

        return config
      })
      .filter((entry): entry is SortedClickToEditFieldConfig => entry !== null)
      .sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder
        }

        return left.recordField.field.name.localeCompare(
          right.recordField.field.name
        )
      })
      .map(({ sortOrder: _sortOrder, ...entry }) => entry)
  }, [
    appSlug,
    clickToEdit,
    dataSourceSlug,
    disabled,
    enumOptionsOverrides,
    fieldLayout,
    fieldOrder,
    hiddenFieldSlugs,
    mappedFields,
    mode,
    remoteFieldOptionsQuery.data
  ])

  const resolvedFieldMap = useMemo(
    () => new Map(resolvedFields.map(field => [field.slug, field])),
    [resolvedFields]
  )

  const clickToEditFieldConfigMap = useMemo(
    () => new Map(
        clickToEditFieldConfigs.map(config => [config.recordField.field.slug, config])
      ),
    [clickToEditFieldConfigs]
  )

  const resolvedLayoutItems = useMemo<Array<DocyrusFormViewLayoutItem>>(() => {
    if (!layout?.length) {
      return []
    }

    const visibleFieldSlugs = new Set(resolvedFields.map(field => field.slug))
    const normalizedItems = normalizeDocyrusFormViewLayoutItems(
      layout,
      visibleFieldSlugs
    )
    const assignedFieldSlugs = new Set(
      collectDocyrusFormViewLayoutFieldSlugs(normalizedItems)
    )
    const unassignedFields = resolvedFields
      .map(field => field.slug)
      .filter(slug => !assignedFieldSlugs.has(slug))

    return [...normalizedItems, ...unassignedFields]
  }, [layout, resolvedFields])

  const unsupportedFields = useMemo(
    () => resolvedFields.filter(
        field => !field.editable &&
          field.renderMode === 'value' &&
          !hasDocyrusFormFieldComponent(field.field.type)
      ),
    [resolvedFields]
  )

  const isDirty = useMemo(
    () => !valuesMatch(values, localForm.baselineRef.current),
    [localForm.baselineRef, values]
  )

  const validate = useCallback(() => {
    if (mode === 'view') {
      localForm.setValidationErrors(new Map())

      return true
    }

    const errors = new Map<string, string>()

    for (const field of resolvedFields) {
      if (field.renderMode !== 'form') continue
      if (field.readOnly || field.disabled) continue
      if (!field.required) continue

      const fieldValue = localForm.valuesRef.current[field.slug]

      if (isEmptyValue(fieldValue)) {
        errors.set(field.slug, `${field.field.name} is required`)
      }
    }

    localForm.setValidationErrors(errors)

    return errors.size === 0
  }, [localForm, mode, resolvedFields])

  const submitContext = useMemo<SubmitMutationContext>(
    () => ({
      mode,
      itemId,
      values,
      fields: resolvedFields,
      dataSource: dataSourceQuery.data
    }),
    [
mode,
itemId,
values,
resolvedFields,
dataSourceQuery.data
]
  )

  const submitMutation = useMutation({
    mutationFn: async ({
      payload,
      context,
      forceUpdate = false
    }: SubmitMutationInput) => {
      if (onSubmit) {
        return onSubmit(payload, context)
      }

      if (context.mode === 'create' && !forceUpdate) {
        if (collection?.create) {
          return collection.create(payload)
        }

        return client.post(
          `/v1/apps/${appSlug}/data-sources/${dataSourceSlug}/items`,
          payload
        )
      }

      if ((context.mode === 'edit' || forceUpdate) && context.itemId) {
        if (collection?.update) {
          return collection.update(context.itemId, payload)
        }

        return client.patch(
          `/v1/apps/${appSlug}/data-sources/${dataSourceSlug}/items/${context.itemId}`,
          payload
        )
      }

      return payload
    }
  })

  const executeSubmit = useCallback(
    async ({
      valuesSnapshot,
      payloadFields,
      context,
      forceUpdate = false
    }: {
      valuesSnapshot: Record<string, unknown>;
      payloadFields: Array<
        Pick<DocyrusFormViewField, 'readOnly' | 'disabled' | 'submitKeys'>
      >;
      context: SubmitMutationContext;
      forceUpdate?: boolean;
    }) => {
      const basePayload = buildSubmitPayload(payloadFields, valuesSnapshot)
      const payload = transformSubmit
        ? transformSubmit(basePayload, context)
        : basePayload

      try {
        const result = await submitMutation.mutateAsync({
          payload,
          context,
          forceUpdate
        })

        if (forceUpdate) {
          localForm.replaceValues(valuesSnapshot, true)
        } else {
          localForm.commit(valuesSnapshot)
        }
        onSubmitSuccess?.(result, payload)

        if (
          (context.mode === 'edit' || forceUpdate) &&
          !providedItem &&
          context.itemId
        ) {
          void itemQuery.refetch()
        }

        return result
      } catch (error) {
        onSubmitError?.(error, payload)
        throw error
      }
    },
    [
      itemQuery,
      localForm,
      onSubmitError,
      onSubmitSuccess,
      providedItem,
      submitMutation,
      transformSubmit
    ]
  )

  const submit = useCallback(async () => {
    if (mode === 'view') {
      return { ...localForm.valuesRef.current }
    }

    if (!validate()) {
      const error = new Error('Form validation failed')

      onSubmitError?.(error, {})
      throw error
    }

    return executeSubmit({
      valuesSnapshot: { ...localForm.valuesRef.current },
      payloadFields: resolvedFields,
      context: submitContext
    })
  }, [
    executeSubmit,
    localForm,
    mode,
    onSubmitError,
    resolvedFields,
    submitContext,
    validate
  ])

  const handleClickToEditSave = useCallback(
    async (
      changes: Array<FieldChange>,
      nextValues: Record<string, unknown>
    ) => {
      if (changes.length === 0) {
        return
      }

      const clickToEditContext: SubmitMutationContext = {
        mode,
        itemId,
        values: nextValues,
        fields: resolvedFields,
        dataSource: dataSourceQuery.data
      }

      await executeSubmit({
        valuesSnapshot: nextValues,
        payloadFields: clickToEditFieldConfigs,
        context: clickToEditContext,
        forceUpdate: true
      })
    },
    [
      clickToEditFieldConfigs,
      dataSourceQuery.data,
      executeSubmit,
      itemId,
      mode,
      resolvedFields
    ]
  )

  const renderField = useCallback(
    (slug: string, renderOptions?: DocyrusFormViewRenderFieldOptions) => {
      const resolved = resolvedFieldMap.get(slug)

      if (!resolved) return null

      const renderMode: DocyrusFormViewRenderMode =
        (renderOptions?.mode ?? mode) === 'view' ? 'value' : resolved.renderMode

      if (renderMode === 'form') {
        return (
          <DocyrusFormViewMappedFormField
            resolvedField={resolved}
            form={localForm.form}
            appSlug={appSlug}
            dataSourceSlug={dataSourceSlug}
            className={renderOptions?.className} />
        )
      }

      return (
        <DocyrusFormViewMappedValueField
          resolvedField={resolved}
          values={localForm.valuesRef.current}
          wrapperClassName={renderOptions?.wrapperClassName}
          className={renderOptions?.className}
          label={renderOptions?.label}
          description={renderOptions?.description} />
      )
    },
    [
      appSlug,
      dataSourceSlug,
      localForm.form,
      localForm.valuesRef,
      mode,
      resolvedFieldMap
    ]
  )

  const renderLayout = useCallback(
    (renderOptions?: DocyrusFormViewRenderLayoutOptions) => {
      const columnCount = renderOptions?.columns ?? gridColumns
      const layoutMode = renderOptions?.mode ?? mode
      const shouldUseClickToEdit =
        clickToEdit &&
        layoutMode === 'view' &&
        clickToEditFieldConfigs.length > 0
      const rootItems =
        resolvedLayoutItems.length > 0
          ? resolvedLayoutItems
          : resolvedFields.map(field => field.slug)

      function renderLayoutItems(
        items: Array<DocyrusFormViewLayoutItem>,
        path: string
      ): Array<ReactNode> {
        return items.map((item, index) => {
          const itemKey = `${path}-${index}`

          if (typeof item === 'string') {
            return renderFieldGridItem(item, undefined, itemKey)
          }

          if (isDocyrusFormViewLayoutFieldItem(item)) {
            return renderFieldGridItem(item.slug, item, itemKey)
          }

          return renderSection(item, itemKey)
        })
      }

      function renderFieldGridItem(
        slug: string,
        layoutItem: DocyrusFormViewLayoutFieldItem | undefined,
        key: string
      ): ReactNode {
        const resolved = resolvedFieldMap.get(slug)

        if (!resolved) {
          return null
        }

        const fieldNode = shouldUseClickToEdit
          ? (() => {
              const config = clickToEditFieldConfigMap.get(slug)

              if (!config) {
                return null
              }

              return (
                <EditableRecordDetailField
                  slug={slug}
                  label={config.label}
                  className={cn(
                    config.className,
                    renderOptions?.fieldClassName
                  )} />
              )
            })()
          : renderField(slug, {
              mode: layoutMode,
              wrapperClassName: renderOptions?.fieldClassName
            })

        if (!fieldNode) {
          return null
        }

        return (
          <div
            key={key}
            className={cn(
              renderOptions?.wrapperClassName,
              layoutItem?.className
            )}
            style={getGridSpanStyle(layoutItem?.colSpan ?? resolved.colSpan)}>
            {fieldNode}
          </div>
        )
      }

      function renderSectionHeader(
        title?: ReactNode,
        description?: ReactNode
      ): ReactNode {
        if (!title && !description) {
          return null
        }

        return (
          <div className="space-y-1">
            {title && (
              <div className="text-sm font-semibold text-foreground">
                {title}
              </div>
            )}
            {description && (
              <FieldDescription className="m-0">{description}</FieldDescription>
            )}
          </div>
        )
      }

      function renderSectionGrid(
        items: Array<DocyrusFormViewLayoutItem>,
        path: string,
        className?: string
      ): ReactNode {
        return (
          <div className={cn(getGridColumnsClassName(columnCount), className)}>
            {renderLayoutItems(items, path)}
          </div>
        )
      }

      function renderSection(
        section: DocyrusFormViewSection,
        key: string
      ): ReactNode {
        if (section.variant === 'fieldset') {
          return (
            <div
              key={key}
              className={cn(renderOptions?.wrapperClassName)}
              style={getGridSpanStyle(section.colSpan)}>
              <FieldSet
                className={cn(
                  'rounded-xl border border-border/60 p-4 md:p-5',
                  section.className
                )}>
                {section.title && <FieldLegend>{section.title}</FieldLegend>}
                {section.description && (
                  <FieldDescription>{section.description}</FieldDescription>
                )}
                {renderSectionGrid(
                  section.items,
                  `${key}-fieldset`,
                  section.contentClassName
                )}
              </FieldSet>
            </div>
          )
        }

        if (section.variant === 'tabpanel') {
          const tabs = section.items.filter(tab => tab.variant === 'tab')

          if (tabs.length === 0) {
            return null
          }

          const defaultTab =
            tabs.find(tab => tab.id === section.defaultTabId) ?? tabs[0]

          if (!defaultTab) {
            return null
          }

          const defaultTabValue = getDocyrusFormViewTabValue(defaultTab)

          return (
            <div
              key={key}
              className={cn(renderOptions?.wrapperClassName)}
              style={getGridSpanStyle(section.colSpan)}>
              <div
                className={cn(
                  'space-y-4 rounded-xl border border-border/60 p-4 md:p-5',
                  section.className
                )}>
                {renderSectionHeader(section.title, section.description)}
                <Tabs defaultValue={defaultTabValue} className="gap-4">
                  <TabsList
                    variant="line"
                    className="h-auto w-full justify-start overflow-x-auto rounded-none p-0">
                    {tabs.map((tab) => {
                      const tabValue = getDocyrusFormViewTabValue(tab)

                      return (
                        <TabsTrigger
                          key={tabValue}
                          value={tabValue}
                          className="flex-none px-3 py-2">
                          {tab.title ?? tab.id}
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                  {tabs.map((tab) => {
                    const tabValue = getDocyrusFormViewTabValue(tab)

                    return (
                      <TabsContent
                        key={tabValue}
                        value={tabValue}
                        className={cn('space-y-4', tab.className)}>
                        {renderSectionHeader(undefined, tab.description)}
                        {renderSectionGrid(
                          tab.items,
                          `${key}-${tabValue}`,
                          tab.contentClassName
                        )}
                      </TabsContent>
                    )
                  })}
                </Tabs>
              </div>
            </div>
          )
        }

        return (
          <div
            key={key}
            className={cn(renderOptions?.wrapperClassName)}
            style={getGridSpanStyle(section.colSpan)}>
            <div
              className={cn(
                'space-y-4 rounded-xl border border-border/60 p-4 md:p-5',
                section.className
              )}>
              {renderSectionHeader(section.title, section.description)}
              {renderSectionGrid(
                section.items,
                `${key}-tab`,
                section.contentClassName
              )}
            </div>
          </div>
        )
      }

      let structuredLayout: ReactNode = null

      if (resolvedLayoutItems.length > 0) {
        structuredLayout = renderSectionGrid(
          rootItems,
          'layout-root',
          shouldUseClickToEdit ? undefined : renderOptions?.className
        )
      }

      if (shouldUseClickToEdit) {
        return (
          <EditableRecordDetail
            fields={clickToEditFieldConfigs.map(config => config.recordField)}
            record={values}
            onSave={handleClickToEditSave}
            disabled={disabled}
            className={cn(
              renderOptions?.className,
              renderOptions?.wrapperClassName
            )}>
            {structuredLayout ??
              clickToEditFieldConfigs.map(config => (
                <EditableRecordDetailField
                  key={config.recordField.field.slug}
                  slug={config.recordField.field.slug}
                  label={config.label}
                  className={cn(
                    config.className,
                    renderOptions?.fieldClassName
                  )} />
              ))}
          </EditableRecordDetail>
        )
      }

      if (structuredLayout) {
        return structuredLayout
      }

      return (
        <div
          className={cn(
            getGridColumnsClassName(columnCount),
            renderOptions?.className
          )}>
          {resolvedFields.map(field => (
            <div
              key={field.slug}
              className={cn(renderOptions?.wrapperClassName)}
              style={getGridSpanStyle(field.colSpan)}>
              {renderField(field.slug, {
                mode: layoutMode,
                wrapperClassName: renderOptions?.fieldClassName
              })}
            </div>
          ))}
        </div>
      )
    },
    [
      clickToEdit,
      clickToEditFieldConfigMap,
      clickToEditFieldConfigs,
      disabled,
      gridColumns,
      handleClickToEditSave,
      mode,
      renderField,
      resolvedFieldMap,
      resolvedFields,
      resolvedLayoutItems,
      values
    ]
  )

  const refetch = useCallback(() => {
    void dataSourceQuery.refetch()
    if (itemId && !providedItem) {
      void itemQuery.refetch()
    }
    if (remoteFieldOptionsQuery.isEnabled) {
      void remoteFieldOptionsQuery.refetch()
    }
  }, [
    dataSourceQuery,
    itemId,
    itemQuery,
    providedItem,
    remoteFieldOptionsQuery
  ])

  const error =
    dataSourceQuery.error ?? itemQuery.error ?? remoteFieldOptionsQuery.error

  return {
    mode,
    dataSource: dataSourceQuery.data,
    item: values,
    form: localForm.form,
    values,
    defaultValues: mergedDefaultValues,
    columns,
    fields: resolvedFields,
    allFields: resolvedFields,
    unsupportedFields,
    validationErrors: localForm.validationErrors,
    isDirty,
    isLoading:
      dataSourceQuery.isLoading ||
      itemQuery.isLoading ||
      remoteFieldOptionsQuery.isLoading,
    isSubmitting: submitMutation.isPending,
    error,
    setValue: localForm.setValue,
    reset: localForm.reset,
    submit,
    refetch,
    renderField,
    renderLayout
  }
}

function dataSourceFieldToIField(field: DataSourceField): IField {
  const raw = toRecord(field)
  const options = mergeFieldOptions(raw)

  return {
    id: pickString(raw, 'id') ?? pickString(raw, 'slug') ?? '',
    name: pickString(raw, 'name') ?? pickString(raw, 'slug') ?? '',
    slug: pickString(raw, 'slug') ?? pickString(raw, 'id') ?? '',
    type: (pickString(raw, 'type') ?? 'field-text') as IFieldType,
    defaultValue: pickString(raw, 'defaultValue', 'default_value') ?? null,
    validations: pickStringArray(raw, 'validations', 'validationRules'),
    readOnly: pickBoolean(raw, 'readOnly', 'read_only') ?? false,
    options,
    relationDataSourceId:
      pickString(raw, 'relationDataSourceId', 'relation_data_source_id') ??
      null,
    avatarMapping: normalizeAvatarMapping(raw, options),
    nested:
      pickBoolean(raw, 'nested') ??
      pickBoolean(options ?? {}, 'nested') ??
      null,
    nestedByProp:
      pickString(raw, 'nestedByProp', 'nested_by_prop') ??
      pickString(options ?? {}, 'nestedByProp', 'nested_by_prop') ??
      null,
    itemMapping: normalizeItemMapping(raw, options)
  }
}

function mergeFieldOptions(
  raw: Record<string, unknown>
): Record<string, unknown> | null {
  const directOptions = toRecord(raw.options)
  const directEditorOptions = toRecord(raw.editorOptions)
  const nestedEditorOptions = directOptions
    ? toRecord(directOptions.editorOptions)
    : null
  const merged: Record<string, unknown> = {
    ...(directOptions ?? {})
  }

  if (directEditorOptions && !('editorOptions' in merged)) {
    merged.editorOptions = directEditorOptions
  } else if (nestedEditorOptions) {
    merged.editorOptions = nestedEditorOptions
  }

  return Object.keys(merged).length > 0 ? merged : null
}

function normalizeAvatarMapping(
  raw: Record<string, unknown>,
  options: Record<string, unknown> | null
): IField['avatarMapping'] {
  const source = toRecord(raw.avatarMapping) ?? toRecord(options?.avatarMapping)

  if (!source) return null

  return {
    iconField: pickString(source, 'iconField', 'icon_field') ?? null,
    colorField: pickString(source, 'colorField', 'color_field') ?? null,
    imageField: pickString(source, 'imageField', 'image_field') ?? null
  }
}

function normalizeItemMapping(
  raw: Record<string, unknown>,
  options: Record<string, unknown> | null
): IField['itemMapping'] {
  const source = toRecord(raw.itemMapping) ?? toRecord(options?.itemMapping)

  if (!source) return null

  return {
    iconField: pickString(source, 'iconField', 'icon_field') ?? null,
    colorField: pickString(source, 'colorField', 'color_field') ?? null,
    imageField: pickString(source, 'imageField', 'image_field') ?? null,
    descriptionField:
      pickString(source, 'descriptionField', 'description_field') ?? null
  }
}

function buildFieldQueryColumns(fields: Array<IField>): Array<string> {
  return uniqueStrings(fields.flatMap(getFieldQueryKeys))
}

function getFieldQueryKeys(field: IField): Array<string> {
  const keys = new Set<string>()

  if (field.slug) keys.add(field.slug)

  switch (field.type) {
    case 'field-money':
      keys.add(getCompanionFieldSlug(field.slug, 'currency'))
      break

    case 'field-phone':
      keys.add(getCompanionFieldSlug(field.slug, 'country'))
      break

    case 'field-status':
      keys.add(getCompanionFieldSlug(field.slug, 'secondary'))
      keys.add(getCompanionFieldSlug(field.slug, 'description'))
      keys.add(getCompanionFieldSlug(field.slug, 'followup_date'))
      break

    case 'field-htmlEditor':

    case 'field-emailEditor':
      keys.add(getCompanionFieldSlug(field.slug, 'html'))
      break

    case 'field-avatar': {
      if (field.avatarMapping?.iconField)
        keys.add(field.avatarMapping.iconField)
      if (field.avatarMapping?.colorField)
        keys.add(field.avatarMapping.colorField)
      if (field.avatarMapping?.imageField)
        keys.add(field.avatarMapping.imageField)
      break
    }

    default:
      break
  }

  return Array.from(keys)
}

function getFieldSubmitKeys(field: IField): Array<string> {
  switch (field.type) {
    case 'field-money':
      return uniqueStrings([field.slug, getCompanionFieldSlug(field.slug, 'currency')])

    case 'field-phone':
      return uniqueStrings([field.slug, getCompanionFieldSlug(field.slug, 'country')])

    case 'field-status':
      return uniqueStrings([
        field.slug,
        getCompanionFieldSlug(field.slug, 'secondary'),
        getCompanionFieldSlug(field.slug, 'description'),
        getCompanionFieldSlug(field.slug, 'followup_date')
      ])

    case 'field-avatar':
      return uniqueStrings([field.avatarMapping?.iconField, field.avatarMapping?.colorField, field.avatarMapping?.imageField])

    default:
      return field.slug ? [field.slug] : []
  }
}

function buildInitialValues(
  fields: Array<IField>,
  item: Record<string, unknown>,
  providedDefaults?: Record<string, unknown>
): Record<string, unknown> {
  const values: Record<string, unknown> = {}

  for (const field of fields) {
    const defaultValue = parseFieldDefaultValue(field.defaultValue, field.type)

    if (field.slug && !(field.slug in values)) {
      values[field.slug] = defaultValue
    }

    if (field.type === 'field-money') {
      const currencySlug = getCompanionFieldSlug(field.slug, 'currency')

      if (!(currencySlug in values)) values[currencySlug] = 'USD'
    }

    if (field.type === 'field-phone') {
      const countrySlug = getCompanionFieldSlug(field.slug, 'country')

      if (!(countrySlug in values)) values[countrySlug] = ''
    }

    if (field.type === 'field-status') {
      const secondarySlug = getCompanionFieldSlug(field.slug, 'secondary')
      const descriptionSlug = getCompanionFieldSlug(field.slug, 'description')
      const followupDateSlug = getCompanionFieldSlug(
        field.slug,
        'followup_date'
      )

      if (!(secondarySlug in values)) values[secondarySlug] = ''
      if (!(descriptionSlug in values)) values[descriptionSlug] = ''
      if (!(followupDateSlug in values)) values[followupDateSlug] = null
    }

    if (field.type === 'field-avatar') {
      if (
        field.avatarMapping?.iconField &&
        !(field.avatarMapping.iconField in values)
      ) {
        values[field.avatarMapping.iconField] = null
      }
      if (
        field.avatarMapping?.colorField &&
        !(field.avatarMapping.colorField in values)
      ) {
        values[field.avatarMapping.colorField] = null
      }
      if (
        field.avatarMapping?.imageField &&
        !(field.avatarMapping.imageField in values)
      ) {
        values[field.avatarMapping.imageField] = null
      }
    }
  }

  Object.assign(values, providedDefaults ?? {})
  Object.assign(values, item ?? {})

  for (const field of fields) {
    if (field.type === 'field-phone') {
      const countrySlug = getCompanionFieldSlug(field.slug, 'country')
      const legacyCountryCodeSlug = getCompanionFieldSlug(
        field.slug,
        'country_code'
      )

      if (!values[countrySlug] && values[legacyCountryCodeSlug]) {
        values[countrySlug] = values[legacyCountryCodeSlug]
      }
    }
  }

  return values
}

function parseFieldDefaultValue(
  value: string | null | undefined,
  type: IFieldType
): unknown {
  if (value == null || value === '') {
    if (type === 'field-checkbox' || type === 'field-switch') return false
    if (
      type === 'field-multiSelect' ||
      type === 'field-tagSelect' ||
      type === 'field-userMultiSelect'
    )
      return []

    return null
  }

  switch (type) {
    case 'field-checkbox':

    case 'field-switch':
      return value === 'true' || value === '1'

    case 'field-number':

    case 'field-money':

    case 'field-percent':

    case 'field-duration':

    case 'field-rating':

    case 'field-autonumber':

    case 'field-identity': {
      const parsed = Number(value)

      return Number.isFinite(parsed) ? parsed : null
    }

    case 'field-multiSelect':

    case 'field-tagSelect':

    case 'field-userMultiSelect':

    case 'field-taskList':

    case 'field-schemaRepeater':

    case 'field-queryBuilder':

    case 'field-locationSelect':

    case 'field-approvalStatus':

    case 'field-docEditor':

    case 'field-json':

    case 'field-image':

    case 'field-file':
      return parseJsonValue(value)

    default:
      return value
  }
}

function resolveEnumOptions(
  field: IField,
  remote: RemoteFieldOptionsResult | undefined,
  overrides?: Record<string, Array<EnumOption>>
): Array<EnumOption> {
  if (overrides?.[field.slug]) {
    return overrides[field.slug] ?? []
  }

  switch (field.type) {
    case 'field-select':

    case 'field-radioGroup':

    case 'field-enum':

    case 'field-systemEnum':

    case 'field-status':

    case 'field-multiSelect':

    case 'field-tagSelect': {
      const staticOptions = extractStaticEnumOptions(field)

      if (staticOptions.length > 0) {
        return staticOptions
      }

      return remote?.enums[field.slug] ?? []
    }

    case 'field-userSelect':

    case 'field-userMultiSelect':
      return remote?.users ?? []

    case 'field-relation':
      return remote?.relations[field.slug] ?? []

    default:
      return []
  }
}

function extractStaticEnumOptions(field: IField): Array<EnumOption> {
  const raw = toRecord(field)
  const optionsObject = toRecord(field.options)
  const editorOptions = toRecord(optionsObject?.editorOptions)
  const source = ((): Array<unknown> => {
    if (Array.isArray(raw.enums)) return raw.enums
    if (Array.isArray(raw.options)) return raw.options
    if (Array.isArray(optionsObject?.options)) return optionsObject.options
    if (Array.isArray(editorOptions?.options)) return editorOptions.options

    return []
  })()

  return source
    .map(item => normalizeEnumOption(item))
    .filter((option): option is EnumOption => option !== null)
}

function buildRelationOptionColumns(
  field: IField,
  targetFields: Array<DataSourceField>
): Array<string> {
  const targetSlugs = new Set(
    targetFields
      .map(targetField => pickString(toRecord(targetField), 'slug'))
      .filter((slug): slug is string => Boolean(slug))
  )
  const labelField = pickRelationLabelField(targetFields)
  const nestedByProp = field.nestedByProp ?? 'parent'
  const columns = [
    'id',
    labelField,
    field.itemMapping?.iconField,
    field.itemMapping?.colorField,
    field.itemMapping?.imageField,
    field.itemMapping?.descriptionField,
    field.nested ? nestedByProp : undefined
  ]

  const existingColumns = columns.filter(
    (column): column is string => typeof column === 'string' && column.length > 0
  )

  return uniqueStrings(
    existingColumns.filter(
      column => column === 'id' || targetSlugs.has(column)
    )
  )
}

function pickRelationLabelField(targetFields: Array<DataSourceField>): string {
  const slugs = targetFields
    .map(field => ({
      slug: pickString(toRecord(field), 'slug'),
      type: (pickString(toRecord(field), 'type') ?? '') as IFieldType
    }))
    .filter((field): field is { slug: string; type: IFieldType } => Boolean(field.slug))

  for (const candidate of LABEL_FIELD_CANDIDATES) {
    const matched = slugs.find(field => field.slug === candidate)

    if (matched) return matched.slug
  }

  const textual = slugs.find(field => TEXTUAL_FIELD_TYPES.has(field.type))

  if (textual) return textual.slug

  return slugs[0]?.slug ?? 'id'
}

function relationRecordToEnumOption(
  record: Record<string, unknown>,
  field: IField,
  targetFields: Array<DataSourceField>
): EnumOption | null {
  const id = pickString(record, 'id')

  if (!id) return null

  const labelField = pickRelationLabelField(targetFields)
  const name =
    pickString(
      record,
      labelField,
      'name',
      'title',
      'display_name',
      'displayName'
    ) ?? id
  const nestedByProp = field.nestedByProp ?? 'parent'
  const parentValue = field.nested ? record[nestedByProp] : undefined

  return {
    id,
    name,
    icon: field.itemMapping?.iconField
      ? (pickString(record, field.itemMapping.iconField) ?? undefined)
      : undefined,
    color: field.itemMapping?.colorField
      ? (pickString(record, field.itemMapping.colorField) ?? undefined)
      : undefined,
    description: field.itemMapping?.descriptionField
      ? (pickString(record, field.itemMapping.descriptionField) ?? undefined)
      : undefined,
    parent: normalizeRelatedId(parentValue) ?? undefined
  }
}

function userRecordToEnumOption(
  record: Record<string, unknown>
): EnumOption | null {
  const id = pickString(record, 'id', 'userId', 'user_id')

  if (!id) return null

  return {
    id,
    name:
      pickString(record, 'display_name', 'displayName', 'name', 'email') ?? id,
    icon:
      pickString(
        record,
        'avatar_url',
        'avatarUrl',
        'profile_image_url',
        'profileImageUrl'
      ) ?? undefined
  }
}

function normalizeRelatedId(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value
  if (value && typeof value === 'object') {
    const record = toRecord(value)

    return pickString(record, 'id')
  }

  return null
}

function normalizeEnumOption(value: unknown): EnumOption | null {
  if (!value || typeof value !== 'object') return null
  const record = toRecord(value)
  const id = pickString(record, 'id', 'value', 'slug')
  const name = pickString(record, 'name', 'label', 'title') ?? id

  if (!id || !name) return null

  return {
    id,
    name,
    color: pickString(record, 'color') ?? undefined,
    icon: pickString(record, 'icon') ?? undefined,
    parent: pickString(record, 'parent') ?? undefined,
    slug: pickString(record, 'slug') ?? undefined,
    description: pickString(record, 'description') ?? undefined,
    active: pickBoolean(record, 'active') ?? undefined
  }
}

function buildSubmitPayload(
  fields: Array<
    Pick<DocyrusFormViewField, 'readOnly' | 'disabled' | 'submitKeys'>
  >,
  values: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  for (const field of fields) {
    if (field.readOnly || field.disabled) continue

    for (const key of field.submitKeys) {
      if (!key) continue
      if (!(key in values)) continue

      payload[key] = values[key]
    }
  }

  return payload
}

function normalizeColumnsInput(columns: unknown): Array<string> {
  if (Array.isArray(columns)) {
    return uniqueStrings(
      columns.filter(
        (column): column is string => typeof column === 'string' && column.length > 0
      )
    )
  }

  if (typeof columns === 'string') {
    return uniqueStrings(
      columns
        .split(',')
        .map(column => column.trim())
        .filter(Boolean)
    )
  }

  return []
}

function uniqueStrings(
  values: Array<string | null | undefined>
): Array<string> {
  return Array.from(
    new Set(
      values.filter(
        (value): value is string => typeof value === 'string' && value.trim().length > 0
      )
    )
  )
}

function unwrapArray<T>(value: Array<T> | { data: Array<T> } | null): Array<T> {
  if (Array.isArray(value)) return value
  if (
    value &&
    typeof value === 'object' &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return value.data
  }

  return []
}

function unwrapRecord(
  value: object | { data: object } | null | undefined
): Record<string, unknown> {
  if (!value) return {}
  if (
    'data' in value &&
    value.data &&
    typeof value.data === 'object' &&
    !Array.isArray(value.data)
  ) {
    return value.data as Record<string, unknown>
  }

  return value as Record<string, unknown>
}

function pickString(
  record: Record<string, unknown>,
  ...keys: Array<string>
): string | null {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'string' && value.length > 0) return value
  }

  return null
}

function pickBoolean(
  record: Record<string, unknown>,
  ...keys: Array<string>
): boolean | null {
  for (const key of keys) {
    const value = record[key]

    if (typeof value === 'boolean') return value
  }

  return null
}

function pickStringArray(
  record: Record<string, unknown>,
  ...keys: Array<string>
): Array<string> | null {
  for (const key of keys) {
    const value = record[key]

    if (Array.isArray(value)) {
      return value.filter((entry): entry is string => typeof entry === 'string')
    }
  }

  return null
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function parseJsonValue(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function isDocyrusFormViewLayoutFieldItem(
  item: DocyrusFormViewLayoutItem
): item is DocyrusFormViewLayoutFieldItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    'type' in item &&
    item.type === 'field'
  )
}

function normalizeDocyrusFormViewLayoutItems(
  items: Array<DocyrusFormViewLayoutItem>,
  visibleFieldSlugs: Set<string>,
  seenFieldSlugs: Set<string> = new Set()
): Array<DocyrusFormViewLayoutItem> {
  const normalizedItems: Array<DocyrusFormViewLayoutItem> = []

  for (const item of items) {
    if (typeof item === 'string') {
      if (!visibleFieldSlugs.has(item) || seenFieldSlugs.has(item)) {
        continue
      }

      seenFieldSlugs.add(item)
      normalizedItems.push(item)
      continue
    }

    if (isDocyrusFormViewLayoutFieldItem(item)) {
      if (!visibleFieldSlugs.has(item.slug) || seenFieldSlugs.has(item.slug)) {
        continue
      }

      seenFieldSlugs.add(item.slug)
      normalizedItems.push(item)
      continue
    }

    if (item.variant === 'tabpanel') {
      const normalizedTabs = item.items
        .filter(tab => tab.variant === 'tab')
        .map(tab => ({
          ...tab,
          items: normalizeDocyrusFormViewLayoutItems(
            tab.items,
            visibleFieldSlugs,
            seenFieldSlugs
          )
        }))
        .filter(tab => tab.items.length > 0)

      if (normalizedTabs.length === 0) {
        continue
      }

      normalizedItems.push({
        ...item,
        items: normalizedTabs
      })
      continue
    }

    const normalizedChildren = normalizeDocyrusFormViewLayoutItems(
      item.items,
      visibleFieldSlugs,
      seenFieldSlugs
    )

    if (normalizedChildren.length === 0) {
      continue
    }

    normalizedItems.push({
      ...item,
      items: normalizedChildren
    })
  }

  return normalizedItems
}

function collectDocyrusFormViewLayoutFieldSlugs(
  items: Array<DocyrusFormViewLayoutItem>
): Array<string> {
  return items.flatMap((item) => {
    if (typeof item === 'string') {
      return [item]
    }

    if (isDocyrusFormViewLayoutFieldItem(item)) {
      return [item.slug]
    }

    return collectDocyrusFormViewLayoutFieldSlugs(item.items)
  })
}

function getDocyrusFormViewTabValue(tab: DocyrusFormViewTabSection): string {
  return `tab-${tab.id}`
}

function resolveBooleanOrResolver(
  value: boolean | ((values: Record<string, unknown>) => boolean) | undefined,
  values: Record<string, unknown>
): boolean | undefined {
  if (typeof value === 'function') return value(values)

  return value
}

function isFieldRequired(field: IField): boolean {
  return field.validations?.includes('required') ?? false
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0

  return false
}

function stableStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

function valuesMatch(
  left: Record<string, unknown>,
  right: Record<string, unknown>
): boolean {
  return stableStringify(left) === stableStringify(right)
}

function getGridColumnsClassName(columns: 1 | 2 | 3 | 4): string {
  switch (columns) {
    case 1:
      return 'grid grid-cols-1 gap-4'

    case 2:
      return 'grid grid-cols-1 gap-4 lg:grid-cols-2'

    case 3:
      return 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'

    case 4:
      return 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'

    default:
      return 'grid grid-cols-1 gap-4'
  }
}

function getGridSpanStyle(
  colSpan: DocyrusFormViewColSpan | undefined
): CSSProperties | undefined {
  if (!colSpan) return undefined
  if (colSpan === 'full') return { gridColumn: '1 / -1' }

  return { gridColumn: `span ${colSpan} / span ${colSpan}` }
}
