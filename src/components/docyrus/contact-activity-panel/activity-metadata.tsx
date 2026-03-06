'use client'

import { type ComponentType } from 'react'

import {
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  ClockIcon,
  GlobeIcon,
  HashIcon,
  MapPinIcon,
  UserIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'

import { type ContactActivity } from './types'
import { getActivityTypeConfig } from './activity-type-config'

interface ActivityMetadataProps {
  activity: ContactActivity
}

export function ActivityMetadata({ activity }: ActivityMetadataProps) {
  const config = getActivityTypeConfig(activity.type)
  const m = activity.metadata
  const pills = buildMetadataPills(activity.type, m)

  if (pills.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1">
      {pills.map((pill, i) => (
        <Badge
          key={i}
          variant="outline"
          className={`gap-1 border-transparent px-1.5 py-0 text-[10px] font-normal ${config.bgClass} ${config.colorClass}`}
        >
          {pill.icon && <pill.icon className="size-2.5" />}
          {pill.text}
        </Badge>
      ))}
    </div>
  )
}

interface MetadataPill {
  text: string
  icon?: ComponentType<{ className?: string }>
}

function buildMetadataPills(
  type: ContactActivity['type'],
  m: Record<string, unknown>,
): Array<MetadataPill> {
  switch (type) {
    case 'call': {
      const pills: Array<MetadataPill> = []

      if (m.direction) {
        pills.push({
          text: m.direction === 'inbound' ? 'Inbound' : 'Outbound',
          icon:
            m.direction === 'inbound' ? ArrowDownLeftIcon : ArrowUpRightIcon,
        })
      }
      if (m.duration) {
        pills.push({ text: `${m.duration} min`, icon: ClockIcon })
      }

      return pills
    }

    case 'meeting': {
      const pills: Array<MetadataPill> = []

      if (m.location) pills.push({ text: `${m.location}`, icon: MapPinIcon })
      if (m.attendee_count)
        pills.push({ text: `${m.attendee_count} attendees`, icon: UserIcon })

      return pills
    }

    case 'email':
      return m.to ? [{ text: `To: ${m.to}` }] : []

    case 'status_update':
      return m.from_status || m.to_status
        ? [{ text: `${m.from_status ?? '?'} \u2192 ${m.to_status ?? '?'}` }]
        : []

    case 'task': {
      const pills: Array<MetadataPill> = []

      if (m.priority) pills.push({ text: `${m.priority}` })
      if (m.due_date)
        pills.push({ text: `Due: ${m.due_date}`, icon: ClockIcon })
      if (m.assigned_to_name)
        pills.push({ text: `${m.assigned_to_name}`, icon: UserIcon })

      return pills
    }

    case 'chat':
      return m.channel_name
        ? [{ text: `#${m.channel_name}`, icon: HashIcon }]
        : []

    case 'trace': {
      const pills: Array<MetadataPill> = []

      if (m.event_type) pills.push({ text: `${m.event_type}` })
      if (m.url) pills.push({ text: `${m.url}`, icon: GlobeIcon })

      return pills
    }

    case 'comment':
      return m.record_name ? [{ text: `on ${m.record_name}` }] : []

    case 'record_create':

    case 'record_update':
      return []

    default:
      return []
  }
}
