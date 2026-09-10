import { useQuery } from '@tanstack/react-query'

import {
  useBaseCrmDealsCollection,
  useBaseCrmLeadsCollection,
  useBaseTaskCollection
} from '@/collections'

export interface ActivityItem {
  id: string;
  type: 'deal' | 'lead' | 'task';
  title: string;
  subtitle?: string;
  modifiedOn: string;
  modifiedBy?: string;
}

function getString(val: unknown, fallback = ''): string {
  return typeof val === 'string' ? val : fallback
}

function getNestedName(val: unknown): string | undefined {
  if (typeof val === 'object' && val !== null) {
    return getString((val as Record<string, unknown>).name) || undefined
  }

  return undefined
}

function getFullName(val: unknown): string | undefined {
  if (typeof val === 'object' && val !== null) {
    const o = val as Record<string, unknown>
    const parts = [getString(o.firstname), getString(o.lastname)].filter(
      Boolean
    )

    return parts.length > 0 ? parts.join(' ') : undefined
  }

  return undefined
}

export function useRecentActivity({ limit = 20 }: { limit?: number } = {}) {
  const dealsCollection = useBaseCrmDealsCollection()
  const leadsCollection = useBaseCrmLeadsCollection()
  const taskCollection = useBaseTaskCollection()

  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async () => {
      const [deals, leads, tasks] = await Promise.all([
        dealsCollection.list({
          columns: [
            'id',
            'organization(name)',
            'stage',
            'last_modified_on',
            'last_modified_by(firstname,lastname)'
          ],
          orderBy: 'last_modified_on desc',
          limit: 10
        }),
        leadsCollection.list({
          columns: [
            'id',
            'title',
            'lead_status',
            'last_modified_on',
            'last_modified_by(firstname,lastname)'
          ],
          orderBy: 'last_modified_on desc',
          limit: 10
        }),
        taskCollection.list({
          columns: [
            'id',
            'subject',
            'status',
            'last_modified_on',
            'last_modified_by(firstname,lastname)'
          ],
          orderBy: 'last_modified_on desc',
          limit: 10
        })
      ])

      const items: Array<ActivityItem> = []

      for (const deal of deals) {
        const d = deal as unknown as Record<string, unknown>

        items.push({
          id: deal.id,
          type: 'deal',
          title: getNestedName(d.organization) || 'Untitled Deal',
          subtitle: getNestedName(d.stage),
          modifiedOn: getString(d.last_modified_on),
          modifiedBy: getFullName(d.last_modified_by)
        })
      }

      for (const lead of leads) {
        const l = lead as unknown as Record<string, unknown>

        items.push({
          id: lead.id,
          type: 'lead',
          title: getString(l.title, 'Untitled Lead'),
          subtitle: getNestedName(l.lead_status),
          modifiedOn: getString(l.last_modified_on),
          modifiedBy: getFullName(l.last_modified_by)
        })
      }

      for (const task of tasks) {
        const t = task as unknown as Record<string, unknown>

        items.push({
          id: task.id,
          type: 'task',
          title: getString(t.subject, 'Untitled Task'),
          subtitle: getNestedName(t.status),
          modifiedOn: getString(t.last_modified_on),
          modifiedBy: getFullName(t.last_modified_by)
        })
      }

      // Sort all items by modifiedOn descending
      items.sort(
        (a, b) => new Date(b.modifiedOn).getTime() - new Date(a.modifiedOn).getTime()
      )

      return items.slice(0, limit)
    },
    refetchInterval: 60000
  })
}
