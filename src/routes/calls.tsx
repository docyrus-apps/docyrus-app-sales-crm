import { useMemo } from 'react'

import type { ColumnDef } from '@tanstack/react-table'

import { PhoneCall } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDocyrusClient } from '@docyrus/signin'

import { type BaseCallcenterCallEntity } from '@/collections/base_callcenter-call.collection'

import { useBaseCallcenterCallCollection } from '@/collections/base_callcenter-call.collection'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid
} from '@/components/docyrus/data-grid'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDocyrusDataGrid } from '@/hooks/docyrus/use-docyrus-data-grid'
import { useSeedDefaultViews } from '@/hooks/use-seed-default-views'
import { useWebphoneEnumResolver } from '@/hooks/use-webphone-enums'
import { andFilter, createSystemViews } from '@/lib/crm-system-views'
import { useDateFormat } from '@/lib/use-date-format'

const APP_SLUG = 'base_callcenter'
const DATA_SOURCE_SLUG = 'call'

const CALL_GRID_COLUMN_OVERRIDES: Record<
  string,
  Partial<ColumnDef<BaseCallcenterCallEntity>>
> = {
  direction: { size: 110 },
  contact: { size: 200 },
  customer_phone_e164: { size: 165 },
  state: { size: 120 },
  outcome: { size: 140 },
  started_at: { size: 175 },
  duration_seconds: { size: 110 },
  agent_profile: { size: 190 }
}

const CALL_GRID_VISIBLE_FIELDS = new Set(
  Object.keys(CALL_GRID_COLUMN_OVERRIDES)
)
const CALL_GRID_COLUMNS = Object.keys(CALL_GRID_COLUMN_OVERRIDES)
const CALL_GRID_SORTING = [{ id: 'created_on', desc: true }]

export function CallsPage() {
  const client = useDocyrusClient()
  const { resolveEnum, isLoading: enumsLoading } = useWebphoneEnumResolver()
  const { t } = useTranslation()

  /*
   * Inbound/outbound views filter by the direction enum *id* (slug does not
   * match server-side — verified), so resolve them before seeding the views.
   */
  const inboundId = resolveEnum('call', 'direction', 'inbound')
  const outboundId = resolveEnum('call', 'direction', 'outbound')

  if (!client) return null

  if (enumsLoading || !inboundId || !outboundId) {
    return (
      <>
        <PageHeader
          title={t('webphone.calls.title')}
          icon={<PhoneCall className="h-4 w-4 text-cyan-500" />} />
        <PageContainer>
          <DataGridSkeleton>
            <DataGridSkeletonGrid />
          </DataGridSkeleton>
        </PageContainer>
      </>
    )
  }

  return (
    <CallsPageInner
      client={client}
      inboundId={inboundId}
      outboundId={outboundId} />
  )
}

function CallsPageInner({
  client,
  inboundId,
  outboundId
}: {
  client: NonNullable<ReturnType<typeof useDocyrusClient>>;
  inboundId: string;
  outboundId: string;
}) {
  const { t } = useTranslation()
  const collection = useBaseCallcenterCallCollection()
  const { formatDate, formatDateTime } = useDateFormat()

  const systemViews = useMemo(
    () => createSystemViews('base-callcenter-call', [
        {
          id: 'all',
          name: 'All',
          columns: CALL_GRID_COLUMNS,
          sorting: CALL_GRID_SORTING
        },
        {
          id: 'inbound',
          name: 'Inbound',
          columns: CALL_GRID_COLUMNS,
          sorting: CALL_GRID_SORTING,
          filterQuery: andFilter([{ field: 'direction', operator: '=', value: inboundId }])
        },
        {
          id: 'outbound',
          name: 'Outbound',
          columns: CALL_GRID_COLUMNS,
          sorting: CALL_GRID_SORTING,
          filterQuery: andFilter([{ field: 'direction', operator: '=', value: outboundId }])
        }
      ]),
    [inboundId, outboundId]
  )

  useSeedDefaultViews({
    client,
    appSlug: APP_SLUG,
    dataSourceSlug: DATA_SOURCE_SLUG,
    templates: systemViews,
    pruneUnlisted: true
  })

  const { table, gridProps, pagingMode, toolbar, isLoading, error } =
    useDocyrusDataGrid<BaseCallcenterCallEntity>({
      client,
      appSlug: APP_SLUG,
      dataSourceSlug: DATA_SOURCE_SLUG,
      collection,
      formatDate,
      formatDateTime,
      readOnly: true,
      enableServerExportMenu: true,
      searchPlaceholder: t('common.search', 'Search...'),
      getRowLabel: row => row.call_id || row.id || t('webphone.calls.title'),
      mapColumn: (field, defaultColumn) => {
        if (!CALL_GRID_VISIBLE_FIELDS.has(field.slug)) return null

        return {
          ...defaultColumn,
          ...CALL_GRID_COLUMN_OVERRIDES[field.slug]
        }
      }
    })

  return (
    <>
      <PageHeader
        title={t('webphone.calls.title')}
        icon={<PhoneCall className="h-4 w-4 text-cyan-500" />} />
      <PageContainer className="flex min-h-0 flex-1 max-w-full flex-col overflow-hidden pb-0">
        {isLoading && (
          <DataGridSkeleton>
            <DataGridSkeletonGrid />
          </DataGridSkeleton>
        )}

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                {t('webphone.calls.errorLoading', 'Could not load calls')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="shrink-0">{toolbar}</div>
            <div className="min-h-0 flex-1">
              <DataGrid
                table={table}
                {...gridProps}
                pagingMode={pagingMode}
                height="auto" />
            </div>
          </div>
        )}
      </PageContainer>
    </>
  )
}
