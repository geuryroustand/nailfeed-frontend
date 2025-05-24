/**
 * Process posts data for gallery display
 * @param posts Raw posts data from API
 * @returns Processed posts optimized for gallery rendering
 */
export function processPostsForGallery(posts: any[]): any[] {
  if (!Array.isArray(posts)) return []

  return posts.map((post) => {
    // Extract the first media item for gallery thumbnail
    const firstMediaItem = getFirstMediaItem(post.mediaItems)

    return {
      id: post.id,
      documentId: post.documentId || post.id.toString(),
      title: post.title || "",
      description: post.description || "",
      contentType: post.contentType || "media-gallery",
      galleryLayout: post.galleryLayout || "grid",
      publishedAt: post.publishedAt || post.createdAt,
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      savesCount: post.savesCount || 0,
      thumbnailUrl: firstMediaItem?.file?.url || "",
      mediaItemsCount: Array.isArray(post.mediaItems) ? post.mediaItems.length : 0,
      // Keep full mediaItems for detailed view
      mediaItems: post.mediaItems || [],
    }
  })
}

/**
 * Get the first media item from a post for thumbnail display
 */
function getFirstMediaItem(mediaItems: any): any | null {
  if (!mediaItems) return null

  // Handle different API response structures
  const items = Array.isArray(mediaItems)
    ? mediaItems
    : mediaItems.data && Array.isArray(mediaItems.data)
      ? mediaItems.data
      : []

  if (items.length === 0) return null

  const firstItem = items[0]
  const mediaItemData = firstItem.attributes || firstItem

  return {
    id: mediaItemData.id || firstItem.id,
    type: mediaItemData.type || "image",
    file: extractFileData(mediaItemData.file),
  }
}

/**
 * Extract file data from API response
 */
function extractFileData(file: any): any {
  if (!file) return { url: "" }

  // Case 1: Direct file object with url
  if (file.url) {
    return file
  }

  // Case 2: Strapi data structure
  if (file.data && file.data.attributes) {
    return file.data.attributes
  }

  // Case 3: Strapi data structure with just data
  if (file.data) {
    return file.data
  }

  return { url: "" }
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
