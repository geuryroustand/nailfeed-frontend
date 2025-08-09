# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build production application
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint (currently disabled during builds via next.config.mjs)

## Architecture Overview

### Application Structure

NailFeed is a Next.js 15 social media platform for nail art enthusiasts with the following core architecture:

**Rendering Strategy:**

- Mixed Server/Client Components - Pages use Server Components for initial data fetching, Client Components for interactivity
- Multiple component variants: `-server.tsx`, `-client.tsx`, `-optimized.tsx`, `-enhanced.tsx` for different rendering strategies
- Key pattern: Server components fetch data, wrap Client components that handle state and interactions

**State Management:**

- Context-based architecture with hierarchical providers in app/layout.tsx:
  - `AuthProvider` - JWT authentication, user state, cookie management
  - `ProfileProvider` - User profile data and relationships
  - `CollectionsProvider` - User collections and curation
  - `MoodProvider` - Mood/try-on functionality
  - `ReactionProvider` - Post reactions and interactions

**API Integration:**

- Centralized API client (`lib/api-client.ts`) with Axios interceptors
- JWT tokens handled via both localStorage and cookies for compatibility
- Backend: Railway-hosted API at `https://nailfeed-backend-production.up.railway.app`
- Configuration centralized in `lib/config.ts` with environment fallbacks

### Key Patterns

**Component Organization:**

- Feature-based folder structure: `/components/[feature]/`
- UI components in `/components/ui/` (shadcn/ui based)
- Context providers in `/context/`
- Server actions in `/lib/actions/` and `/app/actions/`

**Authentication Flow:**

- JWT stored in cookies (`jwt`, `authToken`) and localStorage
- Middleware (`middleware.ts`) protects routes based on authentication
- Social auth supported via `/auth/social/[provider]` routes

**API Actions Pattern:**

- Server actions for data fetching (in `/lib/actions/`)
- Client actions in `/app/actions/` for form submissions and mutations
- Service layer in `/lib/services/` for business logic

### Important Configuration

**Environment Variables:**

- `NEXT_PUBLIC_API_URL` - Backend API URL (safe to expose to clients)
- Server-only secrets are accessed on the server (e.g., `API_TOKEN`) and are never read directly from Client Components. Client-side code should use Route Handlers or Server Actions to interact with privileged APIs. In Next.js, only env vars prefixed with `NEXT_PUBLIC_` are in the client bundle; unprefixed ones remain server-only [^5].

## Development Guidelines

### Working with Components

- Follow the Server/Client component split pattern
- Use `-server.tsx` suffix for Server Components that fetch data
- Use `-client.tsx` suffix for Client Components with state/interactions
- Always check existing component variants before creating new ones

### API Integration

- Use `lib/api-client.ts` for authenticated requests
- Server actions should be in `/lib/actions/` for data fetching
- Client actions in `/app/actions/` for form submissions and mutations
- Environment configuration handled via `lib/config.ts`

### Authentication

- JWT tokens automatically injected via axios interceptors
- Use `useAuth()` hook for client-side authentication state
- Protected routes defined in `middleware.ts`
- Cookie and localStorage token synchronization handled automatically

### Styling

- Tailwind CSS with custom configuration
- UI components from shadcn/ui in `/components/ui/`
- Mobile-first responsive design with bottom navigation pattern

### NailFeed: Social Media Platform for Nail Art Enthusiasts

NailFeed creates a dedicated digital space where nail art can be celebrated, shared, and discovered, connecting creators and enthusiasts in a visually stunning and user-friendly environment.

Notes:
- Client code must never embed secrets. Use Server Components, Server Actions, or Route Handlers for privileged operations [^1][^4][^5].
