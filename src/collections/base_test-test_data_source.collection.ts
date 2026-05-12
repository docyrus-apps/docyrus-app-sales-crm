// Generated collection for base_test/test_data_source
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseTestTestDataSourceEntity {
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

  /** Text Kontrol */
  text_kontrol?: string

  /** Number Kontrol */
  number_kontrol?: number

  /** Email Kontrol */
  email_kontrol?: string

  /** Phone Kontrol */
  phone_kontrol?: string

  /** URL Kontrol */
  url_kontrol?: string

  /** Textarea Kontrol */
  textarea_kontrol?: string

  /** Checkbox Kontrol */
  checkbox_kontrol?: boolean

  /** Switch Kontrol */
  switch_kontrol?: boolean

  /** Date Kontrol */
  date_kontrol?: string

  /** DateTime Kontrol */
  datetime_kontrol?: string

  /** Time Kontrol */
  time_kontrol?: string

  /** Duration Kontrol */
  duration_kontrol?: number

  /** Money Kontrol */
  money_kontrol?: number

  /** Currency Select Kontrol */
  currency_select_kontrol?: string

  /** Single Select Kontrol */
  single_select_kontrol?: { id: string; name: string } | any

  /** Status Kontrol */
  status_kontrol?: { id: string; name: string } | any

  /** Relation Link Kontrol */
  relation_link_kontrol?: { id: string; name: string } | string

  /** Password Kontrol */
  password_kontrol?: string

  /** Date Range Kontrol */
  date_range_kontrol?: string

  /** Multiple Selection Kontrol */
  multiple_selection_kontrol?: { id: string; name: string } | any

  /** User Kontrol */
  user_kontrol?: { id: string; name: string } | string

  /** HTML Editor Kontrol */
  html_editor_kontrol?: string

  /** Email Content Editor Kontrol */
  email_content_editor_kontrol?: string

  /** Code Editor Kontrol */
  code_editor_kontrol?: string

  /** File */
  file_kontrol?: Record<string, any>

  /** Image */
  image_kontrol?: Record<string, any>

  /** Location Select Kontrol */
  location_select_kontrol?: Record<string, any>

  /** Rating Kontrol */
  rating_kontrol?: number
}

export function useBaseTestTestDataSourceCollection() {
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
      ): Promise<Array<BaseTestTestDataSourceEntity>> =>
        client!.get(
          '/v1/apps/base_test/data-sources/test_data_source/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseTestTestDataSourceEntity> =>
        client!.get(
          '/v1/apps/base_test/data-sources/test_data_source/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseTestTestDataSourceEntity> =>
        client!.post(
          '/v1/apps/base_test/data-sources/test_data_source/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseTestTestDataSourceEntity> =>
        client!.patch(
          '/v1/apps/base_test/data-sources/test_data_source/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_test/data-sources/test_data_source/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_test/data-sources/test_data_source/items',
          data,
        ),
    }),
    [client],
  )
}
