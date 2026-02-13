import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
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

interface LeadsKanbanViewProps {
  leads: Array<any>
}

function getLeadStatusName(lead: any): string {
  if (!lead.lead_status) return 'No Status'
  return typeof lead.lead_status === 'object'
    ? lead.lead_status.name || 'No Status'
    : lead.lead_status
}

export function LeadsKanbanView({ leads }: LeadsKanbanViewProps) {
  const initialColumns = useMemo(() => {
    const grouped: Record<string, Array<any>> = {}
    for (const lead of leads) {
      const status = getLeadStatusName(lead)
      grouped[status] ??= []
      grouped[status].push(lead)
    }
    return grouped
  }, [leads])

  const [columns, setColumns] =
    useState<Record<UniqueIdentifier, Array<any>>>(initialColumns)

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
            {items.map((lead: any) => (
              <KanbanItem key={lead.id} value={lead.id} asHandle>
                <Link to="/leads/$leadId" params={{ leadId: lead.id }}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm truncate">
                        {lead.title || `Lead #${lead.id.slice(0, 8)}`}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {lead.company_name && (
                        <p className="text-xs font-medium">
                          {typeof lead.company_name === 'object'
                            ? lead.company_name.name
                            : lead.company_name}
                        </p>
                      )}
                      {lead.lead_source && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Source:{' '}
                          {typeof lead.lead_source === 'object'
                            ? lead.lead_source.name
                            : lead.lead_source}
                        </p>
                      )}
                      {lead.email && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {lead.email}
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
