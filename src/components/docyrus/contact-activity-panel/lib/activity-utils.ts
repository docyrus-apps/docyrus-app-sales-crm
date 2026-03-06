import { type ContactActivity } from '../types'

export {
  formatRelativeTime,
  getUserDisplayName,
  getUserInitials,
} from '@/components/docyrus/team-chat-channel/lib/post-utils'

export { formatDate } from '@/components/docyrus/record-activity-panel/lib/format'

export function getActivityMetadataSummary(activity: ContactActivity): string {
  const m = activity.metadata

  switch (activity.type) {
    case 'call': {
      const dir = m.direction === 'inbound' ? 'Inbound' : 'Outbound'
      const dur = m.duration ? ` \u00b7 ${m.duration} min` : ''

      return `${dir}${dur}`
    }

    case 'meeting':
      return m.location ? `${m.location}` : ''

    case 'email':
      return m.to ? `To: ${m.to}` : ''

    case 'status_update':
      return `${m.from_status ?? '?'} \u2192 ${m.to_status ?? '?'}`

    case 'task': {
      const parts: Array<string> = []

      if (m.priority) parts.push(`${m.priority}`)
      if (m.due_date) parts.push(`Due: ${m.due_date}`)

      return parts.join(' \u00b7 ')
    }

    case 'chat':
      return m.channel_name ? `#${m.channel_name}` : ''

    case 'trace':
      return [m.event_type, m.url].filter(Boolean).join(' \u00b7 ')

    case 'comment':
      return m.record_name ? `on ${m.record_name}` : ''

    case 'record_create':

    case 'record_update':
      return m.record_name ? `${m.record_name}` : ''

    default:
      return ''
  }
}

interface DateGroup {
  label: string
  items: Array<ContactActivity>
}

export function groupActivitiesByDate(
  activities: Array<ContactActivity>,
): Array<DateGroup> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86_400_000)
  const weekAgo = new Date(today.getTime() - 7 * 86_400_000)

  const groups: Record<string, Array<ContactActivity>> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  }

  for (const activity of activities) {
    const d = new Date(activity.created_on)

    if (d >= today) groups.Today.push(activity)
    else if (d >= yesterday) groups.Yesterday.push(activity)
    else if (d >= weekAgo) groups['This Week'].push(activity)
    else groups.Older.push(activity)
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }))
}
