# React SPA Starter

## Technical Architecture

### Core Stack

- **React 19** + **TypeScript** - UI framework with type safety
- **Vite** - Build tool with HMR and optimized production builds
- **TanStack Router** - Type-safe, code-based routing
- **TanStack Query** - Server state management with caching
- **Tailwind CSS v4** - Utility-first styling with Vite plugin
- **Vitest** - Unit testing framework

### Project Structure

```
src/
├── components/          # Reusable UI components
├── integrations/        # Third-party service integrations
│   └── tanstack-query/ # Query client configuration
├── lib/                # Utility functions
├── routes/             # Route-specific components
├── App.tsx             # Root application component
├── main.tsx            # Entry point, routing setup
└── styles.css          # Global styles, Tailwind imports
```

### Key Configurations

- **TypeScript**: Strict mode, ES2022 target, bundler module resolution
- **Path Alias**: `@/` maps to `src/` directory
- **Routing**: Code-based routing in `main.tsx` (file-based optional)
- **Linting**: TanStack ESLint config + Prettier
- **Testing**: Vitest with jsdom environment

### Build & Development

```bash
pnpm dev      # Development server (port 3000)
pnpm build    # Production build + TypeScript check
pnpm test     # Run tests
pnpm check    # Format + lint with auto-fix
```
