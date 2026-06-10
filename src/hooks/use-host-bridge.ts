import { useRouter } from '@tanstack/react-router'
import {
  useDocyrusHostNavigation,
  useDocyrusHostNotification,
} from '@docyrus/signin'
import { toast } from 'sonner'

/**
 * Bridges postMessage events sent by the host shell (super app) into the
 * embedded iframe app:
 *
 * - Host → App navigation: the shell asks us to navigate to a path/url.
 * - Host → App notifications: the shell pushes notification payloads we surface
 *   as toasts.
 *
 * Route → Host sync (app reporting its own route back to the shell address bar)
 * is enabled via the `syncRouteToHost` prop on `DocyrusAuthProvider`.
 *
 * All hooks are no-ops outside iframe mode, so this is safe to mount
 * unconditionally.
 */
export function useHostBridge() {
  const router = useRouter()

  useDocyrusHostNavigation(({ url }) => {
    if (!url) return

    // The host may send an absolute URL or a relative path. Resolve against the
    // current origin and push the relative portion so TanStack Router handles it
    // regardless of the route's search/hash shape.
    try {
      const resolved = new URL(url, window.location.origin)
      const relative = `${resolved.pathname}${resolved.search}${resolved.hash}`
      router.history.push(relative)
    } catch {
      // Fall back to pushing the raw value if it isn't a parseable URL.
      router.history.push(url)
    }
  })

  useDocyrusHostNotification((notification) => {
    toast(notification.subject, {
      description: notification.message,
    })
  })
}
