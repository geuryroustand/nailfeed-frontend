# Web Push Notifications Setup

This document describes the web push notification system for reaction notifications in the NailFeed app.

## Overview

When users react to posts (like, love, haha, wow, sad, angry), the system automatically sends web push notifications to the post author across all their registered devices.

## Required Environment Variables

Add these environment variables to your Next.js project:

### Server-only Variables (DO NOT prefix with NEXT*PUBLIC*)

\`\`\`env

# VAPID Keys for Web Push

VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_SUBJECT=mailto:hello@nailfeed.com

# Strapi API Token (with permissions to read/write push-subscriptions, posts, and likes)

API_TOKEN=your_strapi_api_token_here
\`\`\`

### Generate VAPID Keys

You can generate VAPID keys using the web-push library:
\`\`\`bash
npx web-push generate-vapid-keys
\`\`\`

## Server Action Entry Point

The main entry point is in `app/actions/reaction-actions.ts`:

- `addReaction()` - Creates reactions and triggers push notifications

## Strapi Queries Used

### 1. Fetch User Push Subscriptions

\`\`\`
GET /api/push-subscriptions?filters[user][id][$eq]={userId}&filters[isActive][$eq]=true
\`\`\`

### 2. Get Post Author

\`\`\`
GET /api/posts/{postId}?populate=user
\`\`\`

### 3. Cleanup Invalid Subscriptions

\`\`\`
DELETE /api/push-subscriptions/{subscriptionId}
\`\`\`

## Key Features

### No Self-Notifications

- Users don't receive notifications for reactions on their own posts
- Check: `postAuthor.id !== reactor.id`

### Multiple Device Support

- Fetches all active push subscriptions for the post author
- Sends notifications to each device independently

### Automatic Cleanup

- Handles 404/410 errors from push services
- Automatically removes invalid subscriptions from Strapi
- Error codes handled: `InvalidRegistration`, `NotRegistered`

### Notification Payload

\`\`\`json
{
"title": "New reaction 💅",
"body": "Someone reacted {emoji} to your post.",
"url": "/post/{postId}",
"icon": "/icon-192x192.png",
"badge": "/icon-192x192.png"
}
\`\`\`

## Test Cases

### 1. Notify Other User

\`\`\`typescript
// User A reacts to User B's post
// Expected: User B receives notification on all devices
await addReaction(postId, 'love', postDocumentId)
\`\`\`

### 2. No Self-Notify

\`\`\`typescript
// User A reacts to their own post
// Expected: No notification sent
await addReaction(ownPostId, 'like', ownPostDocumentId)
\`\`\`

### 3. Multiple Devices

\`\`\`typescript
// User has 3 active push subscriptions
// Expected: 3 notifications sent (one per device)
\`\`\`

### 4. Cleanup on 404/410

\`\`\`typescript
// Push service returns 404/410 for invalid subscription
// Expected: Subscription deleted from Strapi database
\`\`\`

## File Structure

\`\`\`
lib/services/web-push-service.ts # Core web push functionality
app/actions/reaction-actions.ts # Modified to trigger notifications
WEB_PUSH_README.md # This documentation
\`\`\`

## Error Handling

- Push notification failures don't affect reaction creation
- Invalid subscriptions are automatically cleaned up
- All errors are logged for debugging
- Graceful degradation when VAPID keys are missing

## Security Notes

- VAPID keys are server-only (never exposed to client)
- API token has minimal required permissions
- Push subscriptions are validated before sending
- No sensitive data in notification payloads
