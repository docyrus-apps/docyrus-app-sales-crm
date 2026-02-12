

<!-- Source: .ruler/AGENTS.md -->

# Project Instructions

This is a React Single Page Application starter template built with modern tooling and best practices.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: TanStack Router (code-based routing)
- **Data Fetching**: TanStack Query, TanStack DB
- **Styling**: Tailwind CSS v4 with @tailwindcss/vite
- **UI Components**: Shadcn/ui, diceui, and reui compatible setup
- **State Management**: Ready for TanStack Store integration
- **Authentication**: @docyrus/app-auth-ui (OAuth2 PKCE + iframe postMessage)
- **Testing**: Vitest with React Testing Library
- **Linting**: ESLint with TanStack config
- **Formatting**: Prettier

## Project Structure

```
src/
├── collections/      # Generated API collections (e.g., users.collection.ts)
├── components/       # Reusable UI components
│   └── ui/           # UI primitives (button, input, etc.)
├── integrations/     # Integration-specific code (TanStack Query setup)
├── lib/              # Utility functions and core services
│   ├── api.ts        # API client configuration (setter pattern for @docyrus/app-auth-ui client)
│   └── utils.ts      # General utilities
├── App.tsx           # Main app component
├── main.tsx          # Application entry point with routing setup
└── styles.css        # Global styles and Tailwind imports
```

## Development Commands

Always run these commands to ensure code quality:

```bash
pnpm dev          # Start development server on port 3000
pnpm build        # Build for production (runs Vite build + TypeScript check)
pnpm test         # Run tests with Vitest
pnpm lint         # Run ESLint
pnpm format       # Run Prettier
pnpm check        # Run both Prettier and ESLint with auto-fix
```

## Authentication

The project uses `@docyrus/app-auth-ui` for authentication. This library provides:

- **Auto Environment Detection**: Standalone apps use OAuth2 PKCE via redirect, iframe-embedded apps receive tokens via `postMessage`
- **Token Auto-Refresh**: Proactive token refresh before expiry in both modes
- **React Hooks**: `useDocyrusAuth()` and `useDocyrusClient()` for easy integration
- **SignInButton**: Customizable sign-in button component

### Environment Variables

Configure these in your `.env` file:

```bash
VITE_API_BASE_URL=https://localhost:3366        # Docyrus API base URL
VITE_OAUTH2_CLIENT_ID=your-client-id            # OAuth2 client ID
VITE_OAUTH2_REDIRECT_URI=http://localhost:3000/auth/callback  # Callback URL
VITE_OAUTH2_SCOPES=openid profile offline_access Users.Read DS.ReadWrite.All
```

### Using Authentication

```typescript
import { useDocyrusAuth, useDocyrusClient, SignInButton } from '@docyrus/app-auth-ui'

function MyComponent() {
  const { status, signOut } = useDocyrusAuth()
  const client = useDocyrusClient()

  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return <SignInButton />

  return <button onClick={signOut}>Sign Out</button>
}
```

### Auth Hooks API

**useDocyrusAuth()** returns:

- `status: 'loading' | 'authenticated' | 'unauthenticated'` - Auth state
- `mode: 'standalone' | 'iframe'` - Detected auth mode
- `client: RestApiClient | null` - Configured API client
- `tokens: { accessToken, refreshToken, ... } | null` - Current tokens
- `signIn: () => void` - Initiates sign-in flow
- `signOut: () => void` - Logs out and clears tokens
- `error: Error | null` - Any auth error

**useDocyrusClient()** returns:

- `RestApiClient | null` - Shorthand for the API client

### API Client Pattern

The `DocyrusAuthProvider` manages the `RestApiClient` internally. For non-React modules (e.g., collections), `src/lib/api.ts` exposes a `setApiClient()` / `getApiClient()` pattern. The App component syncs the library's client to the module-level instance on mount.

### Key Files

- `src/main.tsx` - DocyrusAuthProvider setup with env var configuration
- `src/App.tsx` - Uses useDocyrusAuth/useDocyrusClient, syncs API client
- `src/lib/api.ts` - Module-level API client with setter pattern and interceptors
- `docs/@docyrus/app-auth-ui.md` - Full library documentation

## Key Conventions

### 1. **Routing**

- Currently using code-based routing in `main.tsx`
- Routes are defined using `createRoute` from TanStack Router
- Add new routes to the `routeTree` in main.tsx
- Current routes:
  - `/` - Main app (protected, shows login if not authenticated)
  - `/auth/callback` - Handled automatically by DocyrusAuthProvider

### 2. **Component Organization**

- **Before developing a component, check `docs/preferred-components.md` to see if a suitable component exists; if not, develop a new component.** The file includes components from shadcn, diceui, and reui with install commands and local documentation paths.
- **For page layouts, use `docs/preferred_layout_alternatives.md` to select an appropriate sidebar layout.** This should be the default approach for application layouts unless the user specifically requests no sidebar. The file contains various shadcn sidebar variants with descriptions and install commands.
- Place reusable components in `src/components/`
- Route-specific components go in `src/routes/`
- Use TypeScript for all components
- Follow existing component patterns

