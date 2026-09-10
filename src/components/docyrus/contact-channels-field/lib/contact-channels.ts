// @ts-nocheck
/* eslint-disable */
import {
  AtSign,
  Briefcase,
  Building2,
  Camera,
  Globe,
  Hash,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  PhoneCall,
  Printer,
  Send,
  Share2,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'

import {
  DEFAULT_CONSENT_KEY,
  type ChannelKind,
  type ChannelType,
  type ConsentCache,
  type ConsentMedium,
  type ConsentPurpose,
  type ConsentStatus,
  type ContactChannel,
  type ValidationStatus,
} from '../types'

export const CHANNEL_KINDS: ChannelKind[] = [
  'email',
  'phone',
  'messaging',
  'social',
  'web',
]

export const CHANNEL_TYPES: ChannelType[] = [
  'email',
  'mobile',
  'landline',
  'sms',
  'fax',
  'whatsapp',
  'telegram',
  'signal',
  'linkedin',
  'x',
  'instagram',
  'facebook',
  'website',
  'other',
]

export const CONSENT_PURPOSES: ConsentPurpose[] = [
  'marketing',
  'transactional',
  'newsletter',
]

export const CONSENT_MEDIUMS: ConsentMedium[] = [
  'email',
  'sms',
  'call',
  'whatsapp',
  'telegram',
  'other',
]

export const CHANNEL_LABEL_SUGGESTIONS = [
  'work',
  'personal',
  'home',
  'billing',
  'other',
] as const

/** Which {@link ChannelType}s belong to each {@link ChannelKind}. */
export const CHANNEL_TYPES_BY_KIND: Record<ChannelKind, ChannelType[]> = {
  email: ['email'],
  phone: ['mobile', 'landline', 'fax'],
  messaging: ['sms', 'whatsapp', 'telegram', 'signal'],
  social: ['linkedin', 'x', 'instagram', 'facebook'],
  web: ['website', 'other'],
}

/** Best-fit {@link ChannelKind} for a {@link ChannelType}. */
export function kindForType(type: ChannelType): ChannelKind {
  for (const kind of CHANNEL_KINDS) {
    if (CHANNEL_TYPES_BY_KIND[kind].includes(type)) return kind
  }

  return 'web'
}

/**
 * Allowed consent mediums per channel type. A type absent from this map accepts
 * any medium; a null/omitted medium (medium-agnostic) is always allowed.
 */
export const MEDIUMS_BY_CHANNEL_TYPE: Partial<
  Record<ChannelType, ConsentMedium[]>
> = {
  email: ['email'],
  mobile: ['call', 'sms'],
  landline: ['call'],
  sms: ['sms'],
  whatsapp: ['whatsapp'],
  telegram: ['telegram'],
}

/** Whether a medium may be recorded against a channel of the given type. */
export function isMediumAllowed(
  type: ChannelType,
  medium: ConsentMedium | null | undefined,
): boolean {
  if (medium == null) return true

  const allowed = MEDIUMS_BY_CHANNEL_TYPE[type]

  return !allowed || allowed.includes(medium)
}

/** Mediums selectable for a channel type (empty array → any medium allowed). */
export function allowedMediums(type: ChannelType): ConsentMedium[] {
  return MEDIUMS_BY_CHANNEL_TYPE[type] ?? CONSENT_MEDIUMS
}

export const CHANNEL_TYPE_ICONS: Record<ChannelType, LucideIcon> = {
  email: Mail,
  mobile: Smartphone,
  landline: PhoneCall,
  sms: MessageSquare,
  fax: Printer,
  whatsapp: MessageCircle,
  telegram: Send,
  signal: MessageCircle,
  linkedin: Briefcase,
  x: AtSign,
  instagram: Camera,
  facebook: Share2,
  website: Globe,
  other: Hash,
}

export const CHANNEL_KIND_ICONS: Record<ChannelKind, LucideIcon> = {
  email: Mail,
  phone: Phone,
  messaging: MessageCircle,
  social: AtSign,
  web: Globe,
}

/** Icon per consent medium (`_default`/medium-agnostic uses a generic shield-less mail-agnostic glyph). */
export const CONSENT_MEDIUM_ICONS: Record<ConsentMedium, LucideIcon> = {
  email: Mail,
  sms: MessageSquare,
  call: Phone,
  whatsapp: MessageCircle,
  telegram: Send,
  other: Hash,
}

export function iconForType(type: ChannelType): LucideIcon {
  return CHANNEL_TYPE_ICONS[type] ?? Hash
}

export function iconForKind(kind: ChannelKind): LucideIcon {
  return CHANNEL_KIND_ICONS[kind] ?? Building2
}

export function iconForMedium(medium: ConsentMedium): LucideIcon {
  return CONSENT_MEDIUM_ICONS[medium] ?? Hash
}

const TITLE_OVERRIDES: Record<string, string> = {
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  x: 'X',
  linkedin: 'LinkedIn',
  url: 'URL',
}

/** Human label for an enum slug (`opted_in` → `Opted in`, `sms` → `SMS`). */
export function humanizeEnum(value: string): string {
  if (TITLE_OVERRIDES[value]) return TITLE_OVERRIDES[value]

  const spaced = value.replace(/_/g, ' ')

  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export type StatusTone = 'success' | 'warning' | 'danger' | 'muted' | 'info'

export const VALIDATION_STATUS_TONE: Record<ValidationStatus, StatusTone> = {
  valid: 'success',
  invalid: 'danger',
  risky: 'warning',
  unknown: 'muted',
  disposable: 'warning',
  catch_all: 'warning',
  pending: 'info',
}

export const CONSENT_STATUS_TONE: Record<ConsentStatus, StatusTone> = {
  opted_in: 'success',
  opted_out: 'danger',
  unknown: 'muted',
}

/** Tailwind class set for a status tone (border + text + subtle bg). */
export const STATUS_TONE_CLASSES: Record<StatusTone, string> = {
  success:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning:
    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  danger: 'border-destructive/30 bg-destructive/10 text-destructive',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  muted: 'border-border bg-muted text-muted-foreground',
}

/** Text-only color per status tone (no border / background), for inline value labels. */
export const STATUS_TONE_TEXT_CLASSES: Record<StatusTone, string> = {
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-500',
  danger: 'text-destructive',
  info: 'text-sky-600 dark:text-sky-400',
  muted: 'text-muted-foreground',
}

/** Verbose consent label used in the brand-consent read view (`opted_in` → `Allowed`). */
export const CONSENT_STATUS_ALLOW_LABEL: Record<ConsentStatus, string> = {
  opted_in: 'Allowed',
  opted_out: 'Opted out',
  unknown: 'Unknown',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^\+?[0-9\s().-]{6,}$/
const URL_RE = /^(https?:\/\/)?[\w-]+(\.[\w-]+)+([/?#][^\s]*)?$/i

/** Normalize a raw input for a channel type (email lower-cased; others trimmed). */
export function normalizeChannelValue(type: ChannelType, raw: string): string {
  const trimmed = raw.trim()

  if (type === 'email') return trimmed.toLowerCase()

  return trimmed
}

/** Returns a validation message for a channel value, or `null` when it looks valid. */
export function validateChannelValue(
  type: ChannelType,
  value: string,
): string | null {
  const v = value.trim()

  if (!v) return 'A value is required.'

  switch (type) {
    case 'email':
      return EMAIL_RE.test(v) ? null : 'Enter a valid email address.'

    case 'mobile':

    case 'landline':

    case 'sms':

    case 'fax':
      return PHONE_RE.test(v) ? null : 'Enter a valid phone number.'

    case 'website':
      return URL_RE.test(v) ? null : 'Enter a valid URL.'

    default:
      return null
  }
}

/**
 * Resolve the cached consent entry for a (brand, medium, purpose) triple, using
 * `_default` sentinels for organization-wide / medium-agnostic lookups.
 */
export function readConsent(
  channel: Pick<ContactChannel, 'consent'>,
  purpose: ConsentPurpose,
  options?: { brandId?: string | null; medium?: ConsentMedium | null },
): ConsentStatus | null {
  const brandKey = options?.brandId ?? DEFAULT_CONSENT_KEY
  const mediumKey = options?.medium ?? DEFAULT_CONSENT_KEY
  const entry = channel.consent?.[brandKey]?.[mediumKey]?.[purpose]

  return entry?.status ?? null
}

/** Flatten the consent cache into a sortable list for display. */
export interface FlatConsent {
  brandKey: string
  mediumKey: string
  purpose: ConsentPurpose
  status: ConsentStatus
  on?: string | null
  source?: string | null
}

export function flattenConsent(
  consent: ConsentCache | undefined,
): FlatConsent[] {
  if (!consent) return []

  const rows: FlatConsent[] = []

  for (const [brandKey, mediumMap] of Object.entries(consent)) {
    for (const [mediumKey, purposeMap] of Object.entries(mediumMap)) {
      for (const [purpose, entry] of Object.entries(purposeMap)) {
        if (!entry) continue

        rows.push({
          brandKey,
          mediumKey,
          purpose: purpose as ConsentPurpose,
          status: entry.status,
          on: entry.on,
          source: entry.source,
        })
      }
    }
  }

  return rows
}

/** Mediums shown (in order) in the compact consent summary row. */
export const CONSENT_SUMMARY_MEDIUMS: Array<{
  medium: ConsentMedium
  label: string
}> = [
  { medium: 'email', label: 'Email' },
  { medium: 'call', label: 'Phone' },
  { medium: 'whatsapp', label: 'WhatsApp' },
  { medium: 'sms', label: 'SMS' },
]

/**
 * Aggregate a brand's consent status per medium across every channel: any
 * `opted_in` wins, then any `opted_out`, otherwise `unknown`. Drives the compact
 * consent summary dots.
 */
export function summarizeBrandConsent(
  channels: Array<Pick<ContactChannel, 'consent'>>,
  brandKey: string,
): Record<ConsentMedium, ConsentStatus> {
  const result = {} as Record<ConsentMedium, ConsentStatus>

  for (const { medium } of CONSENT_SUMMARY_MEDIUMS) {
    let optedIn = false
    let optedOut = false

    for (const channel of channels) {
      const purposeMap = channel.consent?.[brandKey]?.[medium]

      if (!purposeMap) continue

      for (const entry of Object.values(purposeMap)) {
        if (entry?.status === 'opted_in') optedIn = true
        else if (entry?.status === 'opted_out') optedOut = true
      }
    }

    result[medium] = optedIn ? 'opted_in' : optedOut ? 'opted_out' : 'unknown'
  }

  return result
}

/** Stable id generator that tolerates non-secure contexts. */
export function newId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `tmp-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

/** Display text for a channel value (falls back to raw input). */
export function channelDisplayValue(
  channel: Pick<ContactChannel, 'value' | 'value_raw'>,
): string {
  return channel.value_raw?.trim() || channel.value
}
