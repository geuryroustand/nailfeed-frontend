/**
 * Process posts data for gallery display
 * @param posts Raw posts data from API
 * @returns Processed posts optimized for gallery rendering
 */
export function processPostsForGallery(posts: any[]): any[] {
  if (!Array.isArray(posts)) return []

  return posts.map((post) => {
    // In Strapi v5 with optimized queries, media is directly populated
    const mediaItems = post.media || []
    const firstMediaItem = getFirstMediaItem(mediaItems)

    console.log(`[processPostsForGallery] Processing post ${post.id}:`, {
      contentType: post.contentType,
      hasMedia: !!post.media,
      mediaCount: Array.isArray(mediaItems) ? mediaItems.length : 0,
      firstMediaUrl: firstMediaItem?.file?.url || firstMediaItem?.url,
    });

    return {
      id: post.id,
      documentId: post.documentId || post.id.toString(),
      title: post.title || "",
      description: post.description || "",
      contentType: post.contentType || "media-gallery",
      background: post.background,
      galleryLayout: post.galleryLayout || "grid",
      publishedAt: post.publishedAt || post.createdAt,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      savesCount: post.savesCount || 0,
      thumbnailUrl: firstMediaItem?.file?.url || firstMediaItem?.url || "",
      mediaItemsCount: Array.isArray(mediaItems) ? mediaItems.length : 0,
      // Keep full mediaItems for detailed view - use consistent naming
      mediaItems: mediaItems,
      user: post.user,
    }
  })
}

/**
 * Get the first media item from a post for thumbnail display
 */
function getFirstMediaItem(mediaItems: any): any | null {
  if (!mediaItems) {
    console.log('[getFirstMediaItem] No mediaItems provided');
    return null;
  }

  console.log('[getFirstMediaItem] Processing:', { mediaItems, isArray: Array.isArray(mediaItems) });

  // Handle Strapi v5 optimized query response - media is directly an array
  const items = Array.isArray(mediaItems) ? mediaItems : []

  if (items.length === 0) {
    console.log('[getFirstMediaItem] No items found after processing');
    return null;
  }

  const firstItem = items[0]
  console.log('[getFirstMediaItem] First item raw:', firstItem);

  // In Strapi v5 optimized queries, media files come directly with selected fields
  const result = {
    id: firstItem.id,
    type: firstItem.mime?.startsWith('video/') ? "video" : "image",
    file: extractFileData(firstItem),
    order: firstItem.order || 0,
    mime: firstItem.mime,
    // For backward compatibility, also include direct URL access
    url: firstItem.url,
  }

  console.log('[getFirstMediaItem] Processed result:', result);
  return result;
}

/**
 * Extract file data from API response for Strapi v5
 */
function extractFileData(file: any): any {
  console.log('[extractFileData] Input:', file);

  if (!file) {
    console.log('[extractFileData] No file provided');
    return { url: "" }
  }

  // In Strapi v5 optimized queries, files come with selected fields directly
  const result = {
    url: file.url || "",
    formats: file.formats,
    mime: file.mime,
    name: file.name,
    width: file.width,
    height: file.height,
  }

  console.log('[extractFileData] Optimized result:', result);
  return result;
}

/**
 * Process user data for optimized rendering
 */
export function processUserForProfile(user: any): any {
  return {
    ...user,
    // Ensure all required fields exist
    displayName: user.displayName || user.username,
    bio: user.bio || "",
    website: user.website || "",
    location: user.location || "",
    isVerified: user.isVerified || false,
    confirmed: user.confirmed || false,
    // Process stats
    stats: {
      posts: user.postsCount || user.stats?.posts || user.posts?.length || 0,
      followers: user.followersCount || user.stats?.followers || user.followers?.length || 0,
      following: user.followingCount || user.stats?.following || user.following?.length || 0,
    },
    // Process engagement
    engagement: user.engagement || {
      likes: 0,
      comments: 0,
      saves: 0,
    },
  }
}
