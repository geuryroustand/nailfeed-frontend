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
- Client actions for mutations (in `/app/actions/`)
- Service layer in `/lib/services/` for business logic

### Important Configuration

**Next.js Config:**

- TypeScript and ESLint errors ignored during builds (production deployment configured)
- Image optimization disabled with Railway backend domains whitelisted
- ESM externals set to 'loose' for package compatibility

**Environment Variables:**

- `NEXT_PUBLIC_API_URL` - Backend API URL (defaults to Railway production)
- `NEXT_PUBLIC_API_TOKEN` - Public API token for client requests
- Feature flags in `lib/config.ts` for analytics, comments, reactions, social auth

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

### State Management

- Use appropriate Context provider for feature domain
- Context providers are hierarchically organized in layout.tsx
- Avoid creating new global state - extend existing contexts

### Styling

- Tailwind CSS with custom configuration
- UI components from shadcn/ui in `/components/ui/`
- Mobile-first responsive design with bottom navigation pattern

### NailFeed: Social Media Platform for Nail Art Enthusiasts

## Project Description

NailFeed is a specialized social media platform designed exclusively for nail art enthusiasts, professionals, and beauty aficionados. The platform creates a vibrant community where users can showcase their nail designs, discover trending styles, and connect with like-minded individuals passionate about nail artistry.

## Key Features

### Content Sharing & Discovery

- **Rich Media Posts**: Users can share photos and videos of nail designs with detailed descriptions and tags
- **Explore Feed**: Curated discovery page featuring trending designs and popular content
- **Media Galleries**: Support for multi-image posts with various layout options
- **Mood-Based Discovery**: Unique feature that analyzes user-uploaded outfit/makeup photos to recommend matching nail designs

### User Engagement

- **Interactive Reactions**: Like, comment, and save functionality for all posts
- **Collections**: Personal and shared collections to organize favorite nail designs
- **Stories**: Ephemeral content sharing for quick inspiration and behind-the-scenes looks

### User Experience

- **Responsive Design**: Fully responsive interface optimized for both mobile and desktop
- **Dark/Light Mode**: Customizable viewing experience
- **Intuitive Navigation**: Bottom navigation for mobile and sidebar for desktop

### Community Features

- **User Profiles**: Customizable profiles with highlights, stats, and galleries
- **Following System**: Follow favorite creators and build a personalized feed
- **Trending Analytics**: See what styles and techniques are gaining popularity

### Technical Capabilities

- **Advanced Search**: Filter content by style, color, technique, and more
- **Authentication**: Secure login with email or social providers
- **Real-time Updates**: Instant notifications for interactions
- **Offline Support**: Basic browsing capabilities even without internet connection

## Technical Stack

- **Frontend**: Next.js with React, utilizing the App Router for optimized page loading
- **Styling**: Tailwind CSS with custom design system based on shadcn/ui components
- **Animation**: Framer Motion for smooth, engaging UI interactions
- **State Management**: React Context API with custom hooks for global state
- **Authentication**: JWT-based authentication with secure token handling
- **API Integration**: RESTful API integration with server-side data fetching
- **Media Handling**: Advanced image processing and optimization
- **Deployment**: Vercel platform with environment variable configuration

## Target Audience

- Nail art professionals and salon owners
- Beauty influencers and content creators
- Nail art enthusiasts and hobbyists
- Fashion-forward individuals seeking nail design inspiration
- Beauty product companies and nail polish brands

## Unique Value Proposition

NailFeed stands out from general social media platforms by offering specialized features tailored specifically to nail art:

1. **Color Matching Technology**: The innovative mood feature that analyzes outfit colors to suggest complementary nail designs
2. **Industry-Specific Discovery**: Targeted exploration of nail trends without the noise of general social platforms
3. **Professional Showcase**: Portfolio-like presentation for nail artists to display their work
4. **Community Focus**: Connecting nail enthusiasts directly with professionals and like-minded individuals
5. **Technique Sharing**: Detailed posts that can include step-by-step techniques and product information

## Development Approach

The application follows modern web development best practices:

- Server-side rendering for improved SEO and performance
- Component-based architecture for maintainability
- Mobile-first responsive design
- Secure authentication and data handling
- Accessibility considerations throughout the interface
- Progressive enhancement for broad device support

NailFeed creates a dedicated digital space where nail art can be celebrated, shared, and discovered, connecting creators and enthusiasts in a visually stunning and user-friendly environment.
