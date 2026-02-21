# @docyrus/signin

Authentication provider for Docyrus apps. Provides "Sign in with Docyrus" experience with automatic environment detection — standalone apps use OAuth2 Authorization Code + PKCE via page redirect, while iframe-embedded apps receive tokens via `window.postMessage` from the host.

Supports **React**, **Vue**, **Electron**, and **Next.js SSR** via separate entrypoints.

## Features

- **Auto Environment Detection**: Detects standalone vs iframe mode automatically
- **OAuth2 PKCE**: Full Authorization Code flow with PKCE (S256) for standalone apps
- **Iframe Auth**: Receives tokens via `postMessage` from `*.docyrus.app` hosts
- **Token Auto-Refresh**: Proactive token refresh before expiry in both modes
- **React Hooks**: `useDocyrusAuth()` and `useDocyrusClient()` for easy integration
- **Vue Composables**: `useDocyrusAuth()` and `useDocyrusClient()` for Vue 3
- **Electron Support**: `ElectronTokenStorage` for IPC-based token storage + `getAuthorizationUrl()` for external browser login
- **Ready-to-Use API Client**: Exposes a configured `RestApiClient` from `@docyrus/api-client`
- **SignInButton**: Unstyled, customizable sign-in button component (React + Vue)
- **SSR Support**: Sync access token to cookie for server-side rendering (Next.js) with `max-age` and `Secure` flag
- **Next.js SSR Helpers**: `createServerClient()`, `getSession()`, `authMiddleware()` for server components, actions, and middleware
- **TypeScript**: Full type definitions included

## Installation

```bash
npm install @docyrus/signin
```

```bash
pnpm add @docyrus/signin
```

### Peer Dependencies

- `@docyrus/api-client` >= 0.0.4
- `react` >= 19.2.0 (optional — required for React/Next.js entrypoint)
- `vue` >= 3.5.0 (optional — required for Vue entrypoint)

## Entrypoints

| Import Path                | Description                                              | Framework      |
| -------------------------- | -------------------------------------------------------- | -------------- |
| `@docyrus/signin`          | React provider, hooks, components                        | React, Next.js |
| `@docyrus/signin/nextjs`   | Server-side helpers (middleware, server client, session) | Next.js        |
| `@docyrus/signin/vue`      | Vue provider, composables, components                    | Vue 3          |
| `@docyrus/signin/electron` | Electron token storage                                   | Electron       |
| `@docyrus/signin/core`     | Pure TypeScript core (no framework dependency)           | Any            |

## Quick Start (React)

```tsx
import {
  DocyrusAuthProvider,
  useDocyrusAuth,
  useDocyrusClient,
  SignInButton,
} from '@docyrus/signin'

function App() {
  return (
    <DocyrusAuthProvider
      apiUrl="https://alpha-api.docyrus.com"
      clientId="your-oauth2-client-id"
      redirectUri="http://localhost:3000/callback"
      scopes={['offline_access', 'Read.All', 'Users.Read']}
      callbackPath="/callback"
    >
      <Dashboard />
    </DocyrusAuthProvider>
  )
}

function Dashboard() {
  const { status, signOut } = useDocyrusAuth()
  const client = useDocyrusClient()

  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return <SignInButton />

  return (
    <div>
      <p>Authenticated!</p>
      <button onClick={() => client!.get('/v1/users/me').then(console.log)}>
        Fetch user
      </button>
      <button onClick={signOut}>Sign out</button>
    </div>
  )
}
```

## Quick Start (Vue)

```vue
<!-- App.vue -->
<script setup lang="ts">
import { RouterView } from 'vue-router'
import { DocyrusAuthProvider } from '@docyrus/signin/vue'
</script>

<template>
  <DocyrusAuthProvider
    apiUrl="https://alpha-api.docyrus.com"
    clientId="your-oauth2-client-id"
    redirectUri="http://localhost:5173/callback"
    :scopes="['offline_access', 'Read.All', 'Users.Read']"
    callbackPath="/callback"
  >
    <RouterView />
  </DocyrusAuthProvider>
</template>
```

```vue
<!-- Dashboard.vue -->
<script setup lang="ts">
import { useDocyrusAuth } from '@docyrus/signin/vue'

const { status, client, signIn, signOut } = useDocyrusAuth()
</script>

<template>
  <div v-if="status === 'loading'">Loading...</div>
  <button v-else-if="status === 'unauthenticated'" @click="signIn">
    Sign in
  </button>
  <div v-else>
    <p>Authenticated!</p>
    <button @click="signOut">Sign out</button>
  </div>
</template>
```

## Quick Start (Electron)

