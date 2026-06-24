import { TAILWIND_COLOR_FAMILIES } from './tailwind-colors'

export interface AvatarFieldMapping {
  iconField?: string | null;
  colorField?: string | null;
  imageField?: string | null;
}

export interface ResolvedAvatarFieldMapping {
  iconField: string;
  colorField: string;
  imageField: string;
}

export interface AvatarImageValue {
  id?: string;
  file_name?: string;
  signed_url?: string | null;
  file_type?: string;
  file_size?: number;
  source?: string;
  [key: string]: unknown;
}

export interface AvatarFieldValue {
  icon: string | null;
  color: string | null;
  image: AvatarImageValue | null;
}

export {
  TAILWIND_COLOR_FAMILIES,
  TAILWIND_HEX,
  resolveColorHex as resolveColorCssValue
} from './tailwind-colors'

export const TAILWIND_AVATAR_COLOR_LEVELS = [200, 500] as const

export const TAILWIND_AVATAR_COLORS = TAILWIND_COLOR_FAMILIES.flatMap(name => TAILWIND_AVATAR_COLOR_LEVELS.map(level => `${name}-${level}`))

export const DEFAULT_AVATAR_FIELDS: ResolvedAvatarFieldMapping = {
  iconField: 'icon',
  colorField: 'color',
  imageField: 'image'
}

export const EMPTY_AVATAR_VALUE: AvatarFieldValue = {
  icon: null,
  color: null,
  image: null
}

const EMOJI_RE =
  /^(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji}\uFE0F)(?:\u200D(?:\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji}\uFE0F))*$/u

export function resolveAvatarFieldMapping(
  mapping?: AvatarFieldMapping | null
): ResolvedAvatarFieldMapping {
  return {
    iconField: mapping?.iconField?.trim() || DEFAULT_AVATAR_FIELDS.iconField,
    colorField: mapping?.colorField?.trim() || DEFAULT_AVATAR_FIELDS.colorField,
    imageField: mapping?.imageField?.trim() || DEFAULT_AVATAR_FIELDS.imageField
  }
}

export function isEmojiIcon(value: string): boolean {
  return EMOJI_RE.test(value)
}

export function getTailwindColorLevel(color: string): number | null {
  const match = color.trim().match(/-(\d{2,3})$/)

  if (!match?.[1]) return null
  const level = Number.parseInt(match[1], 10)

  return Number.isNaN(level) ? null : level
}

function normalizeImage(value: unknown): AvatarImageValue | null {
  if (!value || typeof value !== 'object') return null

  const obj = value as Record<string, unknown>

  if ('signed_url' in obj || 'file_name' in obj || 'id' in obj) {
    return obj
  }

  return null
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}

export function normalizeAvatarValue(
  value?: Partial<AvatarFieldValue> | null
): AvatarFieldValue {
  return {
    icon: toStringOrNull(value?.icon),
    color: toStringOrNull(value?.color),
    image: normalizeImage(value?.image)
  }
}

export function extractAvatarValue(
  source: Record<string, unknown> | null | undefined,
  mapping?: AvatarFieldMapping | null
): AvatarFieldValue {
  if (!source) return { ...EMPTY_AVATAR_VALUE }

  const fields = resolveAvatarFieldMapping(mapping)

  return normalizeAvatarValue({
    icon: source[fields.iconField] as string | null,
    color: source[fields.colorField] as string | null,
    image: source[fields.imageField] as AvatarImageValue | null
  })
}

export function buildAvatarPayload(
  value: AvatarFieldValue,
  mapping?: AvatarFieldMapping | null
): Record<string, unknown> {
  const fields = resolveAvatarFieldMapping(mapping)

  return {
    [fields.iconField]: value.icon ?? null,
    [fields.colorField]: value.color ?? null,
    [fields.imageField]: value.image ?? null
  }
}
