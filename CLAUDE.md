

<!-- Source: .ruler/AGENTS.md -->

# Project Instructions

This is a React Single Page Application starter template built with modern tooling and best practices.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: TanStack Router (code-based routing)
- **Data Fetching**: TanStack Query, TanStack DB
- **Styling**: Tailwind CSS v4 with @tailwindcss/vite
- **UI Components**:
  - **Docyrus UI** (19 components) - Production-ready components with Data Grid, Form Fields (47 types), Value Renderers (44 types), Query Builder, and more
  - **Animate UI** (21 components) - Fully animated components with smooth transitions and motion effects
  - **Shadcn/ui** (43 components) - Foundation components built on Radix UI
  - **DiceUI** (42 components) - Extended component collection
  - **ReUI** (2 components) - Additional specialized components
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

### 2. **Component Organization & UI Libraries**

#### Component Selection Priority

**ALWAYS check `docs/preferred-components.md` before developing any UI component.** The project has 127+ pre-built components across 5 libraries:

1. **Docyrus UI** (19 components) - **PREFERRED for data-heavy features**
   - Data Grid - Virtualized spreadsheet with sorting, filtering, grouping, cell selection
   - Form Fields - 47 field types with TanStack Form integration
   - Value Renderers - 44 renderer types for read-only data display
   - Query Builder - Visual query builder component
   - Date/Time Pickers, File panels, Activity panels, Delete dialogs
   - **Use for**: Forms, tables, data visualization, record management

2. **Animate UI** (21 components) - **PREFERRED for animated interactions**
   - Dialog, Sheet, Popover, Dropdown Menu, Tabs (animated versions)
   - Avatar Group, Flip Card, Pin List, Radial Menu
   - Sidebar, Tooltip, Switch, Checkbox, Radio Group (animated versions)
   - **Use for**: Modals, navigation, interactive elements requiring smooth animations

3. **Shadcn/ui** (43 components) - Foundation components
   - Use when Docyrus UI or Animate UI don't have the needed component
   - Breadcrumb, Command, Card, Badge, Separator, Skeleton, etc.

4. **DiceUI** (42 components) - Extended components
   - Additional specialized components not in shadcn
   - Combobox, File Upload, Kanban, Action Bar, etc.

5. **ReUI** (2 components) - Specialized components
   - File Upload variations, Sortable lists

#### Component Installation

All components use the shadcn CLI:

```bash
# Docyrus UI components
pnpm dlx shadcn@latest add @docyrus/ui-data-grid
pnpm dlx shadcn@latest add @docyrus/ui-form-fields

# Animate UI components (preferred for animations)
pnpm dlx shadcn@latest add @animate-ui/dialog
pnpm dlx shadcn@latest add @animate-ui/sidebar

# Shadcn components
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
```

**Full component list**: See `docs/preferred-components.md` with install commands and documentation paths.

#### Layout Components

- **For page layouts, use `docs/preferred_layout_alternatives.md` to select an appropriate sidebar layout.**
- This should be the default approach for application layouts unless the user specifically requests no sidebar.
- The file contains various shadcn and animate-ui sidebar variants with descriptions and install commands.

#### File Organization

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

2. **UI Components - Component Library Priority**:
   - **ALWAYS check `docs/preferred-components.md` first** - Contains 127+ components across 5 libraries
   - **Docyrus UI (19 components)** - Use for data grids, forms (47 field types), value renderers (44 types), query builders
   - **Animate UI (21 components)** - Preferred for dialogs, sheets, popovers, tabs, sidebars (animated versions)
   - **Shadcn/ui (43 components)** - Foundation components when Docyrus UI or Animate UI don't have it
   - **DiceUI (42 components)** - Extended components like Combobox, Kanban, File Upload
   - **ReUI (2 components)** - Specialized sortable and file upload components
   - Install via: `pnpm dlx shadcn@latest add [component-name]`
   - Full documentation paths included in `docs/preferred-components.md`

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

## UI Component Libraries

### Docyrus UI Components (IMPORTANT)

The project includes specialized **Docyrus UI components** designed specifically for data-intensive applications. These components integrate seamlessly with the Docyrus API and TanStack ecosystem:

#### Key Docyrus UI Components:

1. **Data Grid** (`@docyrus/ui-data-grid`)
   - Virtualized, editable spreadsheet-like grid
   - Features: sorting, filtering, grouping, cell selection, keyboard navigation
   - Perfect for displaying and editing large datasets

2. **Form Fields** (`@docyrus/ui-form-fields`)
   - 47 field types with automatic dispatch via `DynamicFormField`
   - Powered by TanStack Form
   - Covers: text, number, date, select, file, relation fields, and more

3. **Value Renderers** (`@docyrus/ui-value-renderers`)
   - 44 renderer types with automatic dispatch via `DynamicValue`
   - Read-only value display for table cells, detail views, kanban cards
   - Handles: dates, numbers, money, users, relations, status, enums, files, etc.

4. **Query Builder** (`@docyrus/ui-query-builder`)
   - Visual query builder for constructing filters
   - Works with Docyrus API query syntax

5. **Data Table Filter** (`@docyrus/ui-data-table-filter`)
   - Composable filter bar for data tables
   - Supports text, number, date, option, and multi-option columns

6. **Date/Time Components**:
   - Date Time Picker, Day Picker, Duration Select, Calendar

7. **Data Management**:
   - Record Activity Panel - Display record history
   - Record Delete Confirm Dialog - Confirm delete with relation handling
   - File Attachment Panel - File attachment management
   - Comments Panel - Comment threads

**Documentation**: See `docs/components/docyrus-ui-components.md` for complete documentation of all Docyrus UI components.

### Animate UI Components

21 fully animated components providing smooth transitions and motion effects. These are **preferred over shadcn equivalents** for better UX:

- Dialogs, Sheets, Popovers, Dropdowns (animated versions)
- Sidebar (animated), Tabs (animated), Tooltips (animated)
- Form controls: Checkbox, Switch, Radio Group, Toggle (animated)
- Special: Flip Card, Pin List, Radial Menu, Preview Link Card

**Documentation**: See `docs/components/animate-ui/` folder for individual component docs.

### Component Selection Guidelines

**When building features, follow this priority:**

1. **Check Docyrus UI first** - For forms, tables, data display, record management
2. **Check Animate UI** - For modals, navigation, interactive elements needing animations
3. **Check Shadcn/DiceUI** - For foundation UI primitives not covered above
4. **Develop custom** - Only if no suitable component exists

**Always consult `docs/preferred-components.md`** before developing any new UI component.

## Backend Operations

- The only available backend operations are available in `openapi.json` file which is in OpenAPI 3.1 format
- All available entities are generated into `src/collections` folder
- There is no feature to add new data endpoints for now

%% docyrus-knowledge:begin %%
# Knowledge Graph Workflow

- If `docyrus/knowledge/` exists, run `docyrus knowledge search` before coding so you start from documented intent instead of rediscovering it from source files.
- Use `docyrus knowledge expand` when prompts contain `[[refs]]` so section names resolve to real file locations and summaries.
- Keep `docyrus/knowledge/` in sync whenever you change functionality, architecture, tests, or behavior.
- Before finishing, run `docyrus knowledge check` and fix any broken links, stale references, or missing `@docyrus` backlinks.
%% docyrus-knowledge:end %%
