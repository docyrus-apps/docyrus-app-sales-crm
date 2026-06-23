import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from '@tanstack/react-router'
import { Building2 } from 'lucide-react'
import type { UniqueIdentifier } from '@dnd-kit/core'
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanItem,
  KanbanOverlay,
} from '@/components/ui/kanban'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CompaniesKanbanViewProps {
  companies: Array<any>
}

function getStatusName(company: any, noStatusLabel: string): string {
  if (!company.status) return noStatusLabel
  return typeof company.status === 'object'
    ? company.status.name || noStatusLabel
    : company.status
}

export function CompaniesKanbanView({ companies }: CompaniesKanbanViewProps) {
  const { t } = useTranslation()
  const noStatusLabel = t('companies.kanban.noStatus')

  const initialColumns = useMemo(() => {
    const grouped: Record<string, Array<any>> = {}
    for (const company of companies) {
      const status = getStatusName(company, noStatusLabel)
      grouped[status] ??= []
      grouped[status].push(company)
    }
    return grouped
  }, [companies, noStatusLabel])

  const [columns, setColumns] =
    useState<Record<UniqueIdentifier, Array<any>>>(initialColumns)

  // Sync when companies data changes
  useMemo(() => {
    setColumns(initialColumns)
  }, [initialColumns])

  return (
    <Kanban
      value={columns}
      onValueChange={setColumns}
      getItemValue={(item: any) => item.id}
      flatCursor
    >
      <KanbanBoard className="pb-4">
        {Object.entries(columns).map(([columnId, items]) => (
          <KanbanColumn
            key={columnId}
            value={columnId}
            className="w-80 shrink-0"
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <h3 className="text-sm font-semibold">{columnId}</h3>
              <Badge variant="secondary" className="text-xs">
                {items.length}
              </Badge>
            </div>
            {items.map((company: any) => (
              <KanbanItem key={company.id} value={company.id} asHandle>
                <Link
                  to="/companies/$companyId"
                  params={{ companyId: company.id }}
                  search={{ tab: 'overview' }}
                >
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm truncate">
                            {company.name}
                          </CardTitle>
                          {company.industry && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {typeof company.industry === 'object'
                                ? company.industry.name
                                : company.industry}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {company.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {company.email}
                        </p>
                      )}
                      {company.phone && (
                        <p className="text-xs text-muted-foreground">
                          {company.phone}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </KanbanItem>
            ))}
          </KanbanColumn>
        ))}
      </KanbanBoard>
      <KanbanOverlay />
    </Kanban>
  )
}
