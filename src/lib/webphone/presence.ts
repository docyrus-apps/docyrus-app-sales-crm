/**
 * Per-browser persistence of the agent's last explicit presence choice
 * (Online / Offline). WebRTC registration is bound to this browser — the mic
 * permission and the SIP socket live here — so the intent is stored in
 * `localStorage` keyed by user id, not on the shared profile row. This lets a
 * page refresh restore the agent's last choice: stay Offline if they went
 * Offline, re-register if they were Online (or have never chosen).
 *
 * @docyrus: [[architecture#Webphone (Callcenter WebRTC) Module]]
 */
export type WebphonePresenceIntent = 'online' | 'offline'

const KEY_PREFIX = 'webphone:presence-intent:'

/**
 * The user's last saved presence choice, or null when they have never chosen
 * (treated as "auto-connect" — the first-time default). Returns null when
 * storage is unavailable (private mode, disabled) so the agent still works.
 */
export function loadPresenceIntent(
  userId: string | null | undefined
): WebphonePresenceIntent | null {
  if (!userId || typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(KEY_PREFIX + userId)

    return value === 'online' || value === 'offline' ? value : null
  } catch {
    return null
  }
}

/** Persists the agent's explicit Online/Offline choice for this browser. */
export function savePresenceIntent(
  userId: string | null | undefined,
  intent: WebphonePresenceIntent
): void {
  if (!userId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(KEY_PREFIX + userId, intent)
  } catch {
    // Storage may be unavailable (private mode); presence simply won't persist.
  }
}
