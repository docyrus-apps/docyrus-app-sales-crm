import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'

import { type WrapupSubmitInput } from '@/lib/webphone/wrapup'

import type { WebphoneReadinessReason } from '@/lib/webphone/runtime'

import { useDocyrusAuth } from '@docyrus/signin'

import { useAppModules } from '@/hooks/use-app-config'
import { isModuleEnabled } from '@/lib/app-config'
import { useWebphoneRuntimeSettings } from '@/hooks/use-webphone-config'
import { useMyAgentTelephonyProfile } from '@/hooks/use-webphone-profile'
import { useMyInfo } from '@/hooks/use-users'
import { useWebphoneCustomerAdapter } from '@/hooks/use-webphone-customer-adapter'
import { useWebphoneCallLog } from '@/hooks/use-webphone-call-log'
import { useWebphoneSip } from '@/hooks/use-webphone-sip'
import {
  buildWebrtcRuntimeConfig,
  isSecureContextForWebrtc,
  resolveWebphoneReadiness
} from '@/lib/webphone/runtime'
import { loadPresenceIntent, savePresenceIntent } from '@/lib/webphone/presence'
import {
  type ScreenPopState,
  buildSingleMatchRelationPatch,
  resolveIncomingScreenPop
} from '@/lib/webphone/screen-pop'
import {
  type CreatePinnedNoteArgs,
  useWebphoneWrapup
} from '@/hooks/use-webphone-wrapup'
import type {
  CustomerMatch,
  MicrophoneStatus,
  RegistrationStatus,
  WebphoneAgentProfile,
  WebphoneCallDirection,
  WebphoneLifecycleEvent,
  WebphoneSessionSnapshot
} from '@/lib/webphone/types'

export interface PendingWrapup {
  callRecordId: string;
  callId: string;
  phone: string;
  direction: WebphoneCallDirection;
  contactId?: string;
  leadId?: string;
}

interface WebphoneContextValue {
  enabled: boolean;
  ready: boolean;
  readinessReasons: Array<WebphoneReadinessReason>;
  registrationStatus: RegistrationStatus;
  microphoneStatus: MicrophoneStatus;
  activeSession: WebphoneSessionSnapshot | null;
  incomingSession: WebphoneSessionSnapshot | null;
  screenPop: ScreenPopState | null;
  lastError: string | null;
  connect: () => void;
  disconnect: () => void;
  requestConnect: (profileOverride?: WebphoneAgentProfile) => void;
  dial: (
    phone: string,
    opts?: { contactId?: string; leadId?: string }
  ) => Promise<void>;
  answer: () => void;
  reject: () => void;
  hangup: () => void;
  mute: () => void;
  unmute: () => void;
  hold: () => void;
  unhold: () => void;
  sendDtmf: (tone: string) => void;
  selectScreenPopMatch: (match: CustomerMatch) => void;
  dismissScreenPop: () => void;
  liveNotes: string;
  setLiveNotes: (value: string) => void;
  pendingWrapup: PendingWrapup | null;
  submitWrapup: (input: WrapupSubmitInput) => Promise<void>;
  dismissWrapup: () => void;
  createPinnedNote: (args: CreatePinnedNoteArgs) => Promise<void>;
}

const WebphoneContext = createContext<WebphoneContextValue | null>(null)

/**
 * Composes the webphone foundation into one context: runtime settings + agent
 * profile → readiness/config → JsSIP controller, with call-record persistence,
 * the customer adapter, and incoming screen-pop wired together. A no-op when
 * the `webphone` module is off.
 *
 * @docyrus: [[architecture#Webphone (Callcenter WebRTC) Module]]
 */