```tsx
import { DocyrusAuthProvider, useDocyrusAuth } from '@docyrus/signin'
import { ElectronTokenStorage } from '@docyrus/signin/electron'

const tokenStorage = new ElectronTokenStorage()

function App() {
  return (
    <DocyrusAuthProvider
      apiUrl="https://alpha-api.docyrus.com"
      clientId="your-oauth2-client-id"
      redirectUri="docyrus://callback"
      scopes={['offline_access', 'Read.All', 'Users.Read']}
      callbackPath="/callback"
      tokenStorage={tokenStorage}
    >
      <LoginPage />
    </DocyrusAuthProvider>
  )
}

function LoginPage() {
  const { status, getAuthorizationUrl } = useDocyrusAuth()

  const handleLogin = async () => {
    const url = await getAuthorizationUrl()
    if (url) {
      // Open in system browser instead of navigating
      await window.electronAPI.openExternal(url)
    }
  }

  return (
    <button onClick={handleLogin} disabled={status === 'loading'}>
      Sign in
    </button>
  )
}
```

## Configuration

Pass props to `DocyrusAuthProvider` to override defaults:

```tsx
<DocyrusAuthProvider
  apiUrl="https://alpha-api.docyrus.com"
  clientId="your-oauth2-client-id"
  redirectUri="http://localhost:3000/callback"
  scopes={['offline_access', 'Read.All', 'Users.Read']}
  callbackPath="/callback"
  forceMode="standalone"
>
  <App />
</DocyrusAuthProvider>
```

| Prop                 | Type                       | Default                                 | Description                                         |
| -------------------- | -------------------------- | --------------------------------------- | --------------------------------------------------- |
| `apiUrl`             | `string`                   | `https://alpha-api.docyrus.com`         | Docyrus API base URL                                |
| `clientId`           | `string`                   | **Required**                            | OAuth2 client ID (throws if missing)                |
| `redirectUri`        | `string`                   | `window.location.origin + callbackPath` | OAuth2 redirect URI                                 |
| `scopes`             | `string[]`                 | `['offline_access', 'Read.All', ...]`   | OAuth2 scopes                                       |
| `callbackPath`       | `string`                   | `/auth/callback`                        | Path to detect OAuth callback                       |
| `forceMode`          | `'standalone' \| 'iframe'` | Auto-detected                           | Force a specific auth mode                          |
| `storageKeyPrefix`   | `string`                   | `docyrus_oauth2_`                       | localStorage key prefix                             |
| `tokenStorage`       | `OAuth2TokenStorage`       | Browser localStorage                    | Custom token storage (e.g., `ElectronTokenStorage`) |
| `allowedHostOrigins` | `string[]`                 | `undefined`                             | Extra trusted iframe origins                        |
| `ssr`                | `boolean`                  | `false`                                 | Sync access token to cookie for server components   |
| `ssrCookieKey`       | `string`                   | `docyrus-token`                         | Cookie name for SSR token sync                      |

## Hooks / Composables

### useDocyrusAuth()

Returns the full authentication context. Available in both React and Vue (`@docyrus/signin/vue`).

```tsx
const {
  status, // 'loading' | 'authenticated' | 'unauthenticated'
  mode, // 'standalone' | 'iframe'
  client, // RestApiClient | null
  tokens, // { accessToken, refreshToken, ... } | null
  signIn, // () => void (redirects to Docyrus login)
  getAuthorizationUrl, // () => Promise<string | null> (returns URL without navigating — for Electron)
  signOut, // () => Promise<void>
  error, // Error | null
} = useDocyrusAuth()
```

### useDocyrusClient()

Shorthand hook/composable that returns just the API client:

```tsx
const client = useDocyrusClient() // RestApiClient | null

if (client) {
  const response = await client.get('/v1/users/me')
}
```

## Components

### SignInButton

Unstyled button that triggers sign-in. Automatically hidden when authenticated or in iframe mode. Available in both React and Vue.

**React:**

```tsx
// Basic
<SignInButton />

// With custom styling
<SignInButton className="btn btn-primary" label="Log in with Docyrus" />

// Render prop for full customization
<SignInButton>
  {({ signIn, isLoading }) => (
    <button onClick={signIn} disabled={isLoading}>
      {isLoading ? 'Redirecting...' : 'Sign in'}
    </button>
  )}
</SignInButton>
```

**Vue:**

```vue
<!-- Basic -->
<SignInButton />

<!-- With custom styling -->
<SignInButton label="Login" class="btn-primary" />

<!-- Scoped slot for custom rendering -->
<SignInButton v-slot="{ signIn, status }">
  <MyCustomButton @click="signIn" :loading="status === 'loading'" />
</SignInButton>
```

## Electron Token Storage

`ElectronTokenStorage` stores OAuth2 tokens via IPC bridge to the Electron main process. Falls back to localStorage if the Electron API is not available.

```tsx
import { ElectronTokenStorage } from '@docyrus/signin/electron'

// Auto-detects window.electronAPI
const storage = new ElectronTokenStorage()

// Or pass a custom IPC bridge
const storage = new ElectronTokenStorage(myElectronAPI)

// Custom key prefix
const storage = new ElectronTokenStorage(undefined, 'my_app_oauth2')
```

The Electron preload script must expose `storeGet`, `storeSet`, and `storeDelete` IPC methods via `contextBridge`.

## Auth Modes

### Standalone Mode (OAuth2 PKCE)

Used when the app runs directly in the browser (not in an iframe). The flow:

