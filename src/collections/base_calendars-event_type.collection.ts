// Generated collection for base_calendars/event_type
import { useMemo } from 'react'
import { useDocyrusClient } from '@docyrus/signin'
import type { QueryParamValue } from '@docyrus/api-client'
import type { ICollectionListParams } from './types'

export interface BaseCalendarsEventTypeEntity {
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

  /** Team ID */
  team_id?: string

  /** Distribution Method */
  distribution_method?: { id: string; name: string } | any

  /** Scheduling Mode */
  scheduling_mode?: { id: string; name: string } | any

  /** Booker Selectable Durations */
  booker_selectable_durations?: { id: string; name: string } | any

  /** Allow Booker To Select Duration */
  allow_booker_to_select_duration?: boolean

  /** Calendar Event Name Template */
  calendar_event_name_template?: string

  /** Requires Booker Email Verification */
  requires_booker_email_verification?: boolean

  /** Booking Page Layout Default */
  booking_page_layout_default?: { id: string; name: string } | any

  /** Max Bookings Per Week */
  max_bookings_per_week?: number

  /** Max Booking Duration Per Week Minutes */
  max_booking_duration_per_week_minutes?: number

  /** Max Booking Duration Per Day Minutes */
  max_booking_duration_per_day_minutes?: number

  /** Max Bookings Per Day */
  max_bookings_per_day?: number

  /** Default Intake Fields JSON */
  default_intake_fields_json?: Record<string, any>

  /** Require Cancellation Reason */
  require_cancellation_reason?: boolean

  /** Hide Calendar Event Details On Shared Calendars */
  hide_calendar_event_details_on_shared_calendars?: boolean

  /** Workspace */
  workspace?: { id: string; name: string } | string

  /** Event Name */
  event_name?: string

  /** Slug */
  slug?: string

  /** Status */
  status?: { id: string; name: string } | any

  /** Slot Interval Minutes */
  slot_interval_minutes?: number

  /** Booking Type */
  booking_type?: { id: string; name: string } | any

  /** Event Description */
  event_description?: Record<string, any>

  /** Duration Minutes */
  duration_minutes?: number

  /** Buffer After Minutes */
  buffer_after_minutes?: number

  /** Buffer Before Minutes */
  buffer_before_minutes?: number

  /** Minimum Notice Hours */
  minimum_notice_hours?: number

  /** Booking Window Days */
  booking_window_days?: number

  /** Capacity */
  capacity?: number

  /** Location Type */
  location_type?: { id: string; name: string } | any

  /** Location Details */
  location_details?: string

  /** Color */
  event_color?: string

  /** Requires Confirmation */
  requires_confirmation?: boolean

  /** Is Secret */
  is_secret?: boolean

  /** Auto-add Members */
  auto_add_members?: boolean

  /** Booking Scope */
  booking_scope?: { id: string; name: string } | any

  /** Host Profile */
  host_profile?: { id: string; name: string } | string

  /** Slot Interval Matches Duration */
  slot_interval_matches_duration?: boolean

  /** Show Workspace Branding On Public Page */
  show_workspace_branding_on_public_page?: boolean

  /** Time Format Default */
  time_format_default?: { id: string; name: string } | any
}

export function useBaseCalendarsEventTypeCollection() {
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
      ): Promise<Array<BaseCalendarsEventTypeEntity>> =>
        client!.get(
          '/v1/apps/base_calendars/data-sources/event_type/items',
          params as Record<string, QueryParamValue> | undefined,
        ),

      /** Get record */
      get: (
        recordId: string,
        params?: { columns?: Array<string> },
      ): Promise<BaseCalendarsEventTypeEntity> =>
        client!.get(
          '/v1/apps/base_calendars/data-sources/event_type/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          params,
        ),

      /** Create record */
      create: (
        data: Record<string, any>,
      ): Promise<BaseCalendarsEventTypeEntity> =>
        client!.post(
          '/v1/apps/base_calendars/data-sources/event_type/items',
          data,
        ),

      /** Update record */
      update: (
        recordId: string,
        data: Record<string, any>,
      ): Promise<BaseCalendarsEventTypeEntity> =>
        client!.patch(
          '/v1/apps/base_calendars/data-sources/event_type/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
          data,
        ),

      /** Delete record */
      delete: (recordId: string): Promise<void> =>
        client!.delete(
          '/v1/apps/base_calendars/data-sources/event_type/items/{recordId}'.replace(
            '{recordId}',
            recordId,
          ),
        ),

      /** Delete many records */
      deleteMany: (data: { recordIds: Array<string> }): Promise<void> =>
        client!.delete(
          '/v1/apps/base_calendars/data-sources/event_type/items',
          data,
        ),
    }),
    [client],
  )
}
