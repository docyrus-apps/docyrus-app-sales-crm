import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from '@tanstack/react-router'
import { Building2, Plus, Trash2 } from 'lucide-react'
import type { RowChange } from '@/components/docyrus/data-grid'
import type { ViewType } from '@/components/view-switcher'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/animate-ui/components/buttons/button'
import {
  useCompanies,
  useDeleteCompany,
  useUpdateCompany,
} from '@/hooks/use-companies'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CompanyFormDialog } from '@/components/companies/company-form-dialog'
import { DataGridStandardToolbar } from '@/components/docyrus/data-grid-standard-toolbar'
import { RecordDeleteConfirmDialog } from '@/components/docyrus/record-delete-confirm-dialog'
import { getDataGridRowActionsColumn } from '@/components/docyrus/data-grid-row-actions-column'
import { ViewSwitcher } from '@/components/view-switcher'
import {
  DataGrid,
  DataGridSkeleton,
  DataGridSkeletonGrid,
  getDataGridSelectColumn,
  useDataGrid,
} from '@/components/docyrus/data-grid'
import { getCompaniesColumns } from '@/components/companies/companies-columns'
import { CompaniesKanbanView } from '@/components/companies/companies-kanban-view'
import {
  buildDuplicatePayload,
  saveGridChanges,
} from '@/lib/data-grid-record-utils'

export function Companies() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: companies, isLoading, error } = useCompanies()
  const deleteCompany = useDeleteCompany()
  const updateCompany = useUpdateCompany()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewType, setViewType] = useState<ViewType>('list')
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [activeCompany, setActiveCompany] = useState<any>(null)
  const [deleteTargets, setDeleteTargets] = useState<Array<any>>([])

  const onOpenCreate = useCallback(() => {
    setFormMode('create')
    setActiveCompany(null)
    setIsFormOpen(true)
  }, [])

  const onOpenEdit = useCallback((company: any) => {
    setFormMode('edit')
    setActiveCompany(company)
    setIsFormOpen(true)
  }, [])

  const onDuplicate = useCallback((company: any) => {
    setFormMode('create')
    setActiveCompany(buildDuplicatePayload(company))
    setIsFormOpen(true)
  }, [])

  const onView = useCallback(
    (company: any) => {
      if (!company?.id) return

      void navigate({
        to: '/companies/$companyId',
        params: { companyId: company.id },
        search: { tab: 'overview' },
      })
    },
    [navigate],
  )

  const onDeleteRequest = useCallback((rows: Array<any>) => {
    if (rows.length === 0) return

    setDeleteTargets(rows)
  }, [])

  const onDeleteConfirm = useCallback(async () => {
    const ids = deleteTargets
      .map((row) => row?.id)
      .filter(Boolean) as Array<string>

    await Promise.all(ids.map((id) => deleteCompany.mutateAsync(id)))
    setDeleteTargets([])
  }, [deleteCompany, deleteTargets])

  const onDeleteDialogOpenChange = useCallback((open: boolean) => {
    if (!open) setDeleteTargets([])
  }, [])

  const baseColumns = useMemo(() => getCompaniesColumns(), [])
  const columns = useMemo(
    () => [
      getDataGridSelectColumn<any>(),
      getDataGridRowActionsColumn<any>({
        onView,
        onEdit: onOpenEdit,
        onDuplicate,
        onDelete: (row) => onDeleteRequest([row]),
      }),
      ...baseColumns,
    ],
    [baseColumns, onDeleteRequest, onDuplicate, onOpenEdit, onView],
  )

  const onChangesSave = useCallback(
    async (changes: Array<RowChange>, gridData: Array<any>) => {
      await saveGridChanges(changes, gridData, (id, data) =>
        updateCompany.mutateAsync({ companyId: id, data }),
      )
    },
    [updateCompany],
  )

  const { table, ...dataGridProps } = useDataGrid({
    data: companies || [],
    columns,
    getRowId: (row: any) => row.id,
    readOnly: false,
    enableGrouping: true,
    enableChangeTracking: true,
    onChangesSave,
  })

  return (
    <>
      <PageHeader
        title={t('companies.title')}
        icon={<Building2 className="h-4 w-4 text-teal-500" />}
        actions={
          <>
            <ViewSwitcher value={viewType} onValueChange={setViewType} />
            <Button size="sm" onClick={onOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('companies.newCompany')}
            </Button>
          </>
        }
      />
      <PageContainer
        className={viewType === 'kanban' ? 'max-w-full overflow-x-auto' : ''}
      >
        <CompanyFormDialog
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open)

            if (!open) {
              setActiveCompany(null)
              setFormMode('create')
            }
          }}
          company={activeCompany ?? undefined}
          mode={formMode}
        />

        {isLoading && viewType === 'card' && (
          <div className="space-y-4">
            <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-32 w-full animate-pulse rounded-md bg-muted" />
          </div>
        )}

        {isLoading && viewType === 'list' && (
          <DataGridSkeleton>
            <DataGridSkeletonGrid />
          </DataGridSkeleton>
        )}

        {isLoading && viewType === 'kanban' && (
          <div className="flex gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-96 w-80 shrink-0 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        )}

        {error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">
                {t('companies.errorLoading')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{error.message}</p>
            </CardContent>
          </Card>
        )}

        {companies && companies.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg font-medium">{t('companies.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('companies.emptyDescription')}
              </p>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t('companies.createCompany')}
              </Button>
            </CardContent>
          </Card>
        )}

        {companies && companies.length > 0 && viewType === 'card' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {companies.map((company: any) => (
              <Link
                key={company.id}
                to="/companies/$companyId"
                params={{ companyId: company.id }}
                search={{ tab: 'overview' }}
              >
                <Card className="transition-all hover:shadow-md cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {company.name}
                        </CardTitle>
                        {company.industry && (
                          <Badge variant="secondary" className="mt-1">
                            {typeof company.industry === 'object'
                              ? company.industry.name
                              : company.industry}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {company.status && (
                      <Badge variant="outline" className="mb-2">
                        {typeof company.status === 'object'
                          ? company.status.name
                          : company.status}
                      </Badge>
                    )}
                    {company.email && (
                      <p className="text-xs text-muted-foreground">
                        {company.email}
                      </p>
                    )}
                    {company.phone && (
                      <p className="text-xs text-muted-foreground">
                        {company.phone}
                      </p>
                    )}
                    {company.city && typeof company.city === 'object' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {company.city.name}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {companies && companies.length > 0 && viewType === 'list' && (
          <>
            <DataGridStandardToolbar
              table={table}
              searchPlaceholder={t('common.search', 'Search...')}
            />
            <DataGrid
              table={table}
              {...dataGridProps}
              height={600}
              actions={[
                {
                  label: t('common.delete'),
                  icon: <Trash2 className="size-4" />,
                  variant: 'destructive',
                  onAction: onDeleteRequest,
                },
              ]}
            />
          </>
        )}

        <RecordDeleteConfirmDialog
          open={deleteTargets.length > 0}
          onOpenChange={onDeleteDialogOpenChange}
          recordCount={deleteTargets.length}
          onConfirm={onDeleteConfirm}
          isPending={deleteCompany.isPending}
        />

        {companies && companies.length > 0 && viewType === 'kanban' && (
          <CompaniesKanbanView companies={companies} />
        )}
      </PageContainer>
    </>
  )
}
