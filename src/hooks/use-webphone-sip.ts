import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import JsSIP from 'jssip'
import { toDialableTarget } from '@/lib/webphone/phone'
import type {
  MicrophoneStatus,
  RegistrationStatus,
  WebphoneCallDirection,
  WebphoneController,
  WebphoneLifecycleEvent,
  WebphoneLifecycleEventType,
  WebphoneSessionSnapshot,
  WebphoneSessionState,
  WebrtcRuntimeConfig,
} from '@/lib/webphone/types'

// JsSIP session/event payloads are loosely typed by the library, so we use
// `any` at the boundary and keep the exposed controller strictly typed.
// @docyrus: [[architecture#Webphone (Callcenter WebRTC) Module]]

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'webphone_error'
}

function parseIceServers(json: string): Array<RTCIceServer> {
  try {
    const value = JSON.parse(json)
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function buildSnapshot(
  session: any,
  state: WebphoneSessionState,
): WebphoneSessionSnapshot {
  const remote = session?.remote_identity
  return {
    id: session?.id ?? '',
    direction: session?.direction === 'incoming' ? 'incoming' : 'outgoing',
    remoteUri: String(remote?.uri ?? ''),
    remoteDisplayName: remote?.display_name || undefined,
    remotePhone: remote?.uri?.user ?? '',
    state,
    startedAt: new Date().toISOString(),
    isMuted: false,
    isOnHold: false,
  }
}

interface UseWebphoneSipArgs {
  /** Fully resolved SIP config, or null until the agent is ready to register. */
  config: WebrtcRuntimeConfig | null
  /** Lifecycle hook for call-record persistence (M3). */
  onCallEvent?: (event: WebphoneLifecycleEvent) => void
}

/**
 * Single JsSIP UA controller. Owns SIP registration, the active/incoming
 * session snapshots, microphone permission, and media wiring. The UA is a
 * singleton per hook instance and is torn down on unmount; a second concurrent
 * call is rejected with 486 Busy Here.
 */
export function useWebphoneSip(args: UseWebphoneSipArgs): WebphoneController {
  const [registrationStatus, setRegistrationStatus] =
    useState<RegistrationStatus>('idle')
  const [microphoneStatus, setMicrophoneStatus] =
    useState<MicrophoneStatus>('idle')
  const [activeSession, setActiveSession] =
    useState<WebphoneSessionSnapshot | null>(null)
  const [incomingSession, setIncomingSession] =
    useState<WebphoneSessionSnapshot | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  const uaRef = useRef<JsSIP.UA | null>(null)
  const sessionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const configRef = useRef(args.config)
  configRef.current = args.config
  const onEventRef = useRef(args.onCallEvent)
  onEventRef.current = args.onCallEvent

  const emit = useCallback((event: Omit<WebphoneLifecycleEvent, 'at'>) => {
    onEventRef.current?.({ ...event, at: new Date().toISOString() })
  }, [])

  const ensureAudio = useCallback(() => {
    if (audioRef.current) return audioRef.current
    const element = document.createElement('audio')
    element.autoplay = true
    element.style.display = 'none'
    element.setAttribute('data-webphone-audio', '')
    document.body.appendChild(element)
    audioRef.current = element
    return element
  }, [])

  const attachRemoteAudio = useCallback(
    (pc: any) => {
      if (!pc) return
      const audio = ensureAudio()
      const play = (stream: MediaStream) => {
        try {
          audio.srcObject = stream
          void audio.play?.()
        } catch {
          // Autoplay can be blocked until a user gesture; ignore.
        }
      }
      try {
        pc.addEventListener?.('track', (ev: any) => {
          if (ev.streams?.[0]) play(ev.streams[0])
        })
      } catch {
        // older peerconnection shape
      }
      try {
        const stream = new MediaStream()
        pc.getReceivers?.().forEach((receiver: any) => {
          if (receiver.track) stream.addTrack(receiver.track)
        })
        if (stream.getTracks().length) play(stream)
      } catch {
        // ignore
      }
    },
    [ensureAudio],
  )

  const cleanupSession = useCallback((callId?: string) => {
    if (!callId || sessionRef.current?.id === callId) {
      sessionRef.current = null
    }
    setIncomingSession((prev) =>
      prev && callId && prev.id !== callId ? prev : null,
    )
    setActiveSession((prev) =>
      prev && callId && prev.id !== callId ? prev : null,
    )
    if (audioRef.current) {
      try {
        audioRef.current.srcObject = null
      } catch {
        // ignore
      }
    }
  }, [])

  const handleNewRTCSession = useCallback(
    (data: any) => {
      const session = data?.session
      if (!session) return

      // Reject a second concurrent call.
      if (sessionRef.current && sessionRef.current !== session) {
        try {
          session.terminate({ status_code: 486, reason_phrase: 'Busy Here' })
        } catch {
          // ignore
        }
        return
      }

      sessionRef.current = session
      let answered = false
      const direction: WebphoneCallDirection =
        session.direction === 'incoming' ? 'inbound' : 'outbound'
      const phone = session.remote_identity?.uri?.user ?? ''
      const displayName = session.remote_identity?.display_name || undefined
      const callId: string = session.id

      if (session.direction === 'incoming') {
        setIncomingSession(buildSnapshot(session, 'ringing'))
      } else {
        setActiveSession(buildSnapshot(session, 'dialing'))
      }
      emit({
        callId,
        direction,
        phone,
        event: 'ringing',
        remoteDisplayName: displayName,
      })

      const markAnswered = () => {
        if (answered) return
        answered = true
        setIncomingSession(null)
        setActiveSession((prev) => {
          const base =
            prev && prev.id === callId ? prev : buildSnapshot(session, 'active')
          return {
            ...base,
            state: 'active',
            answeredAt: new Date().toISOString(),
          }
        })
        if (session.connection) attachRemoteAudio(session.connection)
        emit({
          callId,
          direction,
          phone,
          event: 'answered',
          remoteDisplayName: displayName,
        })
      }

      const finish = (payload: any) => {
        let event: WebphoneLifecycleEventType
        if (answered) {
          event = 'ended'
        } else if (direction === 'inbound') {
          const cause = String(payload?.cause ?? '')
          event =
            cause === 'Rejected' || cause === 'Busy' ? 'rejected' : 'missed'
        } else {
          event = 'ended'
        }
        emit({
          callId,
          direction,
          phone,
          event,
          remoteDisplayName: displayName,
        })
        cleanupSession(callId)
      }

      session.on('peerconnection', (e: any) =>
        attachRemoteAudio(e?.peerconnection),
      )
      session.on('accepted', markAnswered)
      session.on('confirmed', markAnswered)
      session.on('ended', (e: any) => finish(e))
      session.on('failed', (e: any) => finish(e))
    },
    [emit, attachRemoteAudio, cleanupSession],
  )

  const register = useCallback(async () => {
    const config = configRef.current
    if (!config) {
      setLastError('config_unavailable')
      return
    }
    if (!config.username || !config.password) {
      setLastError('missing_credentials')
      return
    }
    if (uaRef.current) return

    setMicrophoneStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((track) => track.stop())
      setMicrophoneStatus('granted')
    } catch {
      setMicrophoneStatus('denied')
      setLastError('microphone_denied')
      return
    }

    try {
      setRegistrationStatus('registering')
      setLastError(null)
      const socket = new JsSIP.WebSocketInterface(config.wssUrl)
      const ua = new JsSIP.UA({
        sockets: [socket],
        uri: `sip:${config.username}@${config.realm || config.pbxHost}`,
        password: config.password,
        display_name: config.displayName || config.username,
        registrar_server: config.registrarServer || undefined,
        register: true,
        register_expires: Number(config.registerExpires) || 600,
        session_timers: config.sessionTimers,
        session_timers_refresh_method: config.sessionTimersRefreshMethod,
        use_preloaded_route: config.usePreloadedRoute,
        no_answer_timeout: Number(config.noAnswerTimeout) || 60,
      })

      uaRef.current = ua
      ua.on('registered', () => setRegistrationStatus('registered'))
      ua.on('unregistered', () => setRegistrationStatus('unregistered'))
      ua.on('registrationFailed', () => {
        setRegistrationStatus('failed')
        setLastError('registration_failed')
      })
      ua.on('disconnected', () =>
        setRegistrationStatus((prev) =>
          prev === 'registered' ? 'unregistered' : prev,
        ),
      )
      ua.on('newRTCSession', handleNewRTCSession)
      ua.start()
    } catch (error) {
      setRegistrationStatus('failed')
      setLastError(getErrorMessage(error))
    }
  }, [handleNewRTCSession])

  const unregister = useCallback(() => {
    const ua = uaRef.current
    if (ua) {
      try {
        ua.stop()
      } catch {
        // ignore
      }
      uaRef.current = null
    }
    sessionRef.current = null
    setActiveSession(null)
    setIncomingSession(null)
    setRegistrationStatus('unregistered')
  }, [])

  const call = useCallback(async (target: string) => {
    const config = configRef.current
    const ua = uaRef.current
    if (!config || !ua) {
      setLastError('not_registered')
      return
    }
    if (sessionRef.current) {
      setLastError('call_in_progress')
      return
    }
    const dial = toDialableTarget(target).replace('+', '')
    if (!dial) {
      setLastError('invalid_target')
      return
    }
    try {
      ua.call(`sip:${dial}@${config.pbxHost}`, {
        mediaConstraints: { audio: true, video: false },
        pcConfig: { iceServers: parseIceServers(config.iceServersJson) },
      })
    } catch (error) {
      setLastError(getErrorMessage(error))
    }
  }, [])

  const answer = useCallback(async () => {
    const config = configRef.current
    const session = sessionRef.current
    if (!session || !config) return
    try {
      session.answer({
        mediaConstraints: { audio: true, video: false },
        pcConfig: { iceServers: parseIceServers(config.iceServersJson) },
      })
    } catch (error) {
      setLastError(getErrorMessage(error))
    }
  }, [])

  const reject = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    try {
      session.terminate({ status_code: 486, reason_phrase: 'Busy Here' })
    } catch {
      // ignore
    }
  }, [])

  const hangup = useCallback(() => {
    const session = sessionRef.current
    if (!session) return
    try {
      session.terminate()
    } catch {
      // ignore
    }
  }, [])

  const setMuteFlag = (value: boolean) =>
    setActiveSession((prev) => (prev ? { ...prev, isMuted: value } : prev))
  const setHoldFlag = (value: boolean) =>
    setActiveSession((prev) => (prev ? { ...prev, isOnHold: value } : prev))

  const mute = useCallback(() => {
    try {
      sessionRef.current?.mute({ audio: true })
      setMuteFlag(true)
    } catch {
      // ignore
    }
  }, [])

  const unmute = useCallback(() => {
    try {
      sessionRef.current?.unmute({ audio: true })
      setMuteFlag(false)
    } catch {
      // ignore
    }
  }, [])

  const hold = useCallback(() => {
    try {
      sessionRef.current?.hold()
      setHoldFlag(true)
    } catch {
      // ignore
    }
  }, [])

  const unhold = useCallback(() => {
    try {
      sessionRef.current?.unhold()
      setHoldFlag(false)
    } catch {
      // ignore
    }
  }, [])

  const sendDtmf = useCallback((tone: string) => {
    try {
      sessionRef.current?.sendDTMF(tone)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    return () => {
      try {
        uaRef.current?.stop()
      } catch {
        // ignore
      }
      uaRef.current = null
      sessionRef.current = null
      if (audioRef.current) {
        audioRef.current.remove()
        audioRef.current = null
      }
    }
  }, [])

  return useMemo<WebphoneController>(
    () => ({
      registrationStatus,
      microphoneStatus,
      activeSession,
      incomingSession,
      lastError,
      register,
      unregister,
      call,
      answer,
      reject,
      hangup,
      mute,
      unmute,
      hold,
      unhold,
      sendDtmf,
    }),
    [
      registrationStatus,
      microphoneStatus,
      activeSession,
      incomingSession,
      lastError,
      register,
      unregister,
      call,
      answer,
      reject,
      hangup,
      mute,
      unmute,
      hold,
      unhold,
      sendDtmf,
    ],
  )
}
