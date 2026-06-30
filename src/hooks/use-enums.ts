import { useMemo } from 'react'

import type { EnumEntity } from '@/collections/enums.collection'

import { useQuery } from '@tanstack/react-query'
import { createDataSourceClient } from '@docyrus/app-utils'
import { useDocyrusClient } from '@docyrus/signin'

import { useEnumsCollection } from '@/collections'

import { type CellSelectOption } from '@/components/docyrus/data-grid/types'

import { QUERY_CONFIG } from '@/lib/constants'

interface UseEnumsOptions {
  enabled?: boolean;
}

interface UseEnumEntitiesOptions extends UseEnumsOptions {
  appSlug?: string;
  dataSourceSlug?: string;
}

interface RawDataSourceRecord {
  fields?: Array<RawFieldRecord>;
}

interface RawFieldRecord {
  slug?: string;
  enums?: Array<RawEditorOption> | null;
  options?: {
    editorOptions?: {
      data?: Array<RawEditorOption>;
    };
  } | null;
}

interface RawEditorOption {
  id?: string | null;
  value?: string | null;
  name?: string | null;
  label?: string | null;
  description?: string | null;
  color?: string | null;
  icon?: string | null;
  active?: boolean | null;
  parent?: string | null;
  no?: number | null;
  sortOrder?: number | null;
  sort_order?: number | null;
  isFinalOption?: boolean | null;
  is_final_option?: boolean | null;
}

const BUNDLED_ENUM_FALLBACKS: Record<
  string,
  Record<string, Record<string, Array<RawEditorOption>>>
> = {
  base_crm: {
    deal: {
      stage: [
        {
          id: 'f028a780-6807-11ee-a9c0-d7a17977c62a',
          name: 'New',
          color: 'cyan',
          icon: 'fal circle-check'
        },
        {
          id: '077c7c90-6808-11ee-a9c0-d7a17977c62a',
          name: 'Lost',
          color: 'red',
          icon: 'fal thumbs-up'
        },
        {
          id: '0aba9090-6808-11ee-a9c0-d7a17977c62a',
          name: 'Budget',
          color: 'rose',
          icon: 'fal money-bill-1'
        },
        {
          id: 'f75b7550-6807-11ee-a9c0-d7a17977c62a',
          name: 'Follow - Up',
          color: 'orange',
          icon: 'fal arrow-right-to-line'
        },
        {
          id: '01c1f6e0-6808-11ee-a9c0-d7a17977c62a',
          name: 'Negotiation',
          color: 'green',
          icon: 'fal podium-star'
        },
        {
          id: 'fd77a300-6807-11ee-a9c0-d7a17977c62a',
          name: 'Demo',
          color: 'violet',
          icon: 'fal paper-plane'
        },
        {
          id: 'fb413b00-6807-11ee-a9c0-d7a17977c62a',
          name: 'Proposal',
          color: 'cyan',
          icon: 'fal calendar-star'
        },
        {
          id: '046c5660-6808-11ee-a9c0-d7a17977c62a',
          name: 'Won',
          color: 'sky',
          icon: 'fal thumbs-up'
        },
        {
          id: 'b4be0350-6809-11ee-b4f8-9b1c62bfef41',
          name: 'Cancelled',
          color: 'slate',
          icon: 'fal circle-minus'
        }
      ],
      lead_source: [
        {
          id: '5b727460-d533-11ee-8252-d7365c188dc3',
          name: 'Email',
          color: 'lime',
          icon: 'fal mailbox'
        },
        {
          id: '4dcf3e60-d533-11ee-8252-d7365c188dc3',
          name: 'Chat',
          color: 'rose',
          icon: 'fal comments-question-check'
        },
        {
          id: '543e4700-d533-11ee-8252-d7365c188dc3',
          name: 'Social Media',
          color: 'yellow',
          icon: 'fal laptop-mobile'
        },
        {
          id: '506308a0-d533-11ee-8252-d7365c188dc3',
          name: 'Ads',
          color: 'purple',
          icon: 'fal headset'
        },
        {
          id: '5976a460-d533-11ee-8252-d7365c188dc3',
          name: 'Website',
          color: 'sky',
          icon: 'fal computer-mouse'
        }
      ],
      customer_type: [
        {
          id: 'a439c2e0-6808-11ee-a9c0-d7a17977c62a',
          name: 'New Business',
          color: 'blue',
          icon: 'fal business-time'
        },
        {
          id: 'a79c4ed0-6808-11ee-a9c0-d7a17977c62a',
          name: 'Existing Business',
          color: 'pink',
          icon: 'fal bullseye-pointer'
        }
      ]
    }
  }
}

/**
 * Hook to fetch and cache enum options
 * Enums are cached for 1 hour as they rarely change
 */
export function useEnums(options: UseEnumsOptions = {}) {
  const enumsCollection = useEnumsCollection()

  return useQuery({
    queryKey: ['enums'],
    queryFn: async () => {
      const response = await enumsCollection.getEnums()

      return response
    },
    enabled: options.enabled,
    staleTime: QUERY_CONFIG.STALE_TIME.ENUMS
  })
}

function sortEnums(left: EnumEntity, right: EnumEntity) {
  const leftOrder = left.sortOrder ?? left.no ?? Number.MAX_SAFE_INTEGER
  const rightOrder = right.sortOrder ?? right.no ?? Number.MAX_SAFE_INTEGER

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder
  }

  if (left.no !== right.no) {
    return left.no - right.no
  }

  return left.name.localeCompare(right.name)
}

