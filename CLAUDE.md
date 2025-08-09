# CLAUDE.md

This document guides AI/code assistants contributing to this repository. It intentionally contains no API keys, tokens, or sensitive environment variable names or values.

## Development Commands

- pnpm dev — Start development server
- pnpm build — Build production application
- pnpm start — Start production server
- pnpm lint — Run ESLint (linting is not blocking builds)

## Architecture Overview

### Rendering Strategy
- Server Components fetch data; Client Components handle interactivity.
- Variants: `-server.tsx`, `-client.tsx`, `-optimized.tsx`, `-enhanced.tsx`.
- Prefer RSC and Server Actions where possible; limit `use client`.

### State Management
- Context providers (Auth, Profile, Collections, Mood, Reaction) are registered in `app/layout.tsx`.
- Extend existing contexts rather than introducing new global state.

### API Integration
- Use `lib/api-client.ts` (Axios instance with interceptors) for authenticated requests.
- Server actions live under `lib/actions/*` for data fetching.
- Client mutations live under `app/actions/*` (form submissions, optimistic UI).
- Configuration helpers are in `lib/config.ts` and related utils.

### Security and Environment Variables

Important:
- Never hardcode secrets or tokens in the repository.
- Never echo or paste real values into any code or documentation.
- Do not reference secret environment variables in Client Components or shared code executed in the browser.

Guidelines:
- Secrets and tokens must only be read on the server (Server Components, Route Handlers in `app/api/*`, or Server Actions).
- If the browser needs data that requires authentication with a secret, create a server endpoint (route handler or server action) that injects the secret on the server and returns only the non-sensitive data to the client.
- Only expose non-sensitive configuration to the client (e.g., public flags, feature toggles). Use clearly non-secret names for public values.

Patterns:
- Server-only usage (preferred):
  - Read secrets in:
    - Route Handlers: `app/api/.../route.ts`
    - Server Actions: `'use server'` modules
    - RSC modules that never run in the browser
- Client usage (avoid for anything sensitive):
  - Do not import or reference secret env vars in files that can be bundled to the browser.
  - For public, non-sensitive config, use explicit public flags that are known to be safe.

### Authentication
- JWT is managed by interceptors in `lib/api-client.ts` and by cookies.
- Use `useAuth()` in client components for auth state only; do not read server secrets in client code.

### Styling
- Tailwind CSS and shadcn/ui.
- Mobile-first, responsive patterns.

### Performance
- Favor RSC, streaming, and partial hydration.
- Minimize `useEffect` and client state; prefer server data dependencies.

## Development Tips

- Before introducing new environment variables, confirm if they need to be server-only or can be public and non-sensitive.
- For any operation that requires a secret, create a thin server-side function and call it from client code instead of shipping the secret to the browser.
- Do not include example values for environment variables in documentation. Describe them conceptually instead.

## Checklist for Contributions

- No secrets or tokens added to any file (including markdown).
- No server-only values referenced in client-bundled code.
- Data fetching happens on the server when possible.
- Follow existing component variant patterns and folder conventions.
