import { ensureAbsoluteUrl } from "@/lib/api-url-helper"

/**
 * Processes posts data for gallery display
 * @param posts Raw posts data
 * @returns Processed posts ready for gallery display
 */
export function processPostsForGallery(posts: any[] = []) {
  if (!Array.isArray(posts)) return []

  return posts.map((post) => {
    // Ensure we have all required fields with defaults
    const processedPost = {
      id: post.id,
      documentId: post.documentId || post.id.toString(),
      description: post.description || "",
      contentType: post.contentType || "media-gallery",
      galleryLayout: post.galleryLayout || "grid",
      publishedAt: post.publishedAt || post.createdAt || new Date().toISOString(),
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      savesCount: post.savesCount || 0,
      mediaItems: processMediaItemsForGallery(post.mediaItems),
      userId: post.userId || post.user?.id,
      authorId: post.authorId,
      user: post.user,
      userDocumentId: post.userDocumentId || post.user?.documentId,
    }

    return processedPost
  })
}

/**
 * Processes media items for gallery display
 * @param mediaItems Raw media items data
 * @returns Processed media items ready for gallery display
 */
function processMediaItemsForGallery(mediaItems: any[] = []) {
  if (!Array.isArray(mediaItems)) return []

  return mediaItems.map((item) => {
    const file = item.file || {}

    // Process file URLs to ensure they're absolute
    const processedFile = {
      ...file,
      url: ensureAbsoluteUrl(file.url || ""),
    }

    // Process formats if they exist
    if (file.formats) {
      processedFile.formats = {
        thumbnail: file.formats.thumbnail
          ? {
              ...file.formats.thumbnail,
              url: ensureAbsoluteUrl(file.formats.thumbnail.url || ""),
            }
          : undefined,
        small: file.formats.small
          ? {
              ...file.formats.small,
              url: ensureAbsoluteUrl(file.formats.small.url || ""),
            }
          : undefined,
        medium: file.formats.medium
          ? {
              ...file.formats.medium,
              url: ensureAbsoluteUrl(file.formats.medium.url || ""),
            }
          : undefined,
        large: file.formats.large
          ? {
              ...file.formats.large,
              url: ensureAbsoluteUrl(file.formats.large.url || ""),
            }
          : undefined,
      }
    }

    return {
      id: item.id,
      type: item.type || "image",
      order: item.order || 0,
      file: processedFile,
    }
  })
}
