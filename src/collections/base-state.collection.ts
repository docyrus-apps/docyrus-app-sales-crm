// Generated collection for base/state
import { useDocyrusClient } from '@docyrus/signin';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface BaseStateEntity {

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

  /** Country */
  country_id: { id: string; name: string } | string;
}

export function useBaseStateCollection() {
  const client = useDocyrusClient();

  return {
    /** List records with optional filtering, sorting, and pagination. */
    list: (params?: ICollectionListParams): Promise<Array<BaseStateEntity>> => client!.get('/v1/apps/base/data-sources/state/items', params as Record<string, QueryParamValue> | undefined),

    /** Get record */
    get: (recordId: string, params?: { columns?: Array<string> }): Promise<BaseStateEntity> => client!.get('/v1/apps/base/data-sources/state/items/{recordId}'.replace('{recordId}', recordId), params),

    /** Create record */
    create: (data: Record<string, any>): Promise<BaseStateEntity> => client!.post('/v1/apps/base/data-sources/state/items', data),

    /** Update record */
    update: (recordId: string, data: Record<string, any>): Promise<BaseStateEntity> => client!.patch('/v1/apps/base/data-sources/state/items/{recordId}'.replace('{recordId}', recordId), data),

    /** Delete record */
    delete: (recordId: string): Promise<void> => client!.delete('/v1/apps/base/data-sources/state/items/{recordId}'.replace('{recordId}', recordId)),

    /** Delete many records */
    deleteMany: (data: { recordIds: Array<string> }): Promise<void> => client!.delete('/v1/apps/base/data-sources/state/items', data)
  };
}
