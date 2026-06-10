# Host Shell ↔ Iframe Messaging — Reusable Implementation Prompt

Paste the prompt below into any repo that uses `@docyrus/signin` to have Claude
wire up host shell messaging quickly.

---

**Implement host shell ↔ iframe messaging using `@docyrus/signin`.**

This app runs inside a super-app shell iframe. Wire up all three message bridges the library provides:

1. **Host → App navigation** — the shell asks us to navigate to a path/url.
2. **Host → App notifications** — the shell pushes notification payloads we should surface as toasts.
3. **App → Host route sync** — report our internal route changes so the shell's address bar reflects the current route (for copy/share/bookmark).

**API reference:**

```ts
import {
  useDocyrusHostNavigation,
  useDocyrusHostNotification,
  type DocyrusNotification,
} from '@docyrus/signin'

// Host → App navigation (no-op outside iframe; latest closure always used)
useDocyrusHostNavigation(({ url }) => { /* navigate to url */ })

// Host → App notification (DocyrusNotification has: subject, message, id, status, seen, ...)
useDocyrusHostNotification((n: DocyrusNotification) => { /* show toast: n.subject + n.message */ })
```

For route→host sync, the simplest path is the `syncRouteToHost` prop on the provider — it patches `history.pushState/replaceState` and listens for `popstate`/`hashchange`, so it works with any router:

```tsx
<DocyrusAuthProvider apiUrl="..." clientId="..." syncRouteToHost>
```

**Implementation requirements:**

- Create a single `useHostBridge()` hook that calls both `useDocyrusHostNavigation` and `useDocyrusHostNotification`.
- For navigation: the host may send an **absolute URL or a relative path**. Resolve it against `window.location.origin`, then navigate using this app's router to the relative `pathname + search + hash`. Use whatever navigation primitive accepts a raw path string (e.g. TanStack Router `router.history.push`, React Router `navigate`, Next `router.push`). Wrap in try/catch and fall back to pushing the raw value if it isn't a parseable URL.
- For notifications: render via the toast library already used in this repo (sonner, etc.). Map `subject` → title, `message` → description.
- Call `useHostBridge()` **unconditionally** near the top of the root app component (before any auth/loading early returns) and ensure it's mounted **inside** the router provider so navigation has router context. All three hooks are no-ops outside iframe mode, so unconditional mounting is safe.
- Enable `syncRouteToHost` on `<DocyrusAuthProvider>`.

Match the existing code style/router/toast library of this repo. Run the project's typecheck/build when done to confirm it compiles.

---

## Notes

- The prompt is deliberately **router-agnostic** — it tells Claude to detect and
  use whichever router/toast library each repo already has, so the navigation
  parsing logic stays identical but the primitive adapts.
- If a repo's router is the strict source of truth and you'd rather avoid history
  patching, append: *"Instead of `syncRouteToHost`, use `useDocyrusHostRouteSync()`
  or call `notifyRouteChange()` from `useDocyrusAuth()` on a router location
  subscription."*