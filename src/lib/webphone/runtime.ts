import type {
  WebphoneAgentProfile,
  WebphoneRuntimeSettings,
  WebrtcRuntimeConfig,
} from './types'

/**
 * Verimor / bulutsantralim WebRTC defaults — the working tenant runtime. The
 * kit is intentionally not provider-agnostic; these stay unless a different
 * provider is introduced behind its own adapter.
 */
export const DEFAULT_VERIMOR_RUNTIME: WebphoneRuntimeSettings = {
  wssUrl: 'wss://api.bulutsantralim.com:7443',
  pbxHost: 'kivateknoloji.bulutsantralim.com',
  registrarServer: '',
  realm: 'kivateknoloji.bulutsantralim.com',
  usePreloadedRoute: true,
  registerExpires: '600',
  noAnswerTimeout: '60',
  sessionTimers: false,
  sessionTimersRefreshMethod: 'UPDATE',
  sessionTimersForceRefresher: false,
  sessionTimersExpires: '90',
  iceServersJson: '[\n  { "urls": "stun:stun.l.google.com:19302" }\n]',
  extraRegisterHeaders: '',
  extraInviteHeaders: '',
  preferredAudioCodecs: 'PCMU,PCMA',
}

export function getWebphoneRuntimeSettings(
  value: Partial<WebphoneRuntimeSettings> | null | undefined,
): WebphoneRuntimeSettings {
  return {
    ...DEFAULT_VERIMOR_RUNTIME,
    ...(value ?? {}),
    // Code-managed fields: hidden from the settings form and never
    // tenant-overridable. They always take the DEFAULT_VERIMOR_RUNTIME value,
    // even if a stale value is stored under `data.webrtc`. Edit them here.
    registerExpires: DEFAULT_VERIMOR_RUNTIME.registerExpires,
    noAnswerTimeout: DEFAULT_VERIMOR_RUNTIME.noAnswerTimeout,
    preferredAudioCodecs: DEFAULT_VERIMOR_RUNTIME.preferredAudioCodecs,
    iceServersJson: DEFAULT_VERIMOR_RUNTIME.iceServersJson,
  }
}

/** username = pbx_user_id if present, else extension. */
export function resolveSipUsername(
  profile: Pick<WebphoneAgentProfile, 'pbx_user_id' | 'extension'> | null,
): string {
  return profile?.pbx_user_id?.trim() || profile?.extension?.trim() || ''
}

export function buildWebrtcRuntimeConfig(args: {
  settings: Partial<WebphoneRuntimeSettings> | null | undefined
  profile: WebphoneAgentProfile
}): WebrtcRuntimeConfig {
  const username = resolveSipUsername(args.profile)

  return {
    ...getWebphoneRuntimeSettings(args.settings),
    username,
    password: args.profile.sip_password ?? '',
    displayName: args.profile.display_name?.trim() || username,
  }
}

export function getPreferredDeviceSlug(
  profile: Pick<WebphoneAgentProfile, 'preferred_device'> | null,
): string {
  const device = profile?.preferred_device
  if (!device) return ''
  if (typeof device === 'string') return device.toLowerCase()
  return (device.slug ?? device.name ?? '').toLowerCase()
}

/** WebRTC / WebPhone both count as a browser softphone device. */
export function isWebrtcPreferred(
  profile: Pick<WebphoneAgentProfile, 'preferred_device'> | null,
): boolean {
  const slug = getPreferredDeviceSlug(profile)
  // Empty preferred_device is treated as acceptable (no explicit non-webrtc choice).
  if (!slug) return true
  return slug.includes('webrtc') || slug.includes('webphone')
}

export function isSecureContextForWebrtc(): boolean {
  if (typeof window === 'undefined') return false
  const { protocol, hostname } = window.location
  return (
    protocol === 'https:' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1'
  )
}

export type WebphoneReadinessReason =
  | 'not_authenticated'
  | 'insecure_context'
  | 'missing_profile'
  | 'profile_disabled'
  | 'webrtc_disabled'
  | 'non_webrtc_device'
  | 'missing_extension'
  | 'missing_username'
  | 'missing_password'
  | 'missing_wss'
  | 'missing_pbx_host'
  | 'missing_realm'
  | 'missing_ice'

export interface WebphoneReadinessInput {
  isAuthenticated: boolean
  isSecureContext: boolean
  settings: Partial<WebphoneRuntimeSettings> | null
  profile: WebphoneAgentProfile | null
}

export interface WebphoneReadiness {
  ready: boolean
  reasons: Array<WebphoneReadinessReason>
}

/**
 * Single source of truth for "can this agent dial". All UI gating reads this;
 * the dial button must be disabled whenever `ready` is false.
 */
export function resolveWebphoneReadiness(
  input: WebphoneReadinessInput,
): WebphoneReadiness {
  const reasons: Array<WebphoneReadinessReason> = []
  const settings = getWebphoneRuntimeSettings(input.settings)

  if (!input.isAuthenticated) reasons.push('not_authenticated')
  if (!input.isSecureContext) reasons.push('insecure_context')

  if (!input.profile) {
    reasons.push('missing_profile')
  } else {
    if (input.profile.enabled === false) reasons.push('profile_disabled')
    if (input.profile.webrtc_enabled === false) reasons.push('webrtc_disabled')
    if (!isWebrtcPreferred(input.profile)) reasons.push('non_webrtc_device')
    if (!input.profile.extension?.trim()) reasons.push('missing_extension')
    if (!resolveSipUsername(input.profile)) reasons.push('missing_username')
    if (!input.profile.sip_password?.trim()) reasons.push('missing_password')
  }

  if (!settings.wssUrl.trim()) reasons.push('missing_wss')
  if (!settings.pbxHost.trim()) reasons.push('missing_pbx_host')
  if (!settings.realm.trim()) reasons.push('missing_realm')
  if (!settings.iceServersJson.trim()) reasons.push('missing_ice')

  return { ready: reasons.length === 0, reasons }
}
