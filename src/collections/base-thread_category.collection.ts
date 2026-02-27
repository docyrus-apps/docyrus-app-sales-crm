// Generated collection for base/thread_category
import { useDocyrusClient } from '@docyrus/signin';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface BaseThreadCategoryEntity {

  /** ID */
  id?: string;

  /** Record owner */
  record_owner?: string;

  /** Created On */
  created_on?: string;

  /** Created By */
  created_by?: string;

  /** Last Modified On */
  last_modified_on?: string;

  /** Last Modified By */
  last_modified_by?: string;
}

export function useBaseThreadCategoryCollection() {
  const client = useDocyrusClient();

  return {
    /** List records with optional filtering, sorting, and pagination. */
    list: (params?: ICollectionListParams): Promise<Array<BaseThreadCategoryEntity>> => client!.get('/v1/apps/base/data-sources/thread_category/items', params as Record<string, QueryParamValue> | undefined),

    /** Get record */
    get: (recordId: string, params?: { columns?: Array<string> }): Promise<BaseThreadCategoryEntity> => client!.get('/v1/apps/base/data-sources/thread_category/items/{recordId}'.replace('{recordId}', recordId), params),

    /** Create record */
    create: (data: Record<string, any>): Promise<BaseThreadCategoryEntity> => client!.post('/v1/apps/base/data-sources/thread_category/items', data),

    /** Update record */
    update: (recordId: string, data: Record<string, any>): Promise<BaseThreadCategoryEntity> => client!.patch('/v1/apps/base/data-sources/thread_category/items/{recordId}'.replace('{recordId}', recordId), data),

    /** Delete record */
    delete: (recordId: string): Promise<void> => client!.delete('/v1/apps/base/data-sources/thread_category/items/{recordId}'.replace('{recordId}', recordId)),

    /** Delete many records */
    deleteMany: (data: { recordIds: Array<string> }): Promise<void> => client!.delete('/v1/apps/base/data-sources/thread_category/items', data)
  };
}
