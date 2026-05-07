'use client'

import { type LucideIcon } from 'lucide-react'

import {
  ActivityIcon,
  ArrowRightLeftIcon,
  CalendarIcon,
  CheckSquareIcon,
  MailIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  PhoneIcon,
  PlusCircleIcon,
  RefreshCwIcon,
} from 'lucide-react'

import { type ActivityType } from './types'

export interface ActivityTypeConfig {
  icon: LucideIcon
  label: string
  colorClass: string
  bgClass: string
  compact?: boolean
}

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, ActivityTypeConfig> = {
  call: {
    icon: PhoneIcon,
    label: 'Call',
    colorClass: 'text-green-500',
    bgClass: 'bg-green-500/10',
  },
  meeting: {
    icon: CalendarIcon,
    label: 'Meeting',
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10',
  },
  email: {
    icon: MailIcon,
    label: 'Email',
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/10',
  },
  status_update: {
    icon: ArrowRightLeftIcon,
    label: 'Status Update',
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10',
  },
  task: {
    icon: CheckSquareIcon,
    label: 'Task',
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500/10',
  },
  chat: {
    icon: MessageSquareIcon,
    label: 'Chat',
    colorClass: 'text-cyan-500',
    bgClass: 'bg-cyan-500/10',
  },
  trace: {
    icon: ActivityIcon,
    label: 'Trace',
    colorClass: 'text-gray-400',
    bgClass: 'bg-gray-400/10',
  },
  comment: {
    icon: MessageCircleIcon,
    label: 'Comment',
    colorClass: 'text-indigo-500',
    bgClass: 'bg-indigo-500/10',
  },
  record_create: {
    icon: PlusCircleIcon,
    label: 'Created',
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
    compact: true,
  },
  record_update: {
    icon: RefreshCwIcon,
    label: 'Updated',
    colorClass: 'text-sky-500',
    bgClass: 'bg-sky-500/10',
    compact: true,
  },
}

export const ALL_ACTIVITY_TYPES: Array<ActivityType> = [
  'call',
  'meeting',
  'email',
  'status_update',
  'task',
  'chat',
  'trace',
  'comment',
]

export const RECORD_ACTIVITY_TYPES: Array<ActivityType> = [
  'record_create',
  'record_update',
]

export function getActivityTypeConfig(type: ActivityType): ActivityTypeConfig {
  return ACTIVITY_TYPE_CONFIG[type]
}

export function isCompactActivity(type: ActivityType): boolean {
  return ACTIVITY_TYPE_CONFIG[type]?.compact === true
}
