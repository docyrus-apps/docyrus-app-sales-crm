# @docyrus/api-client

A modern, type-safe API client library for JavaScript/TypeScript applications with support for multiple backend types, streaming, error handling, and token management.

## Features

- 🚀 **Multiple Client Types**: REST, Edge Functions, and Cloudflare Workers
- 🔐 **Built-in Token Management**: Memory, Storage, and Async token managers
- 🔑 **OAuth2 Authentication**: Full OAuth2 support with PKCE, Device Code, and Client Credentials flows
- 🌊 **Streaming Support**: SSE and chunked responses
- 🔄 **Request/Response Interceptors**: Transform requests and handle responses
- ⚡ **Retry Logic**: Automatic retry with configurable conditions
- 🎯 **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🌐 **Isomorphic**: Works in both browser and Node.js environments
- 🛡️ **Comprehensive Error Handling**: Typed error classes for different scenarios
- ⏱️ **Timeout Support**: Configurable request timeouts with AbortController
- 📄 **HTML to PDF**: Built-in support for HTML to PDF conversion

## Installation

```bash
npm install @docyrus/api-client
```

```bash
yarn add @docyrus/api-client
```

```bash
pnpm add @docyrus/api-client
```

## Quick Start

```typescript
import { RestApiClient, MemoryTokenManager } from '@docyrus/api-client'

// Create a client instance
const client = new RestApiClient({
  baseURL: 'https://api.example.com',
  tokenManager: new MemoryTokenManager(),
  timeout: 5000,
  headers: {
    'X-API-Version': '1.0',
  },
})

// Set authentication token
await client.setAccessToken('your-auth-token')

// Make API calls
const response = await client.get('/users', {
  params: { page: 1, limit: 10 },
})

console.log(response.data)
```

## Client Types

### RestApiClient

Standard REST API client for traditional HTTP endpoints.

```typescript
import { RestApiClient } from '@docyrus/api-client'

const client = new RestApiClient({
  baseURL: 'https://api.example.com',
})

// GET request
const users = await client.get('/users')

// POST request with data
const newUser = await client.post('/users', {
  name: 'John Doe',
  email: 'john@example.com',
})

// PUT request
const updatedUser = await client.put('/users/123', {
  name: 'Jane Doe',
})

// DELETE request
await client.delete('/users/123')
```

### EdgeFunctionClient

Optimized for edge function deployments (Vercel, Netlify, etc.).

```typescript
import { EdgeFunctionClient } from '@docyrus/api-client'

const client = new EdgeFunctionClient({
  baseURL: 'https://edge.example.com',
})

// Invoke edge function
const result = await client.invokeFunction('processData', {
  input: 'data',
})

// Stream from edge function
for await (const chunk of client.streamFunction('generateContent', {
  prompt: 'Hello',
})) {
  console.log(chunk)
}
```

### CloudflareWorkerClient

Specialized client for Cloudflare Workers with dynamic function routing.

```typescript
import { CloudflareWorkerClient } from '@docyrus/api-client'

const client = new CloudflareWorkerClient({
  baseURL: 'https://{{function}}.example.workers.dev',
})

// Automatically replaces {{function}} with the function name
const response = await client.post('/myfunction/endpoint', data)
```

## Token Management

### MemoryTokenManager

Stores tokens in memory (default).

```typescript
import { MemoryTokenManager } from '@docyrus/api-client'

const tokenManager = new MemoryTokenManager()
tokenManager.setToken('token')
const token = tokenManager.getToken()
```

### StorageTokenManager

Persists tokens in browser storage.

```typescript
import { StorageTokenManager } from '@docyrus/api-client'

// Use localStorage
const localManager = new StorageTokenManager(localStorage, 'auth_token')

// Use sessionStorage
const sessionManager = new StorageTokenManager(sessionStorage, 'auth_token')
```

### AsyncTokenManager

For async token operations (e.g., secure storage, encrypted tokens).

