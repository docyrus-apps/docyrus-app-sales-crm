// Generated collection for base_calendars/host_profile
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCalendarsHostProfileEntity {
  /** ID */
  id?: string

  /** Record owner */
  record_owner?: string

  /** Created On */
  created_on?: string

  /** Created By */
  created_by?: string

  /** Last Modified On */
  last_modified_on?: string

  /** Last Modified By */
  last_modified_by?: string

  /** Bio */
  bio?: Record<string, any>

  /** Show Avatar */
  show_avatar?: boolean

  /** Show Headline */
  show_headline?: boolean

  /** Show Bio */
  show_bio?: boolean

  /** Show Timezone */
  show_timezone?: boolean

  /** Allow Search Indexing */
  allow_search_indexing?: boolean

  /** Role */
  role?: { id: string; name: string } | any

  /** Public Slug */
  public_slug?: string

  /** Display Name */
  display_name?: string

  /** Avatar */
  avatar?: Record<string, any>

  /** Workspace */
  workspace?: { id: string; name: string } | string

  /** User */
  user?: { id: string; name: string } | string

  /** Headline */
  headline?: string

  /** Booking Enabled */
  booking_enabled?: boolean

  /** Timezone */
  time_zone?: string

  /** Default Location Type */
  default_location_type?: { id: string; name: string } | any

  /** Default Location Details */
  default_location_details?: string
}

export function useBaseCalendarsHostProfileCollection() {
  const client = useDocyrusClient()

  /*
   * Memoize the returned object so its identity is stable across renders.
   * Consumers commonly put the collection in useCallback/useMemo deps
   * (e.g. on a delete/save handler) — without memoization, every render
   * produces a fresh object, those callbacks rebuild, and any effect that
   * tracks them via deps fires every render. That's what triggers the
   * infinite-loop case in <DataGrid>: an unstable handler reaches the
   * grid's column-applier effect, which calls table.setColumnVisibility
   * → store.set → store.notify → re-render → unstable collection again.
   */
  return useMemo(
    () => ({
      /** List records with optional filtering, sorting, and pagination. */
      list: (
        params?: ICollectionListParams,
      ): Promise<Array<BaseCalendarsHostProfileEntity>> =>
        client!.get(
          '/v1/apps/base_calendars/data-sources/host_profile/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCalendarsHostProfileEntity> =>
        client!.get(
          '/v1/apps/base_calendars/data-sources/host_profile/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCalendarsHostProfileEntity> =>
        client!.post(
          '/v1/apps/base_calendars/data-sources/host_profile/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCalendarsHostProfileEntity> =>
        client!.patch(
          '/v1/apps/base_calendars/data-sources/host_profile/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_calendars/data-sources/host_profile/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_calendars/data-sources/host_profile/items',
          data,
        ),
    }),
    [client],
  )
}