export function WebphoneProvider({ children }: { children: ReactNode }) {
  const { status } = useDocyrusAuth()
  const { data: modules } = useAppModules()
  const enabled = isModuleEnabled(modules, 'webphone')

  const { data: settings } = useWebphoneRuntimeSettings()
  const { data: profile } = useMyAgentTelephonyProfile()
  const { data: me } = useMyInfo()
  const userId = me?.id
  const adapter = useWebphoneCustomerAdapter()
  const callLog = useWebphoneCallLog()
  const wrapup = useWebphoneWrapup()

  const [liveNotes, setLiveNotes] = useState('')
  const [pendingWrapup, setPendingWrapup] = useState<PendingWrapup | null>(null)
  const pendingWrapupRef = useRef<PendingWrapup | null>(null)

  pendingWrapupRef.current = pendingWrapup
  const currentRelationRef = useRef<{ contactId?: string; leadId?: string }>({})
  const answeredRef = useRef<Set<string>>(new Set())

  /*
   * Wraps call-record persistence and opens a wrap-up form once a relevant call
   * ends (answered calls or any outbound attempt).
   */
  const handleCallEvent = useCallback(
    async (event: WebphoneLifecycleEvent) => {
      if (event.event === 'answered') answeredRef.current.add(event.callId)
      const recordIdBefore = callLog.getCallRecordId(event.callId)

      await callLog.onCallEvent(event)
      if (
        event.event === 'ended' ||
        event.event === 'missed' ||
        event.event === 'rejected'
      ) {
        const wasAnswered = answeredRef.current.has(event.callId)

        answeredRef.current.delete(event.callId)
        const recordId = recordIdBefore ?? callLog.getCallRecordId(event.callId)
        const relation = currentRelationRef.current

        currentRelationRef.current = {}
        if (recordId && (wasAnswered || event.direction === 'outbound')) {
          setPendingWrapup({
            callRecordId: recordId,
            callId: event.callId,
            phone: event.phone,
            direction: event.direction,
            contactId: relation.contactId,
            leadId: relation.leadId
          })
        }
      }
    },
    [callLog]
  )

  const config = useMemo(() => {
    if (!profile) return null

    return buildWebrtcRuntimeConfig({ settings: settings ?? null, profile })
  }, [settings, profile])

  const readiness = useMemo(
    () => resolveWebphoneReadiness({
        isAuthenticated: status === 'authenticated',
        isSecureContext: isSecureContextForWebrtc(),
        settings: settings ?? null,
        profile: profile ?? null
      }),
    [status, settings, profile]
  )

  const controller = useWebphoneSip({
    config: enabled ? config : null,
    onCallEvent: handleCallEvent
  })

  const [screenPop, setScreenPop] = useState<ScreenPopState | null>(null)
  const screenPopRef = useRef<ScreenPopState | null>(null)

  screenPopRef.current = screenPop

  const pendingOutboundRef = useRef<{
    contactId?: string;
    leadId?: string;
  } | null>(null)
  const triedRegisterRef = useRef(false)
  const lastIncomingRef = useRef<string | null>(null)
  const lastOutgoingRef = useRef<string | null>(null)

  /*
   * Auto-connect a ready agent once when the module is on — but only if their
   * last explicit choice was Online (or they have never chosen). If they went
   * Offline, stay offline across reloads: don't re-register or re-prompt for
   * the microphone until they choose Online again.
   */
  useEffect(() => {
    if (!enabled || !readiness.ready) return
    if (controller.registrationStatus !== 'idle') return
    if (triedRegisterRef.current) return
    triedRegisterRef.current = true
    if (loadPresenceIntent(userId) === 'offline') return
    void controller.register()
  }, [
    enabled,
    readiness.ready,
    controller.registrationStatus,
    controller,
    userId
  ])

  /*
   * Explicit (re)connect after the user saves extension credentials. When the
   * dialog has just written a new password, it passes a merged profile snapshot
   * so registration uses the fresh values immediately instead of racing the
   * profile refetch and accidentally registering with stale credentials.
   */
  const requestConnect = useCallback(
    (profileOverride?: WebphoneAgentProfile) => {
      const nextConfig = profileOverride
        ? buildWebrtcRuntimeConfig({
            settings: settings ?? null,
            profile: profileOverride
          })
        : config

      if (!enabled || !nextConfig) return
      // Saving credentials and connecting is an explicit "go Online" choice.
      savePresenceIntent(userId, 'online')
      triedRegisterRef.current = true
      void controller.register(nextConfig)
    },
    [
config,
controller,
enabled,
settings,
userId
]
  )

  /*
   * Explicit Online/Offline from the header status menu. These persist the
   * agent's choice so a refresh restores it (see the auto-connect effect).
   */
  const connect = useCallback(() => {
    savePresenceIntent(userId, 'online')
    triedRegisterRef.current = true
    void controller.register()
  }, [controller, userId])

  const disconnect = useCallback(() => {
    savePresenceIntent(userId, 'offline')
    triedRegisterRef.current = true
    controller.unregister()
  }, [controller, userId])

  // Outbound: fill the call's customer relation from the dial context.
  useEffect(() => {
    const session = controller.activeSession

    if (!session || session.direction !== 'outgoing') return
    if (lastOutgoingRef.current === session.id) return
    lastOutgoingRef.current = session.id
    const pending = pendingOutboundRef.current

    pendingOutboundRef.current = null
    if (pending && (pending.contactId || pending.leadId)) {
      void callLog.patchCallRelation(session.id, pending)
    }
  }, [controller.activeSession, callLog])

  // Inbound: resolve screen-pop, open the card on a single match.
  useEffect(() => {
    const session = controller.incomingSession

    if (!session) return
    if (lastIncomingRef.current === session.id) return
    lastIncomingRef.current = session.id

    let cancelled = false

    void (async () => {
      const state = await resolveIncomingScreenPop({
        callId: session.id,
        phone: session.remotePhone,
        adapter
      })

      if (cancelled) return
      setScreenPop(state)
      if (state.mode === 'single') {
        adapter.openCustomerCard(state.matches[0])
        const patch = buildSingleMatchRelationPatch({ state })

        if (patch.contactId || patch.leadId) {
          currentRelationRef.current = patch
          void callLog.patchCallRelation(state.callId, patch)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [controller.incomingSession, adapter, callLog])

  // Clear transient state once a call is fully over.
  useEffect(() => {
    if (!controller.incomingSession && !controller.activeSession) {
      lastIncomingRef.current = null
      lastOutgoingRef.current = null
      setScreenPop(null)
    }
  }, [controller.incomingSession, controller.activeSession])

  const dial = useCallback(
    async (phone: string, opts?: { contactId?: string; leadId?: string }) => {
      const relation =
        opts?.contactId || opts?.leadId
          ? { contactId: opts.contactId, leadId: opts.leadId }
          : null

      pendingOutboundRef.current = relation
      currentRelationRef.current = relation ?? {}
      await controller.call(phone)
    },
    [controller]
  )

  const selectScreenPopMatch = useCallback(
    (match: CustomerMatch) => {
      adapter.openCustomerCard(match)
      const state = screenPopRef.current

      if (state) {
        const patch =
          match.kind === 'lead' ? { leadId: match.id } : { contactId: match.id }

        currentRelationRef.current = patch
        void callLog.patchCallRelation(state.callId, patch)
      }
      setScreenPop(null)
    },
    [adapter, callLog]
  )

  const submitWrapup = useCallback(
    async (input: WrapupSubmitInput) => {
      const pending = pendingWrapupRef.current

      if (!pending) return
      await wrapup.submitWrapup({
        callRecordId: pending.callRecordId,
        phone: pending.phone,
        direction: pending.direction,
        input: {
          ...input,
          contactId: input.contactId ?? pending.contactId,
          leadId: input.leadId ?? pending.leadId
        }
      })
      setPendingWrapup(null)
      setLiveNotes('')
    },
    [wrapup]
  )

  const dismissWrapup = useCallback(() => {
    setPendingWrapup(null)
    setLiveNotes('')
  }, [])

  const value = useMemo<WebphoneContextValue>(
    () => ({
      enabled,
      ready: readiness.ready,
      readinessReasons: readiness.reasons,
      registrationStatus: controller.registrationStatus,
      microphoneStatus: controller.microphoneStatus,
      activeSession: controller.activeSession,
      incomingSession: controller.incomingSession,
      screenPop,
      lastError: controller.lastError,
      connect,
      disconnect,
      requestConnect,
      dial,
      answer: controller.answer,
      reject: controller.reject,
      hangup: controller.hangup,
      mute: controller.mute,
      unmute: controller.unmute,
      hold: controller.hold,
      unhold: controller.unhold,
      sendDtmf: controller.sendDtmf,
      selectScreenPopMatch,
      dismissScreenPop: () => setScreenPop(null),
      liveNotes,
      setLiveNotes,
      pendingWrapup,
      submitWrapup,
      dismissWrapup,
      createPinnedNote: wrapup.createPinnedNote
    }),
    [
      enabled,
      readiness,
      controller,
      screenPop,
      dial,
      selectScreenPopMatch,
      connect,
      disconnect,
      requestConnect,
      liveNotes,
      pendingWrapup,
      submitWrapup,
      dismissWrapup,
      wrapup.createPinnedNote
    ]
  )

  return (
    <WebphoneContext.Provider value={value}>
      {children}
    </WebphoneContext.Provider>
  )
}

export function useWebphone(): WebphoneContextValue {
  const value = useContext(WebphoneContext)

  if (!value) {
    throw new Error('useWebphone must be used within a WebphoneProvider')
  }

  return value
}