```typescript
import { AsyncTokenManager } from '@docyrus/api-client'

const tokenManager = new AsyncTokenManager({
  async getToken() {
    return await secureStorage.get('token')
  },
  async setToken(token: string) {
    await secureStorage.set('token', token)
  },
  async clearToken() {
    await secureStorage.remove('token')
  },
})
```

## OAuth2 Authentication

The library includes a complete OAuth2 client supporting all standard flows with PKCE security.

### OAuth2Client Setup

```typescript
import { OAuth2Client, BrowserOAuth2TokenStorage } from '@docyrus/api-client'

const oauth2 = new OAuth2Client({
  baseURL: 'https://api.docyrus.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret', // Optional for public clients using PKCE
  redirectUri: 'http://localhost:3000/callback',
  defaultScopes: ['openid', 'offline_access'],
  usePKCE: true, // Enabled by default
  tokenStorage: new BrowserOAuth2TokenStorage(localStorage),
})
```

### Authorization Code Flow (with PKCE)

```typescript
// Step 1: Generate authorization URL
const { url, state, codeVerifier } = await oauth2.getAuthorizationUrl({
  scope: 'openid offline_access Users.Read',
})

// Step 2: Redirect user to authorization URL
window.location.href = url

// Step 3: Handle callback (after redirect back)
const tokens = await oauth2.handleCallback(window.location.href)
console.log('Access Token:', tokens.accessToken)
console.log('Refresh Token:', tokens.refreshToken)
```

### Client Credentials Flow

For server-to-server authentication:

```typescript
const tokens = await oauth2.getClientCredentialsToken({
  scope: 'Read.All',
  delegatedUserId: 'user-id-to-impersonate',
})
```

### Device Code Flow (RFC 8628)

For CLI tools and devices without a browser:

```typescript
// Step 1: Start device authorization
const deviceAuth = await oauth2.startDeviceAuthorization(
  'openid offline_access',
)

console.log(`Go to: ${deviceAuth.verification_uri}`)
console.log(`Enter code: ${deviceAuth.user_code}`)

// Step 2: Poll for completion
const tokens = await oauth2.pollDeviceAuthorization(
  deviceAuth.device_code,
  deviceAuth.interval,
  deviceAuth.expires_in,
  {
    onExpired: () => console.log('Code expired, please restart'),
    signal: abortController.signal,
  },
)
```

### Token Management

```typescript
// Get current tokens
const tokens = await oauth2.getTokens()

// Check if token is expired
const isExpired = await oauth2.isTokenExpired()

// Get valid access token (auto-refreshes if expired)
const accessToken = await oauth2.getValidAccessToken()

// Manually refresh tokens
const newTokens = await oauth2.refreshAccessToken()

// Revoke refresh token
await oauth2.revokeToken(tokens.refreshToken)

// Introspect token
const tokenInfo = await oauth2.introspectToken(tokens.accessToken)

// Logout (revokes token and clears storage)
await oauth2.logout()
```

### Check Rate Limits

```typescript
const rateLimit = await oauth2.checkRateLimit()
console.log(`Remaining: ${rateLimit.remaining}/${rateLimit.limit}`)
console.log(`Reset in: ${rateLimit.reset} seconds`)
```

### Integration with RestApiClient

Use OAuth2 tokens with the REST client:

```typescript
import {
  RestApiClient,
  OAuth2Client,
  OAuth2TokenManagerAdapter,
  BrowserOAuth2TokenStorage,
} from '@docyrus/api-client'

// Create shared token storage
const tokenStorage = new BrowserOAuth2TokenStorage(localStorage)

// Create OAuth2 client
const oauth2 = new OAuth2Client({
  baseURL: 'https://api.docyrus.com',
  clientId: 'your-client-id',
  tokenStorage,
})

// Create adapter for RestApiClient
const tokenManager = new OAuth2TokenManagerAdapter(
  tokenStorage,
  // Auto-refresh callback
  async () => {
    const tokens = await oauth2.refreshAccessToken()
    return tokens.accessToken
  },
)

// Create REST client with OAuth2 token management
const apiClient = new RestApiClient({
  baseURL: 'https://api.docyrus.com',
  tokenManager,
})

// Authenticate first
await oauth2.handleCallback(window.location.href)

// Now API calls automatically use OAuth2 tokens
const user = await apiClient.get('/v1/users/me')
```

