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

interface DealsKanbanViewProps {
  deals: Array<any>
}

function getStageName(deal: any): string {
  if (!deal.stage) return 'No Stage'
  return typeof deal.stage === 'object'
    ? deal.stage.name || 'No Stage'
    : deal.stage
}

export function DealsKanbanView({ deals }: DealsKanbanViewProps) {
  const initialColumns = useMemo(() => {
    const grouped: Record<string, Array<any>> = {}
    for (const deal of deals) {
      const stage = getStageName(deal)
      if (!grouped[stage]) grouped[stage] = []
      grouped[stage].push(deal)
    }
    return grouped
  }, [deals])

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
            {items.map((deal: any) => (
              <KanbanItem key={deal.id} value={deal.id} asHandle>
                <Link to="/deals/$dealId" params={{ dealId: deal.id }}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm truncate">
                        Deal #{deal.id.slice(0, 8)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm font-medium">
                        $
                        {deal.deal_value?.toLocaleString() ||
                          deal.expected_revenue?.toLocaleString() ||
                          0}
                      </p>
                      {deal.organizations &&
                        typeof deal.organizations === 'object' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {deal.organizations.name}
                          </p>
                        )}
                      {deal.contact_person &&
                        typeof deal.contact_person === 'object' && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {deal.contact_person.name}
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
