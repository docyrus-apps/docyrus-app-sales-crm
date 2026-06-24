'use client'

// @ts-nocheck
/* eslint-disable */
import { type ComponentType, type ReactNode } from 'react'

import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Bookmark,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  Cloud,
  Code,
  Cog,
  Copy,
  CreditCard,
  Download,
  Edit,
  ExternalLink,
  File,
  FileText,
  Filter,
  Folder,
  Globe,
  Heart,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  Lock,
  type LucideProps,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Pause,
  Phone,
  Play,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  Star,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Trash,
  Upload,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import {
  type AdaptiveCardIcon,
  type AdaptiveCardIconSize,
  type AdaptiveCardSelectAction,
} from '../adaptive-card-types'

import { useAdaptiveCardContext } from '../adaptive-card-context'
import { getTextColorClass } from '../lib/color-tokens'

/*
 * Adaptive Cards 1.6 references Fluent UI icon names. We don't ship the Fluent
 * icon set, so we map the most common AC/Fluent names to Lucide equivalents.
 * Unknown names fall through to a generic placeholder (Circle) plus a console
 * warning in development. Hosts that need full Fluent parity can register a
 * customElements override.
 */
const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  alert: AlertCircle,
  alertcircle: AlertCircle,
  warning: AlertTriangle,
  alerttriangle: AlertTriangle,
  bell: Bell,
  notification: Bell,
  bookmark: Bookmark,
  calendar: Calendar,
  check: Check,
  checkmark: Check,
  checkcircle: CheckCircle,
  chevrondown: ChevronDown,
  chevronleft: ChevronLeft,
  chevronright: ChevronRight,
  chevronup: ChevronUp,
  circle: Circle,
  clock: Clock,
  time: Clock,
  cloud: Cloud,
  code: Code,
  cog: Cog,
  copy: Copy,
  creditcard: CreditCard,
  payment: CreditCard,
  download: Download,
  edit: Edit,
  pencil: Edit,
  externallink: ExternalLink,
  open: ExternalLink,
  file: File,
  filetext: FileText,
  document: FileText,
  filter: Filter,
  folder: Folder,
  globe: Globe,
  heart: Heart,
  favorite: Heart,
  helpcircle: HelpCircle,
  help: HelpCircle,
  home: Home,
  image: ImageIcon,
  picture: ImageIcon,
  info: Info,
  information: Info,
  link: LinkIcon,
  lock: Lock,
  mail: Mail,
  email: Mail,
  mappin: MapPin,
  location: MapPin,
  menu: Menu,
  message: MessageSquare,
  chat: MessageSquare,
  moon: Moon,
  more: MoreHorizontal,
  pause: Pause,
  phone: Phone,
  call: Phone,
  play: Play,
  plus: Plus,
  add: Plus,
  search: Search,
  send: Send,
  settings: Settings,
  gear: Settings,
  shield: Shield,
  star: Star,
  sun: Sun,
  thumbsdown: ThumbsDown,
  thumbsup: ThumbsUp,
  like: ThumbsUp,
  trash: Trash,
  delete: Trash,
  upload: Upload,
  user: User,
  person: User,
  users: Users,
  group: Users,
  x: X,
  close: X,
  cancel: X,
  zap: Zap,
  bolt: Zap,
}

function resolveIcon(name: string | undefined): ComponentType<LucideProps> {
  if (!name) return Circle
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  const Icon = ICON_MAP[key]

  if (!Icon) {
    if (process.env.NODE_ENV !== 'production' && name) {
      console.warn(
        `[AdaptiveCard] Unknown icon "${name}". Falling back to Circle. See icon-element.tsx ICON_MAP.`,
      )
    }

    return Circle
  }

  return Icon
}

export function renderLucideIcon(name: string, className?: string): ReactNode {
  const Icon = resolveIcon(name)

  return (
    <Icon className={cn('size-4 shrink-0', className)} aria-hidden="true" />
  )
}

const SIZE_CLASS: Record<AdaptiveCardIconSize, string> = {
  xxSmall: 'size-2.5',
  xSmall: 'size-3',
  small: 'size-3.5',
  standard: 'size-4',
  medium: 'size-5',
  large: 'size-6',
  xLarge: 'size-8',
  xxLarge: 'size-10',
}

function dispatchSelect(
  ctx: ReturnType<typeof useAdaptiveCardContext>,
  action: AdaptiveCardSelectAction,
): void {
  if (action.type === 'Action.OpenUrl') ctx.openUrl(action)
  else if (action.type === 'Action.Submit') ctx.submit(action)
  else if (action.type === 'Action.Execute') ctx.execute(action)
  else if (action.type === 'Action.ToggleVisibility')
    ctx.toggleVisibility(action)
  else if (action.type === 'Action.ResetInputs') ctx.resetInputs(action)
}

export function IconElement({ element }: { element: AdaptiveCardIcon }) {
  const ctx = useAdaptiveCardContext()
  const sizeClass = SIZE_CLASS[element.size ?? 'standard']
  const colorClass = getTextColorClass(element.color)
  const fillClass = element.style === 'filled' ? 'fill-current' : ''

  const icon = renderLucideIcon(
    element.name,
    cn(sizeClass, colorClass, fillClass, 'shrink-0'),
  )

  const { selectAction } = element

  if (selectAction) {
    return (
      <button
        type="button"
        aria-label={selectAction.title ?? element.name}
        className="inline-flex cursor-pointer items-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => dispatchSelect(ctx, selectAction)}
      >
        {icon}
      </button>
    )
  }

  return icon
}
