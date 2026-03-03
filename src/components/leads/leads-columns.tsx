import type { ColumnDef } from '@tanstack/react-table'

export function getLeadsColumns(): Array<ColumnDef<any>> {
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
      accessorFn: (row) =>
        typeof row.company_name === 'object'
          ? (row.company_name?.name ?? '')
          : (row.company_name ?? ''),
      header: 'Company',
      meta: { cell: { variant: 'short-text' } },
      enableSorting: true,
      size: 180,
    },
    {
      id: 'lead_status',
      accessorFn: (row) =>
        typeof row.lead_status === 'object'
          ? (row.lead_status?.name ?? '')
          : (row.lead_status ?? ''),
      header: 'Status',
      meta: { cell: { variant: 'short-text' } },
      enableSorting: true,
      size: 130,
    },
    {
      id: 'lead_source',
      accessorFn: (row) =>
        typeof row.lead_source === 'object'
          ? (row.lead_source?.name ?? '')
          : (row.lead_source ?? ''),
      header: 'Source',
      meta: { cell: { variant: 'short-text' } },
      enableSorting: true,
      size: 130,
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
      meta: { cell: { variant: 'date' } },
      enableSorting: true,
      size: 130,
    },
  ]
}
