import type { ColumnDef } from '@tanstack/react-table'

export function getContactsColumns(): Array<ColumnDef<any>> {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      meta: { cell: { variant: 'short-text' } },
      enableSorting: true,
      size: 200,
    },
    {
      accessorKey: 'job_title',
      header: 'Job Title',
      meta: { cell: { variant: 'short-text' } },
      enableSorting: true,
      size: 180,
    },
    {
      id: 'organization',
      accessorFn: (row) =>
        typeof row.organization === 'object'
          ? (row.organization?.name ?? '')
          : (row.organization ?? ''),
      header: 'Organization',
      meta: { cell: { variant: 'short-text' } },
      enableSorting: true,
      size: 180,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      meta: { cell: { variant: 'email' } },
      enableSorting: true,
      size: 200,
    },
    {
      accessorKey: 'mobile',
      header: 'Mobile',
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