### PKCE Utilities

Generate PKCE challenges manually:

```typescript
import {
  generatePKCEChallenge,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generateNonce,
} from '@docyrus/api-client'

// Generate complete PKCE challenge
const pkce = await generatePKCEChallenge()
console.log(pkce.codeVerifier) // Random verifier
console.log(pkce.codeChallenge) // SHA-256 hash (Base64URL)
console.log(pkce.codeChallengeMethod) // 'S256'

// Generate individual components
const verifier = generateCodeVerifier(64)
const challenge = await generateCodeChallenge(verifier)
const state = generateState()
const nonce = generateNonce()
```

### OAuth2 Error Handling

```typescript
import {
  OAuth2Error,
  InvalidGrantError,
  InvalidClientError,
  AccessDeniedError,
  AuthorizationPendingError,
  ExpiredTokenError,
} from '@docyrus/api-client'

try {
  await oauth2.refreshAccessToken()
} catch (error) {
  if (error instanceof InvalidGrantError) {
    // Refresh token expired or revoked
    console.log('Please login again')
  } else if (error instanceof InvalidClientError) {
    // Client authentication failed
    console.log('Client credentials invalid')
  } else if (error instanceof AccessDeniedError) {
    // User denied authorization
    console.log('Authorization denied')
  } else if (error instanceof ExpiredTokenError) {
    // Device code expired
    console.log('Code expired, please restart')
  } else if (error instanceof OAuth2Error) {
    // Generic OAuth2 error
    console.log(`OAuth2 error: ${error.errorCode} - ${error.errorDescription}`)
  }
}
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Required
DOCYRUS_CLIENT_ID=your-client-id
DOCYRUS_REDIRECT_URI=http://localhost:3000/callback

# Optional (for confidential clients)
DOCYRUS_CLIENT_SECRET=your-client-secret

# Optional
DOCYRUS_API_URL=https://api.docyrus.com
DOCYRUS_DEFAULT_SCOPES=openid offline_access
```

## Interceptors

Transform requests and handle responses globally.

```typescript
// Request interceptor
client.use({
  async request(config) {
    // Add timestamp to all requests
    config.headers = {
      ...config.headers,
      'X-Request-Time': new Date().toISOString(),
    }
    return config
  },
})

// Response interceptor
client.use({
  async response(response, request) {
    console.log(
      `API call to ${request.url} took ${Date.now() - request.timestamp}ms`,
    )
    return response
  },
})

// Error interceptor
client.use({
  async error(error, request, response) {
    if (error.status === 401) {
      // Handle authentication errors
      await refreshToken()
      throw error
    }
    return { error, request, response }
  },
})
```

## Streaming

### Server-Sent Events (SSE)

```typescript
const eventSource = client.sse('/events', {
  onMessage(data) {
    console.log('Received:', data)
  },
  onError(error) {
    console.error('SSE error:', error)
  },
  onComplete() {
    console.log('Stream completed')
  },
})

// Stop the stream
eventSource.close()
```

### Chunked Streaming

```typescript
for await (const chunk of client.stream('/stream', {
  method: 'POST',
  body: { query: 'stream data' },
})) {
  console.log('Chunk:', chunk)
}
```

## Error Handling

Comprehensive error types for different scenarios:

```typescript
import {
  ApiError,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  // OAuth2 errors
  OAuth2Error,
  InvalidGrantError,
  InvalidClientError,
  AccessDeniedError,
} from '@docyrus/api-client'

try {
  const data = await client.get('/protected-resource')
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle authentication error (401)
    console.log('Please login')
  } else if (error instanceof AuthorizationError) {
    // Handle authorization error (403)
    console.log('Access denied')
  } else if (error instanceof NotFoundError) {
    // Handle not found error (404)
    console.log('Resource not found')
  } else if (error instanceof RateLimitError) {
    // Handle rate limit error (429)
    console.log(`Rate limited. Retry after: ${error.retryAfter}`)
  } else if (error instanceof NetworkError) {
    // Handle network errors
    console.log('Network issue')
  } else if (error instanceof TimeoutError) {
    // Handle timeout errors
    console.log('Request timed out')
  }
}
```

