import { useMemo } from 'react'

import type { EnumEntity } from '@/collections/enums.collection'

import { useQuery } from '@tanstack/react-query'

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

  return {
    data: entities,
    isLoading,
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

  const enumOptions = useMemo(
    () => entities.map(option => ({
        label: option.name,
        value: option.id
      })),
    [entities]
  )

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