### 3. **Styling**

- Use Tailwind CSS classes for styling
- The project uses Tailwind CSS v4 with the new Vite plugin
- Tailwind Animate is available for animations
- Global styles are in `src/styles.css`

### 4. **State Management**

- TanStack Query is set up for server state management
- Query client is configured in `src/integrations/tanstack-query/`
- For local state, the project is ready for TanStack Store integration
- Auth state is managed via `DocyrusAuthProvider` from `@docyrus/app-auth-ui`

### 5. **Data Management**

- Use TanStack Table for table UI generation
- Available Entity Types and TanStack DB collections are generated in `./src/collections/`
- When using collection's list and get methods always send columns parameter to select only the columns you need. If you do not send columns parameter, only id column will be returned.
- Use `UsersCollection.getMyInfo()` for profile information of the logged-in user
- Use `@docyrus/api-client` for API calls which is configured and exported in src/lib/api.ts

#### Data Source Query API Capabilities

The Docyrus data source get-items endpoint (and each generated collection's `.list()` method) accepts a powerful query payload (`ZodSelectQueryPayload`) that supports:

- **Column selection** with relation expansion `field(subfield)`, aliasing `alias:field`, spread `...field()`, and functions `field@upper`
- **Filtering** with nested AND/OR groups, 50+ operators (comparison, text search, date shortcuts like `today`/`this_month`/`last_7_days`, user-related like `active_user`, dynamic `in_next_x_days`, collection operators like `in`/`contains any`, null/empty checks)
- **Keyword search** via `filterKeyword` for full-text search
- **Sorting** by one or more fields with direction, including related field sorting
- **Pagination** with `limit`/`offset`
- **Aggregations** (`count`, `sum`, `avg`, `min`, `max`, `jsonb_agg`, `json_agg`, `array_agg`) with grouping, distinct, and min/max bounds
- **Formulas** — computed virtual columns: simple function calls, block/AST-based inline expressions (math, case/when, compare, boolean logic, type casting), and correlated subqueries against child tables
- **Pivot** — cross-tab grouping with date range series and matrix CTEs
- **Child queries** — fetch related child records as nested JSON arrays per parent row
- **Field expansion** — expand relation/user/enum fields to return full objects instead of IDs
- **Filtering by related record fields** using `rel_{{relation_field}}/{{field}}` syntax

**When to read `docs/docyrus-api-query-guide.md`:** Read this guide whenever you need to build a query payload for a collection's `.list()` method — especially when implementing filters, aggregations, formulas, pivot tables, child queries, or any non-trivial data fetching. It contains the full parameter reference, all operator definitions, and detailed examples for every feature.

### 6. **TypeScript Configuration**

- Strict mode is enabled
- Path alias `@/` is configured to point to `src/`
- Use ES2022 features
- Module resolution is set to "bundler" mode

### 7. **Testing**

- Tests use Vitest with jsdom environment
- Test files should use `.test.tsx` or `.test.ts` extension
- React Testing Library is available for component testing
- Wrap components that use `useDocyrusAuth()` with `<DocyrusAuthProvider>` in tests

### 8. **Code Quality**

- ALWAYS run `pnpm check` before considering work complete
- Follow the existing ESLint configuration (TanStack config)
- Use Prettier for consistent formatting
- No unused variables or parameters allowed

## Important Notes

1. **Authentication**: The app requires OAuth2 authentication. Users must sign in with Docyrus to access protected features.

2. **UI Components**: Use `pnpm dlx shadcn@latest add [component]` to add shadcn, diceui, or reui components. Refer to `docs/preferred-components.md` for the full list of available components and their install commands.

3. **Environment**: The project uses Vite's environment variable system. Use `import.meta.env` for env vars

4. **Performance**: Web Vitals is integrated for performance monitoring

5. **Build Tool**: The project uses Vite for fast development and optimized production builds

## Before Completing Any Task

1. Run `pnpm build` to ensure the TypeScript compilation succeeds
2. Run `pnpm test` if tests exist for the modified code
3. Run `pnpm check` to fix and verify code formatting and linting
4. Verify the development server runs without errors

## Adding New Features

When adding new features:

1. Follow the existing file and folder structure
2. Use TypeScript with proper type definitions
3. Add appropriate routing if needed
4. Include error boundaries for robust error handling
5. Consider adding tests for critical functionality
6. Update this file if introducing new patterns or dependencies

## Backend Operations

- The only available backend operations are available in `openapi.json` file which is in OpenAPI 3.1 format
- All available entities are generated into `src/collections` folder
- There is no feature to add new data endpoints for now
