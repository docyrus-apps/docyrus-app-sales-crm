import type { ColumnDef } from '@tanstack/react-table'
import type { CellSelectOption } from '@/components/docyrus/data-grid/types'

function getRelationLabel(
  value: { id?: string; name?: string } | string | null | undefined,
) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return value.name ?? ''

  return ''
}

function getEnumValue(
  value: { id?: string; name?: string } | string | null | undefined,
) {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') return value.id ?? ''

  return ''
}

interface LeadsColumnOptions {
  leadStatusOptions?: Array<CellSelectOption>
  leadSourceOptions?: Array<CellSelectOption>
}

export function getLeadsColumns(
  options: LeadsColumnOptions = {},
): Array<ColumnDef<any>> {
  const leadStatusLabelByValue = new Map(
    (options.leadStatusOptions ?? []).map((option) => [option.value, option.label]),
  )
  const leadSourceLabelByValue = new Map(
    (options.leadSourceOptions ?? []).map((option) => [option.value, option.label]),
  )

  return [
    {
      accessorKey: 'title',
      header: 'Title',
      meta: { cell: { variant: 'short-text' } },
      enableSorting: true,
      size: 220,
    },
    {
      id: 'company_name',
      accessorFn: (row) => row.company_name ?? '',
      header: 'Company',
      meta: {
        cell: {
          variant: 'relation',
          dataSourceId: 'companies',
        },
      },
      sortingFn: (rowA, rowB, columnId) =>
        getRelationLabel(rowA.getValue(columnId)).localeCompare(
          getRelationLabel(rowB.getValue(columnId)),
        ),
      enableSorting: true,
      size: 180,
    },
    {
      id: 'lead_status',
      accessorFn: (row) => getEnumValue(row.lead_status),
      header: 'Status',
      meta: {
        cell: {
          variant: 'status',
          options: options.leadStatusOptions ?? [],
        },
      },
      sortingFn: (rowA, rowB, columnId) => {
        const leftValue = String(rowA.getValue(columnId) ?? '')
        const rightValue = String(rowB.getValue(columnId) ?? '')
        const leftLabel = leadStatusLabelByValue.get(leftValue) ?? leftValue
        const rightLabel = leadStatusLabelByValue.get(rightValue) ?? rightValue

        return leftLabel.localeCompare(rightLabel)
      },
      enableSorting: true,
      size: 140,
    },
    {
      id: 'lead_source',
      accessorFn: (row) => getEnumValue(row.lead_source),
      header: 'Source',
      meta: {
        cell: {
          variant: 'enum',
          appSlug: 'base_crm',
          dataSourceSlug: 'leads',
          fieldSlug: 'lead_source',
          options: options.leadSourceOptions ?? [],
        },
      },
      sortingFn: (rowA, rowB, columnId) => {
        const leftValue = String(rowA.getValue(columnId) ?? '')
        const rightValue = String(rowB.getValue(columnId) ?? '')
        const leftLabel = leadSourceLabelByValue.get(leftValue) ?? leftValue
        const rightLabel = leadSourceLabelByValue.get(rightValue) ?? rightValue

        return leftLabel.localeCompare(rightLabel)
      },
      enableSorting: true,
      size: 150,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      meta: { cell: { variant: 'email' } },
      enableSorting: true,
      size: 200,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      meta: { cell: { variant: 'phone' } },
      enableSorting: true,
      size: 140,
    },
    {
      accessorKey: 'created_on',
      header: 'Created',
      meta: { cell: { variant: 'datetime' } },
      enableSorting: true,
      size: 180,
    },
  ]
}
