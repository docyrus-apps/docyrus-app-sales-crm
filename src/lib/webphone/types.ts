/*
 * Core types for the Webphone (Callcenter WebRTC) module.
 * @docyrus: [[architecture#Webphone (Callcenter WebRTC) Module]]
 */

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

export type WebphoneSessionState = 'ringing' | 'dialing' | 'active'

export type WebphoneCallDirection = 'inbound' | 'outbound'

/**
 * Full SIP runtime config handed to the JsSIP UA. The non-secret part is the
 * tenant-stored {@link WebphoneRuntimeSettings}; `username` / `password` /
 * `displayName` always come from the agent telephony profile, never from
 * tenant config or env (see the kit security notes).
 */
export interface WebrtcRuntimeConfig {
  wssUrl: string;
  pbxHost: string;
  registrarServer: string;
  realm: string;
  username: string;
  password: string;
  displayName: string;
  usePreloadedRoute: boolean;
  registerExpires: string;
  noAnswerTimeout: string;
  sessionTimers: boolean;
  sessionTimersRefreshMethod: 'UPDATE' | 'INVITE';
  sessionTimersForceRefresher: boolean;
  sessionTimersExpires: string;
  iceServersJson: string;
  extraRegisterHeaders: string;
  extraInviteHeaders: string;
  preferredAudioCodecs: string;
}

/** Tenant-stored, credential-free runtime settings (App Config `data.webrtc`). */
export type WebphoneRuntimeSettings = Omit<
  WebrtcRuntimeConfig,
  'username' | 'password' | 'displayName'
>

/**
 * `agent_telephony_profile` carries `sip_password` / `display_name` in the live
 * schema, but the generated entity type is stale and omits them (openapi.json
 * has not been refreshed for those two fields). We read them via explicit
 * `columns` and type the result here instead of regenerating 114 collections.
 */
export interface WebphoneAgentProfile {
  id: string;
  enabled?: boolean | null;
  extension?: string | null;
  pbx_user_id?: string | null;
  sip_password?: string | null;
  display_name?: string | null;
  preferred_device?:
    | { id?: string; name?: string; slug?: string }
    | string
    | null;
  webrtc_enabled?: boolean | null;
  current_state?: unknown;
}

export interface WebphoneSessionSnapshot {
  id: string;
  providerCallUuid?: string;
  direction: 'incoming' | 'outgoing';
  remoteUri: string;
  remoteDisplayName?: string;
  remotePhone: string;
  state: WebphoneSessionState;
  startedAt: string;
  answeredAt?: string;
  isMuted: boolean;
  isOnHold: boolean;
}

export interface WebphoneController {
  registrationStatus: RegistrationStatus;
  microphoneStatus: MicrophoneStatus;
  activeSession: WebphoneSessionSnapshot | null;
  incomingSession: WebphoneSessionSnapshot | null;
  lastError: string | null;
  register: (configOverride?: WebrtcRuntimeConfig) => Promise<void>;
  unregister: () => void;
  call: (target: string) => Promise<void>;
  answer: () => Promise<void>;
  reject: () => void;
  hangup: () => void;
  mute: () => void;
  unmute: () => void;
  hold: () => void;
  unhold: () => void;
  sendDtmf: (tone: string) => void;
}

export type WebphoneLifecycleEventType =
  | 'ringing'
  | 'answered'
  | 'ended'
  | 'missed'
  | 'rejected'

/** Emitted by the SIP controller so call-record persistence can react. */
export interface WebphoneLifecycleEvent {
  callId: string;
  direction: WebphoneCallDirection;
  phone: string;
  event: WebphoneLifecycleEventType;
  at: string;
  remoteDisplayName?: string;
}

export type CustomerKind = 'contact' | 'lead' | string

export interface CustomerMatch {
  kind: CustomerKind;
  id: string;
  label: string;
  phone?: string;
  email?: string;
  sourceAppSlug: string;
  sourceDataSourceSlug: string;
}

export interface CustomerAdapter {
  findByPhone: (phone: string) => Promise<Array<CustomerMatch>>;
  getById: (id: string) => Promise<CustomerMatch | null>;
  getDialablePhone: (record: unknown) => string | null;
  openCustomerCard: (match: CustomerMatch) => void;
}
