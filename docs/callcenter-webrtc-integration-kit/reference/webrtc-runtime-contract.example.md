# WebRTC Runtime Contract Example

Bu örnek, hedef projeye taşınacak minimal WebRTC controller sözleşmesini gösterir. Mevcut projede bu mantığın daha kapsamlı hali `use-sip-lab-client.ts` içinde bulunur.

## Config tipi

```ts
export type RegistrationStatus =
  | 'idle'
  | 'registering'
  | 'registered'
  | 'failed'
  | 'unregistered'
export type MicrophoneStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'error'
export type SessionState = 'ringing' | 'dialing' | 'active'

export interface WebrtcRuntimeConfig {
  wssUrl: string
  pbxHost: string
  registrarServer: string
  realm: string
  username: string
  password: string
  displayName: string
  usePreloadedRoute: boolean
  registerExpires: string
  noAnswerTimeout: string
  sessionTimers: boolean
  sessionTimersRefreshMethod: 'UPDATE' | 'INVITE'
  sessionTimersForceRefresher: boolean
  sessionTimersExpires: string
  iceServersJson: string
  extraRegisterHeaders: string
  extraInviteHeaders: string
  preferredAudioCodecs: string
}

export interface WebrtcSessionSnapshot {
  id: string
  providerCallUuid?: string
  direction: 'incoming' | 'outgoing'
  remoteUri: string
  remoteDisplayName?: string
  state: SessionState
  startedAt: string
  answeredAt?: string
  isMuted: boolean
  isOnHold: boolean
}
```

## Controller tipi

```ts
export interface WebrtcController {
  registrationStatus: RegistrationStatus
  microphoneStatus: MicrophoneStatus
  activeSession: WebrtcSessionSnapshot | null
  incomingSession: WebrtcSessionSnapshot | null
  lastError: string | null
  register: () => Promise<void>
  unregister: () => void
  call: (target: string) => Promise<void>
  answer: () => Promise<void>
  reject: () => void
  hangup: () => void
  mute: () => void
  unmute: () => void
  hold: () => void
  unhold: () => void
  sendDtmf: (tone: string) => void
}
```

## Runtime readiness helper

```ts
export interface WebrtcReadinessInput {
  isAuthenticated: boolean
  isHttpsOrLocalhost: boolean
  runtime: Partial<WebrtcRuntimeConfig> | null
  profile: {
    enabled?: boolean
    extension?: string
    pbx_user_id?: string
    sip_password?: string
    preferred_device?: unknown
    webrtc_enabled?: boolean
  } | null
}

export function resolveWebrtcReadiness(input: WebrtcReadinessInput) {
  const reasons: string[] = []

  if (!input.isAuthenticated) reasons.push('not_authenticated')
  if (!input.isHttpsOrLocalhost) reasons.push('insecure_context')
  if (!input.profile) reasons.push('missing_profile')
  if (input.profile?.enabled === false) reasons.push('profile_disabled')
  if (input.profile?.webrtc_enabled === false) reasons.push('webrtc_disabled')
  if (!input.profile?.extension?.trim()) reasons.push('missing_extension')
  if (
    !(input.profile?.pbx_user_id?.trim() || input.profile?.extension?.trim())
  ) {
    reasons.push('missing_username')
  }
  if (!input.profile?.sip_password?.trim()) reasons.push('missing_password')
  if (!input.runtime?.wssUrl?.trim()) reasons.push('missing_wss')
  if (!input.runtime?.pbxHost?.trim()) reasons.push('missing_pbx_host')
  if (!input.runtime?.realm?.trim()) reasons.push('missing_realm')
  if (!input.runtime?.iceServersJson?.trim()) reasons.push('missing_ice')

  return {
    ready: reasons.length === 0,
    reasons,
  }
}
```

## Config merge örneği

```ts
const DEFAULT_VERIMOR_WEBRTC = {
  wssUrl: 'wss://api.bulutsantralim.com:7443',
  pbxHost: 'kivateknoloji.bulutsantralim.com',
  registrarServer: '',
  realm: 'kivateknoloji.bulutsantralim.com',
  usePreloadedRoute: true,
  registerExpires: '600',
  noAnswerTimeout: '60',
  sessionTimers: false,
  sessionTimersRefreshMethod: 'UPDATE' as const,
  sessionTimersForceRefresher: false,
  sessionTimersExpires: '90',
  iceServersJson: '[\n  { "urls": "stun:stun.l.google.com:19302" }\n]',
  extraRegisterHeaders: '',
  extraInviteHeaders: '',
  preferredAudioCodecs: 'PCMU,PCMA',
}

export function buildWebrtcRuntimeConfig(args: {
  appSettings?: Partial<WebrtcRuntimeConfig> | null
  profile: {
    extension?: string
    pbx_user_id?: string
    sip_password?: string
    display_name?: string
  }
}): WebrtcRuntimeConfig {
  const username =
    args.profile.pbx_user_id?.trim() || args.profile.extension?.trim() || ''

  return {
    ...DEFAULT_VERIMOR_WEBRTC,
    ...(args.appSettings ?? {}),
    username,
    password: args.profile.sip_password ?? '',
    displayName: args.profile.display_name ?? username,
  }
}
```

## JsSIP uygulama notları

- UA tek instance olmalı; component unmount olduğunda temizlenmeli.
- Active call varken ikinci call engellenmeli.
- Incoming `newRTCSession` event’i screen-pop akışını tetiklemeli.
- `accepted`, `ended`, `failed` eventleri call record lifecycle’a bağlanmalı.
- Media stream kapatılırken tüm track’ler stop edilmeli.
- SIP trace normal kullanıcı UI’ında gösterilmemeli.
