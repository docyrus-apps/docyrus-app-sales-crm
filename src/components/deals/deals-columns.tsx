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

interface DealsColumnOptions {
  stageOptions?: Array<CellSelectOption>
}

export function getDealsColumns(
  options: DealsColumnOptions = {},
): Array<ColumnDef<any>> {
  const stageLabelByValue = new Map(
    (options.stageOptions ?? []).map((option) => [option.value, option.label]),
  )

  return [
    {
      id: 'stage',
      accessorFn: (row) => getEnumValue(row.stage),
      header: 'Stage',
      meta: {
        cell: {
          variant: 'status',
          options: options.stageOptions ?? [],
        },
      },
      sortingFn: (rowA, rowB, columnId) => {
        const leftValue = String(rowA.getValue(columnId) ?? '')
        const rightValue = String(rowB.getValue(columnId) ?? '')
        const leftLabel = stageLabelByValue.get(leftValue) ?? leftValue
        const rightLabel = stageLabelByValue.get(rightValue) ?? rightValue

        return leftLabel.localeCompare(rightLabel)
      },
      enableSorting: true,
      size: 160,
    },
    {
      accessorKey: 'deal_value',
      header: 'Value',
      meta: { cell: { variant: 'currency' } },
      enableSorting: true,
      size: 140,
    },
    {
      accessorKey: 'expected_revenue',
      header: 'Expected Revenue',
      meta: { cell: { variant: 'currency' } },
      enableSorting: true,
      size: 180,
    },
    {
      id: 'organization',
      accessorFn: (row) => row.organization ?? '',
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
      id: 'contact_person',
      accessorFn: (row) => row.contact_person ?? '',
      header: 'Contact',
      meta: {
        cell: {
          variant: 'relation',
          dataSourceId: 'contacts',
        },
      },
      sortingFn: (rowA, rowB, columnId) =>
        getRelationLabel(rowA.getValue(columnId)).localeCompare(
          getRelationLabel(rowB.getValue(columnId)),
        ),
      enableSorting: true,
      size: 160,
    },
    {
      accessorKey: 'close_probability',
      header: 'Probability',
      meta: { cell: { variant: 'percent' } },
      enableSorting: true,
      size: 120,
    },
    {
      accessorKey: 'expected_closing_date',
      header: 'Close Date',
      meta: { cell: { variant: 'date' } },
      enableSorting: true,
      size: 130,
    },
  ]
}