1. User clicks sign-in
2. Page redirects to Docyrus authorization endpoint
3. After login, redirects back with authorization code
4. Provider automatically exchanges code for tokens
5. Tokens stored in localStorage (or custom `tokenStorage`), auto-refreshed before expiry

### Iframe Mode (postMessage)

Used when the app is embedded in an iframe on `*.docyrus.app`. The flow:

1. Provider detects iframe environment and validates host origin
2. Host sends `{ type: 'signin', accessToken, refreshToken }` via `postMessage`
3. Provider creates API client with received tokens
4. When tokens expire, provider sends `{ type: 'token-refresh-request' }` to host
5. Host responds with fresh tokens

## SSR Support (Next.js)

Enable `ssr` on the client-side provider to sync the access token to a cookie. The cookie is written with `max-age` (matching the token lifetime) and `Secure` flag (on HTTPS origins) automatically.

### 1. Client — Enable SSR in AuthProvider

```tsx
<DocyrusAuthProvider
  apiUrl="https://alpha-api.docyrus.com"
  clientId="your-oauth2-client-id"
  scopes={['offline_access', 'Read.All', 'Users.Read']}
  callbackPath="/auth/callback"
  ssr
>
  {children}
</DocyrusAuthProvider>
```

The cookie is automatically **set** on login and token refresh, **cleared** on sign out, and **expires** with the token (via `max-age`).

### 2. Middleware — Route Protection

Use the pre-built `authMiddleware` for automatic route protection:

```ts
// middleware.ts
import { authMiddleware } from '@docyrus/signin/nextjs'

export default authMiddleware({
  publicRoutes: ['/login', '/callback'],
  loginPath: '/login',
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
```

Or use `getMiddlewareSession` for custom middleware logic:

```ts
// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { getMiddlewareSession } from '@docyrus/signin/nextjs'

export function middleware(request: NextRequest) {
  const session = getMiddlewareSession(request)
  if (
    !session.isAuthenticated &&
    request.nextUrl.pathname.startsWith('/dashboard')
  ) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}
```

### 3. Server Components — Authenticated API Calls

```tsx
import { cookies } from 'next/headers'
import { createServerClient, getSession } from '@docyrus/signin/nextjs'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)
  if (!session.isAuthenticated) redirect('/login')

  const client = createServerClient(cookieStore)
  const { data: user } = await client.get('/v1/users/me')
  return <div>Welcome, {user.name}</div>
}
```

### 4. Server Actions

```ts
'use server'
import { cookies } from 'next/headers'
import { createServerClient } from '@docyrus/signin/nextjs'

export async function getUser() {
  const client = createServerClient(await cookies())
  return client.get('/v1/users/me')
}
```

### Next.js SSR API Reference

| Function                          | Import                   | Usage                                          |
| --------------------------------- | ------------------------ | ---------------------------------------------- |
| `getSession(cookies)`             | `@docyrus/signin/nextjs` | Read auth session in server components/actions |
| `createServerClient(cookies)`     | `@docyrus/signin/nextjs` | Create authenticated `RestApiClient` on server |
| `authMiddleware(config)`          | `@docyrus/signin/nextjs` | Pre-built route protection middleware          |
| `getMiddlewareSession(request)`   | `@docyrus/signin/nextjs` | Read auth session in custom middleware         |
| `createMiddlewareClient(request)` | `@docyrus/signin/nextjs` | Create authenticated client in middleware      |

### Cookie Behavior

| Attribute  | Value                    | Reason                                           |
| ---------- | ------------------------ | ------------------------------------------------ |
| `path`     | `/`                      | Available to all routes                          |
| `SameSite` | `Lax`                    | Sent on same-site navigations                    |
| `Secure`   | Auto (`https:` only)     | Only sent over HTTPS in production               |
| `max-age`  | Token lifetime (seconds) | Expires with the token, survives browser restart |
| `httpOnly` | No                       | Client-side auth provider must read/write it     |

### Cookie Helper (Client-Side)

```tsx
import { getTokenFromCookie } from '@docyrus/signin'

const token = getTokenFromCookie() // reads 'docyrus-token' cookie
const token = getTokenFromCookie('custom-key') // custom cookie name
```

## Advanced Usage

### Core (Framework-Agnostic)

Core classes are exported for advanced use cases without any framework dependency:

```tsx
import {
  AuthManager,
  StandaloneOAuth2Auth,
  IframeAuth,
  detectAuthMode,
} from '@docyrus/signin/core'
```

### React Entrypoint

```tsx
import {
  DocyrusAuthProvider,
  useDocyrusAuth,
  useDocyrusClient,
  SignInButton,
  AuthManager,
  detectAuthMode,
} from '@docyrus/signin'
```

### Vue Entrypoint

```tsx
import {
  DocyrusAuthProvider,
  useDocyrusAuth,
  useDocyrusClient,
  SignInButton,
} from '@docyrus/signin/vue'
```

## Development

```bash
# Install dependencies
pnpm install

# Development mode with watch
pnpm dev

# Build the package
pnpm build

# Run linting
pnpm lint

# Type checking
pnpm typecheck
```

## License

MIT
