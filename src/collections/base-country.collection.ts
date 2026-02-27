// Generated collection for base/country
import { useDocyrusClient } from '@docyrus/signin';
import type { QueryParamValue } from '@docyrus/api-client';
import type { ICollectionListParams } from './types';

export interface BaseCountryEntity {

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

  /** Currency Name */
  currency_name?: string;

  /** Name */
  name: string;

  /** ISO3 */
  iso3?: string;

  /** Numeric Code */
  numeric_code?: string;

  /** ISO2 */
  iso2?: string;

  /** Currency */
  currency?: string;

  /** Currency Symbol */
  currency_symbol?: string;

  /** Native */
  native?: string;

  /** Capital */
  capital?: string;

  /** Region */
  region?: string;

  /** Subregion */
  subregion?: string;

  /** Nationality */
  nationality?: string;

  /** Timezones */
  timezones?: string;

  /** Translations */
  translations?: string;

  /** TLD */
  tld?: string;

  /** Emoji */
  emoji?: string;

  /** EmojiU */
  emojiu?: string;

  /** Flag */
  flag?: number;

  /** WikiDataId */
  wikidataid?: string;

  /** Latitude */
  latitude?: string;

  /** Longitude */
  longitude?: string;

  /** Phone Code */
  phone_code?: string;
}

export function useBaseCountryCollection() {
  const client = useDocyrusClient();

  return {
    /** List records with optional filtering, sorting, and pagination. */
    list: (params?: ICollectionListParams): Promise<Array<BaseCountryEntity>> => client!.get('/v1/apps/base/data-sources/country/items', params as Record<string, QueryParamValue> | undefined),

    /** Get record */
    get: (recordId: string, params?: { columns?: Array<string> }): Promise<BaseCountryEntity> => client!.get('/v1/apps/base/data-sources/country/items/{recordId}'.replace('{recordId}', recordId), params),

    /** Create record */
    create: (data: Record<string, any>): Promise<BaseCountryEntity> => client!.post('/v1/apps/base/data-sources/country/items', data),

    /** Update record */
    update: (recordId: string, data: Record<string, any>): Promise<BaseCountryEntity> => client!.patch('/v1/apps/base/data-sources/country/items/{recordId}'.replace('{recordId}', recordId), data),

    /** Delete record */
    delete: (recordId: string): Promise<void> => client!.delete('/v1/apps/base/data-sources/country/items/{recordId}'.replace('{recordId}', recordId)),

    /** Delete many records */
    deleteMany: (data: { recordIds: Array<string> }): Promise<void> => client!.delete('/v1/apps/base/data-sources/country/items', data)
  };
}
