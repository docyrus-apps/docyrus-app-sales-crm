// Generated collection for base_calendars/booking_question
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCalendarsBookingQuestionEntity {
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

  /** Options JSON */
  options_json?: Record<string, any>

  /** Event Type */
  event_type?: { id: string; name: string } | string

  /** Label */
  label?: string

  /** Slug */
  slug?: string

  /** Placeholder */
  placeholder?: string

  /** Help Text */
  help_text?: string

  /** Question Type */
  question_type?: { id: string; name: string } | any

  /** Is Required */
  is_required?: boolean

  /** Display Order */
  display_order?: number
}

export function useBaseCalendarsBookingQuestionCollection() {
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
      ): Promise<Array<BaseCalendarsBookingQuestionEntity>> =>
        client!.get(
          '/v1/apps/base_calendars/data-sources/booking_question/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCalendarsBookingQuestionEntity> =>
        client!.get(
          '/v1/apps/base_calendars/data-sources/booking_question/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCalendarsBookingQuestionEntity> =>
        client!.post(
          '/v1/apps/base_calendars/data-sources/booking_question/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCalendarsBookingQuestionEntity> =>
        client!.patch(
          '/v1/apps/base_calendars/data-sources/booking_question/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_calendars/data-sources/booking_question/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_calendars/data-sources/booking_question/items',
          data,
        ),
    }),
    [client],
  )
}
