import type { ColumnDef } from '@tanstack/react-table'

export function getCompaniesColumns(): Array<ColumnDef<any>> {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      meta: { cell: { variant: 'short-text' } },
      enableSorting: true,
      size: 220,
    },
    {
      id: 'industry',
      accessorFn: (row) =>
        typeof row.industry === 'object'
          ? (row.industry?.name ?? '')
          : (row.industry ?? ''),
      header: 'Industry',
      meta: { cell: { variant: 'short-text' } },
      enableSorting: true,
      size: 160,
    },
    {
      id: 'status',
      accessorFn: (row) =>
        typeof row.status === 'object'
          ? (row.status?.name ?? '')
          : (row.status ?? ''),
      header: 'Status',
      meta: { cell: { variant: 'short-text' } },
      enableSorting: true,
      size: 120,
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
      id: 'city',
      accessorFn: (row) =>
        typeof row.city === 'object'
          ? (row.city?.name ?? '')
          : (row.city ?? ''),
      header: 'City',
      meta: { cell: { variant: 'short-text' } },
      enableSorting: true,
      size: 130,
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
