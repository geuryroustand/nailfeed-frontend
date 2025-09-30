import { verifySession } from "@/lib/auth/session";

/**
 * Server-side service for fetching user posts optimally from posts endpoint
 * Uses the correct posts endpoint instead of user endpoint for better performance
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
  user?: {
    id: number;
    username: string;
    displayName?: string;
    profileImage?: {
      url: string;
      formats?: any;
    };
  };
  createdAt: string;
  updatedAt: string;
}

interface PostsResponse {
  posts: Post[];
  total: number;
  hasMore: boolean;
}

interface ErrorResponse {
  error: true;
  message: string;
}

/**
 * Get user's numerical ID from documentId (server-side)
 */
async function getUserIdFromDocumentIdServer(
  documentId: string
): Promise<number | null> {
  try {
    const session = await verifySession();
    const userJwt = session?.strapiJWT;
    const serverToken = process.env.API_TOKEN;
    const token = userJwt || serverToken;

    if (!token) {
      console.error("[ProfilePostsServerService] No API token available");
      return null;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:1337";
    const url = `${apiUrl}/api/users/${documentId}?fields[0]=id`;

    console.log(`[ProfilePostsServerService] Fetching user ID from: ${url}`);

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[ProfilePostsServerService] Failed to fetch user: ${response.status}`);
      return null;
    }

    const userData = await response.json();
    const userId = userData.id;
    console.log(`[ProfilePostsServerService] User ${documentId} has ID: ${userId}`);

    return userId;
  } catch (error) {
    console.error("[ProfilePostsServerService] Error fetching user ID:", error);
    return null;
  }
}

/**
 * Fetch user posts from posts endpoint (server-side)
 * Uses optimized query with only necessary fields
 */
export async function fetchUserPostsServer(
  documentId: string,
  limit: number = 10
): Promise<PostsResponse | ErrorResponse> {
  try {
    console.log(`[ProfilePostsServerService] Fetching posts for documentId: ${documentId}`);

    // Step 1: Get the user's numerical ID
    const userId = await getUserIdFromDocumentIdServer(documentId);

    if (!userId) {
      return {
        error: true,
        message: "User not found",
      };
    }

    // Step 2: Get authentication
    const session = await verifySession();
    const userJwt = session?.strapiJWT;
    const serverToken = process.env.API_TOKEN;
    const token = userJwt || serverToken;

    if (!token) {
      console.error("[ProfilePostsServerService] No API token available");
      return {
        error: true,
        message: "No API token available",
      };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:1337";

    // Step 3: Build optimized posts query using posts endpoint
    const queryParams = new URLSearchParams({
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
      'pagination[page]': '1',
      'pagination[pageSize]': limit.toString()
    });

    const url = `${apiUrl}/api/posts?${queryParams.toString()}`;

    console.log(`[ProfilePostsServerService] Fetching from posts endpoint for user ID ${userId}`);
    console.log(`[ProfilePostsServerService] URL: ${url.substring(0, 100)}...`);

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(userJwt && { "X-User-Context": "authenticated" }),
      },
      cache: "no-store",
      next: {
        revalidate: 0,
      },
    });

    if (!response.ok) {
      console.error(`[ProfilePostsServerService] API request failed: ${response.status} ${response.statusText}`);
      return {
        error: true,
        message: `Failed to fetch posts: ${response.status}`,
      };
    }

    const data = await response.json();

    console.log(`[ProfilePostsServerService] Server response:`, {
      postsCount: data.data?.length || 0,
      totalPages: data.meta?.pagination?.pageCount || 0,
      total: data.meta?.pagination?.total || 0
    });

    // Debug: Log the first post's structure if available
    if (data.data && data.data.length > 0) {
      const firstPost = data.data[0];
      console.log(`[ProfilePostsServerService] First post structure:`, {
        id: firstPost.id,
        documentId: firstPost.documentId,
        contentType: firstPost.contentType,
        hasMedia: !!firstPost.media,
        mediaCount: Array.isArray(firstPost.media) ? firstPost.media.length : 0,
        hasUser: !!firstPost.user,
        userPopulated: firstPost.user ? Object.keys(firstPost.user) : null
      });
    }

    const posts = data.data || [];
    const pagination = data.meta?.pagination || {};
    const total = pagination.total || 0;
    const hasMore = pagination.page < pagination.pageCount;

    return {
      posts,
      total,
      hasMore
    };

  } catch (error) {
    console.error("[ProfilePostsServerService] Server error:", error);
    return {
      error: true,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
