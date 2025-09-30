# Tutorials Feature

This document describes the tutorials feature implementation for the NailFeed application.

## Overview

The tutorials feature allows users to browse and view step-by-step nail art tutorials with filtering capabilities by level, technique, and duration.

## File Structure

\`\`\`
app/
  tutorials/
    page.tsx                          # Tutorials listing page
    [slug]/
      page.tsx                        # Tutorial detail page

components/
  tutorials/
    tutorial-card.tsx                 # Tutorial card component
    tutorial-filters.tsx              # Filter sidebar (client component)
    tutorial-grid.tsx                 # Grid layout for tutorials
    tutorial-grid-skeleton.tsx        # Loading skeleton
    tutorial-step.tsx                 # Individual step display

lib/
  tutorials.ts                        # Mock data layer
  tutorial-helpers.ts                 # Helper functions

types/
  tutorial.ts                         # TypeScript interfaces

strapi-schemas/
  tutorial-schema.json                # Strapi content-type schema
  tutorial-step-component.json        # Step component schema
  tutorial-material-component.json    # Material component schema
\`\`\`

## Features

### Tutorials Listing Page (`/tutorials`)

- **Header**: Title and subtitle
- **Filters**: Search, level, technique, duration (persisted in URL query params)
- **Grid**: Responsive card grid with tutorials
- **Loading States**: Skeleton loaders
- **Empty State**: Message when no tutorials match filters

### Tutorial Detail Page (`/tutorials/[slug]`)

- **Header**: Title, badges (level, technique, duration), author info
- **Media**: Video player or thumbnail image
- **Actions**: Like and Save to Look Book buttons
- **Description**: Tutorial overview
- **Materials**: List of required materials with optional brands
- **Steps**: Numbered step-by-step instructions with optional images
- **Comments**: Placeholder for future comments section

## Accessibility Features

- Semantic HTML (`<article>`, `<header>`, `<main>`)
- Proper ARIA labels and roles
- Keyboard navigation support
- Focus states visible
- Alt text for all images
- Color contrast meets WCAG AA standards
- Screen reader-only text where appropriate

## Data Layer

Currently using **mock data** in `lib/tutorials.ts`. The following functions are available:

- `listTutorials(filters, page, pageSize)` - Get paginated tutorials with filters
- `getTutorialBySlug(slug)` - Get single tutorial by slug
- `listTechniques()` - Get available techniques
- `listLevels()` - Get available levels
- `listDurations()` - Get duration options

## Replacing Mock Data with Strapi

When the Strapi backend is ready:

1. **Create Content-Type**: Use the schemas in `strapi-schemas/` to create the tutorial content-type and components in Strapi v5
2. **Update API Calls**: Replace mock functions in `lib/tutorials.ts` with actual API calls using the existing `PostService` pattern
3. **Use Auth Proxy**: Follow the pattern in `lib/services/post-service.ts` for authenticated requests
4. **Add Interactions**: Implement like, save, and comment functionality using server actions

### Example Strapi Query

\`\`\`typescript
const query = {
  fields: ["id", "documentId", "title", "slug", "description", "level", "technique", "duration", "videoUrl"],
  populate: {
    user: {
      fields: ["id", "username", "displayName", "documentId"],
      populate: { profileImage: { fields: ["url", "formats"] } },
    },
    thumbnail: { fields: ["id", "url", "formats", "mime"] },
    steps: { populate: { image: { fields: ["url", "formats"] } } },
    materials: true,
    tags: { fields: ["id", "name", "documentId"] },
  },
  pagination: { page, pageSize },
  sort: ["publishedAt:desc"],
}

const queryString = qs.stringify(query, { encodeValuesOnly: true })
const endpoint = `/api/tutorials?${queryString}`
\`\`\`

## Styling

- Uses existing Tailwind utilities and design tokens
- Follows project color scheme (primary: pink-600)
- Responsive design (mobile-first)
- Consistent with existing UI components (shadcn/ui)

## URL Query Parameters

Filters are persisted in URL using `nuqs`:

- `?q=search+term` - Search query
- `?level=beginner` - Filter by level
- `?technique=gel` - Filter by technique
- `?duration=short` - Filter by duration
- `?page=2` - Pagination

## Future Enhancements

- Pagination controls
- Infinite scroll option
- User interactions (like, save, comment)
- Related tutorials section
- Tutorial creation/editing interface
- Video upload support
- Print-friendly view
- Social sharing
