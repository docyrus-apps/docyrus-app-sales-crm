import type { ColumnDef } from '@tanstack/react-table'

export function getDealsColumns(): Array<ColumnDef<any>> {
  return [
    {
      id: 'stage',
      accessorFn: (row) =>
        typeof row.stage === 'object'
          ? (row.stage?.name ?? '')
          : (row.stage ?? ''),
      header: 'Stage',
      meta: { cell: { variant: 'short-text' } },
      enableSorting: true,
      size: 140,
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
      id: 'organizations',
      accessorFn: (row) =>
        typeof row.organizations === 'object'
          ? (row.organizations?.name ?? '')
          : (row.organizations ?? ''),
      header: 'Company',
      meta: { cell: { variant: 'short-text' } },
      enableSorting: true,
      size: 180,
    },
    {
      id: 'contact_person',
      accessorFn: (row) =>
        typeof row.contact_person === 'object'
          ? (row.contact_person?.name ?? '')
          : (row.contact_person ?? ''),
      header: 'Contact',
      meta: { cell: { variant: 'short-text' } },
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
