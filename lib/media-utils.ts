/**
 * Media Utilities for Strapi v5 Direct Media Support
 *
 * This utility handles the new optimized media format only.
 * Legacy mediaItems support has been removed as the backend now uses direct media.
 */

import type { MediaItem } from "@/types/media";

export interface MediaFormat {
  id: string | number;
  type: "image" | "video";
  url: string;
  formats?: any;
  mime?: string;
  documentId?: string;
}

export interface PostWithMedia {
  id: number;
  documentId?: string;
  // Direct media field (Strapi v5 optimized)
  media?: MediaFormat[];
  contentType?:
    | "image"
    | "video"
    | "text-background"
    | "media-gallery"
    | "text";
  galleryLayout?: "grid" | "carousel" | "featured";
  [key: string]: any;
}

/**
 * Get normalized media from post
 */
export function getPostMedia(post: PostWithMedia): MediaFormat[] {
  // console.log("[MediaUtils] getPostMedia called with post:", {
  //   hasMedia: !!post.media,
  //   isArray: Array.isArray(post.media),
  //   mediaLength: post.media?.length,
  //   firstMediaItem: post.media?.[0],
  // });

  if (!post.media || !Array.isArray(post.media)) {
    console.log("[MediaUtils] No media or not array, returning empty array");
    return [];
  }

  return post.media
    .filter(Boolean)
    .map((mediaItem, index) => {
      const normalizedUrl = normalizeMediaUrl(mediaItem.url);
      // console.log("[MediaUtils] Processing media item:", {
      //   index,
      //   originalUrl: mediaItem.url,
      //   normalizedUrl,
      //   type: detectMediaType(mediaItem.url, mediaItem.mime),
      //   hasFormats: !!mediaItem.formats
      // });

      return {
        id: mediaItem.documentId || mediaItem.id || `media-${index}`,
        type: detectMediaType(mediaItem.url, mediaItem.mime),
        url: normalizedUrl,
        formats: mediaItem.formats,
        mime: mediaItem.mime,
        documentId: mediaItem.documentId,
      };
    })
    .sort((a, b) => {
      // If we have documentId, use that for sorting, otherwise use index
      const aSort =
        typeof a.id === "string" && a.id.includes("-")
          ? parseInt(a.id.split("-")[1])
          : 0;
      const bSort =
        typeof b.id === "string" && b.id.includes("-")
          ? parseInt(b.id.split("-")[1])
          : 0;
      return aSort - bSort;
    });
}

/**
 * Get the primary media item (first in order)
 */
export function getPrimaryMedia(post: PostWithMedia): MediaFormat | null {
  const mediaList = getPostMedia(post);
  return mediaList.length > 0 ? mediaList[0] : null;
}

/**
 * Check if post has any media
 */
export function hasMedia(post: PostWithMedia): boolean {
  return getPostMedia(post).length > 0;
}

/**
 * Get media count
 */
export function getMediaCount(post: PostWithMedia): number {
  return getPostMedia(post).length;
}

/**
 * Convert to MediaItem format for components that still expect it
 */
export function toMediaItems(post: PostWithMedia): MediaItem[] {
  const mediaList = getPostMedia(post);
  const mediaItems = mediaList.map((media, index) => ({
    id: String(media.id),
    type: media.type,
    url: media.url,
    formats: media.formats,
    order: index,
  }));

  // console.log("[MediaUtils] toMediaItems result:", {
  //   inputMediaCount: mediaList.length,
  //   outputItemsCount: mediaItems.length,
  //   firstItem: mediaItems[0],
  // });

  return mediaItems;
}

/**
 * Detect media type from URL or MIME type
 */
function detectMediaType(url: string, mime?: string): "image" | "video" {
  if (mime) {
    return mime.startsWith("image/") ? "image" : "video";
  }

  if (!url || typeof url !== "string") {
    return "image"; // Default fallback
  }

  const videoExtensions = [".mp4", ".webm", ".ogg", ".mov", ".avi"];
  const lowerUrl = url.toLowerCase();

  return videoExtensions.some((ext) => lowerUrl.includes(ext))
    ? "video"
    : "image";
}

/**
 * Normalize media URL to ensure it's absolute
 */
function normalizeMediaUrl(url: string): string {
  if (!url) return "";

  // Already absolute URL
  if (url.startsWith("http")) return url;

  // Blob URL (for preview)
  if (url.startsWith("blob:")) return url;

  // Relative URL from Strapi
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337";
  const baseUrl = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;

  if (url.startsWith("/")) {
    return `${baseUrl}${url}`;
  }

  return `${baseUrl}/${url}`;
}

/**
 * Get the best quality image URL from formats
 */
export function getBestImageUrl(
  media: MediaFormat,
  preferredSize?: "thumbnail" | "small" | "medium" | "large"
): string {
  if (!media.formats) return media.url;

  const formats = media.formats;

  // If a specific size is requested
  if (preferredSize && formats[preferredSize]?.url) {
    return normalizeMediaUrl(formats[preferredSize].url);
  }

  // Fallback priority: large -> medium -> small -> thumbnail -> original
  const priorities = ["large", "medium", "small", "thumbnail"];

  for (const size of priorities) {
    if (formats[size]?.url) {
      return normalizeMediaUrl(formats[size].url);
    }
  }

  return media.url;
}

/**
 * Get media format info for debugging
 */
export function getMediaInfo(post: PostWithMedia): {
  count: number;
  hasDirectMedia: boolean;
  primaryType?: "image" | "video";
  primaryUrl?: string;
} {
  const media = getPostMedia(post);
  const primary = media[0];

  return {
    count: media.length,
    hasDirectMedia: media.length > 0,
    primaryType: primary?.type,
    primaryUrl: primary?.url,
  };
}
