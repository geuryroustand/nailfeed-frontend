import { cookies } from "next/headers";
import config from "@/lib/config";

/**
 * Service for fetching user posts with pagination for infinite scrolling
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
 * First, get the user's numerical ID from their documentId
 */
async function getUserIdFromDocumentId(
  documentId: string,
  token: string,
  apiUrl: string
): Promise<number | null> {
  try {
    const userUrl = `${apiUrl}/api/users/${documentId}?fields[0]=id`;
    console.log(`[ProfilePostsService] Fetching user ID from: ${userUrl}`);

    const response = await fetch(userUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[ProfilePostsService] Failed to fetch user: ${response.status}`);
      return null;
    }

    const userData = await response.json();
    const userId = userData.id;
    console.log(`[ProfilePostsService] User ${documentId} has ID: ${userId}`);

    return userId;
  } catch (error) {
    console.error("[ProfilePostsService] Error fetching user ID:", error);
    return null;
  }
}

/**
 * Fetch user posts with pagination for infinite scrolling
 */
export async function fetchUserPosts(
  documentId: string,
  page: number = 1,
  limit: number = 10
): Promise<PostsResponse | ErrorResponse> {
  try {
    console.log(`[ProfilePostsService] Fetching posts for user ${documentId}, page ${page}, limit ${limit}`);

    // Get authentication tokens from cookies (server-side only)
    const cookieStore = await cookies();
    const userJwt = cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value;
    const serverToken = process.env.API_TOKEN;

    const isAuthenticated = !!userJwt;
    const token = userJwt || serverToken;

    if (!token) {
      console.error("[ProfilePostsService] No API token available");
      return { error: true, message: "No API token available" };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:1337";

    // Step 1: Get the user's numerical ID from their documentId
    const userId = await getUserIdFromDocumentId(documentId, token, apiUrl);

    if (!userId) {
      return {
        error: true,
        message: "User not found",
      };
    }

    // Step 2: Fetch posts using the numerical user ID with optimized fields
    const postsUrl = `${apiUrl}/api/posts?filters[user][id][$eq]=${userId}&fields[0]=id&fields[1]=documentId&fields[2]=title&fields[3]=description&fields[4]=contentType&fields[5]=background&fields[6]=galleryLayout&fields[7]=likesCount&fields[8]=commentsCount&fields[9]=savesCount&fields[10]=createdAt&fields[11]=updatedAt&populate[media][fields][0]=id&populate[media][fields][1]=url&populate[media][fields][2]=formats&populate[media][fields][3]=mime&populate[media][fields][4]=width&populate[media][fields][5]=height&populate[media][fields][6]=name&populate[user][fields][0]=id&populate[user][fields][1]=username&populate[user][fields][2]=displayName&populate[user][populate][profileImage][fields][0]=url&populate[user][populate][profileImage][fields][1]=formats&sort[0]=createdAt:desc&pagination[page]=${page}&pagination[pageSize]=${limit}`;

    console.log(`[ProfilePostsService] Fetching posts from: ${postsUrl}`);

    const response = await fetch(postsUrl, {
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
      console.error(`[ProfilePostsService] API request failed: ${response.status} ${response.statusText}`);
      return {
        error: true,
        message: `Failed to fetch posts: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log(`[ProfilePostsService] Posts response:`, {
      postsCount: data.data?.length || 0,
      totalPages: data.meta?.pagination?.pageCount || 0,
      currentPage: data.meta?.pagination?.page || 1,
      total: data.meta?.pagination?.total || 0
    });

    // Debug: Log the first post's structure
    if (data.data && data.data.length > 0) {
      const firstPost = data.data[0];
      console.log(`[ProfilePostsService] First post structure:`, {
        id: firstPost.id,
        documentId: firstPost.documentId,
        contentType: firstPost.contentType,
        hasMedia: !!firstPost.media,
        mediaCount: Array.isArray(firstPost.media) ? firstPost.media.length : 0,
        mediaStructure: firstPost.media ? firstPost.media.slice(0, 1) : null,
      });
    }

    const posts = data.data || [];
    const pagination = data.meta?.pagination || {};

    // Check if there are more pages
    const hasMore = pagination.page < pagination.pageCount;
    const total = pagination.total || 0;

    return {
      posts,
      hasMore,
      total
    };

  } catch (error) {
    console.error("[ProfilePostsService] Error fetching posts:", error);
    return {
      error: true,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