## Advanced Features

### Retry Logic

```typescript
import { withRetry } from '@docyrus/api-client'

const response = await withRetry(() => client.get('/flaky-endpoint'), {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error) => error.status >= 500,
})
```

### File Upload

```typescript
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('description', 'File description')

const response = await client.post('/upload', formData, {
  headers: {
    // Content-Type will be set automatically for FormData
  },
})
```

### File Download

```typescript
const response = await client.get('/download/file.pdf', {
  responseType: 'blob',
})

// Save the file
const url = URL.createObjectURL(response.data)
const link = document.createElement('a')
link.href = url
link.download = 'file.pdf'
link.click()
```

### HTML to PDF

```typescript
const pdfResult = await client.html2pdf({
  url: 'https://example.com',
  // or
  html: '<html><body>Content</body></html>',
  options: {
    format: 'A4',
    margin: { top: 10, bottom: 10, left: 10, right: 10 },
    landscape: false,
  },
})
```

### Run Custom Query

Run a custom query/report by its id.

```typescript
const results = await client.runCustomQuery(customQueryId, options)
```

This uses:

- `PUT reports/runCustomQuery/:customQueryId` (body = `options`)

### Filter Queries

```typescript
import { prepareFilterQueryForApi } from '@docyrus/api-client'

const filter = {
  operator: 'and',
  rules: [
    { field: 'status', operator: 'eq', value: 'active' },
    { field: 'age', operator: 'gte', value: 18 },
  ],
}

const queryString = prepareFilterQueryForApi(filter)
const response = await client.get(`/users?${queryString}`)
```

## Configuration Options

```typescript
interface ApiClientConfig {
  // Base URL for all requests
  baseURL?: string

  // Token manager instance
  tokenManager?: TokenManager

  // Default headers
  headers?: Record<string, string>

  // Request timeout in milliseconds
  timeout?: number

  // Custom fetch implementation
  fetch?: typeof fetch

  // Custom FormData implementation
  FormData?: typeof FormData

  // Custom AbortController implementation
  AbortController?: typeof AbortController

  // Storage for persistence (browser only)
  storage?: Storage
}
```

## Utility Functions

```typescript
import {
  buildUrl,
  isAbortError,
  parseContentDisposition,
  isFormData,
  isBlob,
  isStream,
  createAbortSignal,
  jsonToQueryString,
} from '@docyrus/api-client'

// Build URL with query parameters
const url = buildUrl('/api/users', { page: 1, limit: 10 })
// Result: /api/users?page=1&limit=10

// Check if error is abort error
if (isAbortError(error)) {
  console.log('Request was aborted')
}

// Parse content disposition header
const { filename, type } = parseContentDisposition(
  'attachment; filename="document.pdf"',
)

// Create abort signal with timeout
const signal = createAbortSignal(5000) // 5 second timeout
```

## TypeScript Support

Full TypeScript support with generic types:

```typescript
interface User {
  id: number
  name: string
  email: string
}

interface ApiResponse<T> {
  data: T
  meta: {
    page: number
    total: number
  }
}

// Typed responses
const response = await client.get<ApiResponse<User[]>>('/users')
const users: User[] = response.data.data

// Typed request bodies
const newUser = await client.post<User>('/users', {
  name: 'John Doe',
  email: 'john@example.com',
} as Omit<User, 'id'>)
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Node.js: 18+

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT © Docyrus

## Support

For issues and feature requests, please [open an issue](https://github.com/docyrus/docyrus-ai-toolkit/issues) on GitHub.

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

# Publish package
pnpm publish
```