function normalizeNullableString(value: string | null | undefined) {
  if (!value || value === 'null') return null

  return value
}

function normalizeFieldOption(
  option: RawEditorOption,
  index: number,
  context: {
    appSlug: string;
    dataSourceSlug: string;
    fieldSlug: string;
  }
): EnumEntity | null {
  const id = option.id ?? option.value
  const name = option.name ?? option.label

  if (!id || !name) return null

  const order = option.sortOrder ?? option.sort_order ?? index + 1

  return {
    id,
    name,
    description: option.description ?? null,
    color: normalizeNullableString(option.color),
    icon: normalizeNullableString(option.icon),
    active: option.active ?? true,
    parent: option.parent ?? null,
    no: option.no ?? index + 1,
    sortOrder: order,
    isFinalOption: option.isFinalOption ?? option.is_final_option ?? null,
    appSlug: context.appSlug,
    dataSourceSlug: context.dataSourceSlug,
    fieldSlug: context.fieldSlug
  }
}

function getBundledFallbackOptions(
  appSlug: string,
  dataSourceSlug: string,
  fieldSlug: string
) {
  return BUNDLED_ENUM_FALLBACKS[appSlug]?.[dataSourceSlug]?.[fieldSlug] ?? []
}

function useDataSourceFieldsWithOptions(
  appSlug: string | undefined,
  dataSourceSlug: string | undefined,
  enabled: boolean
) {
  const client = useDocyrusClient()
  const dataSourcesClient = useMemo(
    () => (client ? createDataSourceClient(client) : null),
    [client]
  )

  return useQuery({
    queryKey: ['data-source-fields-with-options', appSlug, dataSourceSlug],
    queryFn: async () => {
      if (!dataSourcesClient || !appSlug || !dataSourceSlug) return []

      const dataSource = (await dataSourcesClient.getBySlug(
        appSlug,
        dataSourceSlug,
        { expand: 'enums' }
      )) as RawDataSourceRecord

      return dataSource.fields ?? []
    },
    enabled: enabled && Boolean(dataSourcesClient && appSlug && dataSourceSlug),
    staleTime: QUERY_CONFIG.STALE_TIME.ENUMS
  })
}

export function useEnumEntities(
  fieldName: string,
  options: UseEnumEntitiesOptions = {}
) {
  const {
    data: enums,
    isLoading,
    error
  } = useEnums({
    enabled: options.enabled
  })

  const entities = useMemo(() => {
    if (!enums) return []

    const matches: Array<EnumEntity> = []

    for (const [appSlug, appEnums] of Object.entries(enums)) {
      if (options.appSlug && options.appSlug !== appSlug) continue

      for (const [dataSourceSlug, fieldEnums] of Object.entries(appEnums)) {
        if (
          options.dataSourceSlug &&
          options.dataSourceSlug !== dataSourceSlug
        ) {
          continue
        }

        const statusEnums = fieldEnums[fieldName]

        if (Array.isArray(statusEnums)) {
          matches.push(...statusEnums)
        }
      }
    }

    return [...matches].sort(sortEnums)
  }, [
enums,
fieldName,
options.appSlug,
options.dataSourceSlug
])

  const shouldLoadFieldOptions =
    options.enabled !== false &&
    Boolean(options.appSlug && options.dataSourceSlug && enums) &&
    !isLoading &&
    !error &&
    entities.length === 0

  const { data: fieldsWithOptions = [], isLoading: areFieldOptionsLoading } =
    useDataSourceFieldsWithOptions(
      options.appSlug,
      options.dataSourceSlug,
      shouldLoadFieldOptions
    )

  const fieldOptionEntities = useMemo(() => {
    if (!options.appSlug || !options.dataSourceSlug) return []

    const field = fieldsWithOptions.find(item => item.slug === fieldName)
    const fieldOptions = Array.isArray(field?.enums)
      ? field.enums
      : field?.options?.editorOptions?.data
    const rawOptions = fieldOptions?.length
      ? fieldOptions
      : getBundledFallbackOptions(
          options.appSlug,
          options.dataSourceSlug,
          fieldName
        )

    return rawOptions
      .map((option, index) => {
        return normalizeFieldOption(option, index, {
          appSlug: options.appSlug!,
          dataSourceSlug: options.dataSourceSlug!,
          fieldSlug: fieldName
        })
      })
      .filter((option): option is EnumEntity => Boolean(option))
      .sort(sortEnums)
  }, [
fieldName,
fieldsWithOptions,
options.appSlug,
options.dataSourceSlug
])

  const effectiveEntities = entities.length > 0 ? entities : fieldOptionEntities

  return {
    data: effectiveEntities,
    isLoading: isLoading || (shouldLoadFieldOptions && areFieldOptionsLoading),
    error
  }
}

/**
 * Hook to get specific enum options by field name
 * Flattens the nested enum structure to find options
 */
export function useEnumOptions(
  fieldName: string,
  options: UseEnumEntitiesOptions = {}
) {
  const {
    data: entities,
    isLoading,
    error
  } = useEnumEntities(fieldName, options)

  const enumOptions = useMemo(() => {
    return entities.map(option => ({
      label: option.name,
      value: option.id,
      color: option.color,
      icon: option.icon
    }))
  }, [entities])

  return {
    options: enumOptions,
    isLoading,
    error
  }
}

export function mapEnumEntitiesToCellOptions(
  entities: Array<EnumEntity>
): Array<CellSelectOption> {
  return entities.map(option => ({
    label: option.name,
    value: option.id,
    color: option.color ?? undefined,
    iconStr: option.icon ?? undefined
  }))
}
