"use client"

/**
 * Client-side service for fetching user posts with pagination for infinite scrolling
 */

interface Post {
  id: number;
  documentId: string;
  title?: string;
  description?: string;
  contentType: string;
  background?: any;
  media?: any[];
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PostsResponse {
  posts: Post[];
  hasMore: boolean;
  total: number;
}

interface ErrorResponse {
  error: true;
  message: string;
}

/**
 * First, get the user's numerical ID from their documentId (client-side)
 */
async function getUserIdFromDocumentIdClient(
  documentId: string
): Promise<number | null> {
  try {
    const params = new URLSearchParams({
      endpoint: `/api/users/${documentId}`,
      'fields[0]': 'id'
    });

    const userUrl = `/api/auth-proxy?${params.toString()}`;
    console.log(`[ProfilePostsClientService] Fetching user ID from: ${userUrl}`);

    const response = await fetch(userUrl);

    if (!response.ok) {
      console.error(`[ProfilePostsClientService] Failed to fetch user: ${response.status}`);
      return null;
    }

    const userData = await response.json();
    const userId = userData.id;
    console.log(`[ProfilePostsClientService] User ${documentId} has ID: ${userId}`);

    return userId;
  } catch (error) {
    console.error("[ProfilePostsClientService] Error fetching user ID:", error);
    return null;
  }
}

/**
 * Client-side version using fetch for infinite scrolling
 */
export async function fetchUserPostsClient(
  documentId: string,
  page: number = 1,
  limit: number = 10
): Promise<PostsResponse | ErrorResponse> {
  try {
    // Step 1: Get the user's numerical ID from their documentId
    const userId = await getUserIdFromDocumentIdClient(documentId);

    if (!userId) {
      return {
        error: true,
        message: "User not found",
      };
    }

    // Step 2: Use optimized fields for posts query with numerical user ID
    const params = new URLSearchParams({
      endpoint: '/api/posts',
      'filters[user][id][$eq]': userId.toString(),
      'fields[0]': 'id',
      'fields[1]': 'documentId',
      'fields[2]': 'title',
      'fields[3]': 'description',
      'fields[4]': 'contentType',
      'fields[5]': 'background',
      'fields[6]': 'galleryLayout',
      'fields[7]': 'likesCount',
      'fields[8]': 'commentsCount',
      'fields[9]': 'savesCount',
      'fields[10]': 'createdAt',
      'fields[11]': 'updatedAt',
      'populate[media][fields][0]': 'id',
      'populate[media][fields][1]': 'url',
      'populate[media][fields][2]': 'formats',
      'populate[media][fields][3]': 'mime',
      'populate[media][fields][4]': 'width',
      'populate[media][fields][5]': 'height',
      'populate[media][fields][6]': 'name',
      'populate[user][fields][0]': 'id',
      'populate[user][fields][1]': 'username',
      'populate[user][fields][2]': 'displayName',
      'populate[user][populate][profileImage][fields][0]': 'url',
      'populate[user][populate][profileImage][fields][1]': 'formats',
      'sort[0]': 'createdAt:desc',
      'pagination[page]': page.toString(),
      'pagination[pageSize]': limit.toString()
    });

    const url = `/api/auth-proxy?${params.toString()}`;

    console.log(`[ProfilePostsClientService] Client fetching posts for user ID ${userId}: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Failed to fetch posts: ${response.status}`);
    }

    const data = await response.json();

    console.log(`[ProfilePostsClientService] Client response:`, {
      postsCount: data.data?.length || 0,
      totalPages: data.meta?.pagination?.pageCount || 0,
      currentPage: data.meta?.pagination?.page || 1,
      total: data.meta?.pagination?.total || 0
    });

    // Debug: Log the first post's media structure if available
    if (data.data && data.data.length > 0) {
      const firstPost = data.data[0];
      console.log(`[ProfilePostsClientService] First post structure:`, {
        id: firstPost.id,
        documentId: firstPost.documentId,
        contentType: firstPost.contentType,
        hasMedia: !!firstPost.media,
        mediaCount: Array.isArray(firstPost.media) ? firstPost.media.length : 0,
        mediaStructure: firstPost.media ? firstPost.media.slice(0, 1) : null, // Log first media item
        hasUser: !!firstPost.user,
        userPopulated: firstPost.user ? Object.keys(firstPost.user) : null
      });
    }

    const posts = data.data || [];
    const pagination = data.meta?.pagination || {};

    const hasMore = pagination.page < pagination.pageCount;
    const total = pagination.total || 0;

    return {
      posts,
      hasMore,
      total
    };

  } catch (error) {
    console.error("[ProfilePostsClientService] Client error:", error);
    return {
      error: true,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}