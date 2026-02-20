# @docyrus/signin

React authentication provider for Docyrus apps. Provides "Sign in with Docyrus" experience with automatic environment detection — standalone apps use OAuth2 Authorization Code + PKCE via page redirect, while iframe-embedded apps receive tokens via `window.postMessage` from the host.

## Features

- **Auto Environment Detection**: Detects standalone vs iframe mode automatically
- **OAuth2 PKCE**: Full Authorization Code flow with PKCE (S256) for standalone apps
- **Iframe Auth**: Receives tokens via `postMessage` from `*.docyrus.app` hosts
- **Token Auto-Refresh**: Proactive token refresh before expiry in both modes
- **React Hooks**: `useDocyrusAuth()` and `useDocyrusClient()` for easy integration
- **Ready-to-Use API Client**: Exposes a configured `RestApiClient` from `@docyrus/api-client`
- **SignInButton**: Unstyled, customizable sign-in button component
- **TypeScript**: Full type definitions included

## Installation

```bash
npm install @docyrus/signin
```

```bash
pnpm add @docyrus/signin
```

### Peer Dependencies

- `react` >= 18.0.0
- `@docyrus/api-client` >= 0.0.4

## Quick Start

```tsx
import {
  DocyrusAuthProvider,
  useDocyrusAuth,
  useDocyrusClient,
  SignInButton,
} from '@docyrus/signin'

function App() {
  return (
    <DocyrusAuthProvider>
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

## Configuration

Pass props to `DocyrusAuthProvider` to override defaults:

```tsx
<DocyrusAuthProvider
  apiUrl="https://alpha-api.docyrus.com"
  clientId="your-oauth2-client-id"
  redirectUri="http://localhost:3000/auth/callback"
  scopes={['offline_access', 'Read.All', 'Users.Read']}
  callbackPath="/auth/callback"
  forceMode="standalone"
>
  <App />
</DocyrusAuthProvider>
```

| Prop                 | Type                       | Default                                 | Description                   |
| -------------------- | -------------------------- | --------------------------------------- | ----------------------------- |
| `apiUrl`             | `string`                   | `https://alpha-api.docyrus.com`         | Docyrus API base URL          |
| `clientId`           | `string`                   | Built-in default                        | OAuth2 client ID              |
| `redirectUri`        | `string`                   | `window.location.origin + callbackPath` | OAuth2 redirect URI           |
| `scopes`             | `string[]`                 | `['offline_access', 'Read.All', ...]`   | OAuth2 scopes                 |
| `callbackPath`       | `string`                   | `/auth/callback`                        | Path to detect OAuth callback |
| `forceMode`          | `'standalone' \| 'iframe'` | Auto-detected                           | Force a specific auth mode    |
| `storageKeyPrefix`   | `string`                   | `docyrus_oauth2_`                       | localStorage key prefix       |
| `allowedHostOrigins` | `string[]`                 | `undefined`                             | Extra trusted iframe origins  |

## Hooks

### useDocyrusAuth()

Returns the full authentication context:

```tsx
const {
  status, // 'loading' | 'authenticated' | 'unauthenticated'
  mode, // 'standalone' | 'iframe'
  client, // RestApiClient | null
  tokens, // { accessToken, refreshToken, ... } | null
  signIn, // () => void (redirects to Docyrus login)
  signOut, // () => void
  error, // Error | null
} = useDocyrusAuth()
```

### useDocyrusClient()

Shorthand hook that returns just the API client:

```tsx
const client = useDocyrusClient() // RestApiClient | null

if (client) {
  const response = await client.get('/v1/users/me')
}
```

## Components

### SignInButton

Unstyled button that triggers sign-in. Automatically hidden when authenticated or in iframe mode.

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

## Auth Modes

### Standalone Mode (OAuth2 PKCE)

Used when the app runs directly in the browser (not in an iframe). The flow:

1. User clicks sign-in
2. Page redirects to Docyrus authorization endpoint
3. After login, redirects back with authorization code
4. Provider automatically exchanges code for tokens
5. Tokens stored in localStorage, auto-refreshed before expiry

### Iframe Mode (postMessage)

Used when the app is embedded in an iframe on `*.docyrus.app`. The flow:

1. Provider detects iframe environment and validates host origin
2. Host sends `{ type: 'signin', accessToken, refreshToken }` via `postMessage`
3. Provider creates API client with received tokens
4. When tokens expire, provider sends `{ type: 'token-refresh-request' }` to host
5. Host responds with fresh tokens

## Advanced Usage

Core classes are exported for advanced use cases:

```tsx
import {
  AuthManager,
  StandaloneOAuth2Auth,
  IframeAuth,
  detectAuthMode,
} from '@docyrus/signin'
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
