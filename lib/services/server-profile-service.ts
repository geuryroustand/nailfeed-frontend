import { cookies } from "next/headers";
import config from "@/lib/config";
import qs from "qs";
import { verifySession } from "@/lib/auth/session";
import { fetchUserPostsServer } from "./profile-posts-server-service";

/**
 * Server-side profile service for Next.js Server Components
 * Uses next/headers to get cookies
 */

interface UserProfile {
  id: number;
  documentId: string;
  username: string;
  displayName?: string;
  email?: string;
  bio?: string;
  profileImage?: {
    url: string;
    alternativeText?: string;
  };
  coverImage?: {
    url: string;
    alternativeText?: string;
  };
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified?: boolean;
  confirmed?: boolean;
  posts?: any[];
  createdAt: string;
  updatedAt: string;
}

interface ProfileResponse {
  user: UserProfile;
  isOwnProfile: boolean;
  isAuthenticated: boolean;
  isFollowing?: boolean;
}

interface ErrorResponse {
  error: true;
  message: string;
  requiresAuth?: boolean;
}

interface NotFoundResponse {
  notFound: true;
}

/**
 * Fetch user profile by documentId using the optimized backend API (Server Component version)
 */
export async function fetchUserProfileByDocumentId(
  documentId: string
): Promise<ProfileResponse | ErrorResponse | NotFoundResponse> {
  try {
    console.log(`[ServerProfileService] Fetching profile for documentId: ${documentId}`);

    // Get authentication from secure session
    const session = await verifySession();
    const userJwt = session?.strapiJWT;
    const serverToken = process.env.API_TOKEN;

    console.log(`[ServerProfileService] Session available: ${!!session}`);
    console.log(`[ServerProfileService] JWT Token available: ${!!userJwt}`);
    console.log(`[ServerProfileService] Server Token available: ${!!serverToken}`);
    if (userJwt) {
      console.log(`[ServerProfileService] JWT Token preview: ${userJwt.substring(0, 20)}...`);
    }

    const isAuthenticated = !!session && !!userJwt;
    const token = userJwt || serverToken;

    if (!token) {
      console.error("[ServerProfileService] No API token available");
      return { error: true, message: "No API token available" };
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:1337";

    // Use the user endpoint to get profile data only (posts will be fetched separately)
    const url = `${apiUrl}/api/users/${documentId}?populate[profileImage]=*&populate[coverImage]=*`;

    console.log(`[ServerProfileService] Fetching from: ${url}`);
    console.log(`[ServerProfileService] Using ${isAuthenticated ? 'user JWT' : 'server token'}`);

    let response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(userJwt && { "X-User-Context": "authenticated" }),
      },
      cache: "no-store", // Always fetch fresh data for profiles
      next: {
        revalidate: 0,
      },
    });

    // If user JWT fails with 401, fallback to server token
    let actuallyAuthenticated = isAuthenticated;
    if (!response.ok && response.status === 401 && userJwt && serverToken) {
      console.log(`[ServerProfileService] User JWT failed, trying with server token`);
      actuallyAuthenticated = false; // User is not actually authenticated
      response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serverToken}`,
        },
        cache: "no-store",
        next: {
          revalidate: 0,
        },
      });
    }

    if (!response.ok) {
      console.error(`[ServerProfileService] API request failed: ${response.status} ${response.statusText}`);

      if (response.status === 404) {
        return { notFound: true };
      }

      return {
        error: true,
        message: `Failed to fetch profile: ${response.status}`,
      };
    }

    const userData = await response.json();
    console.log(`[ServerProfileService] Raw API response:`, {
      documentId: userData?.documentId,
      username: userData?.username,
      isFollowing: userData?.isFollowing,
    });

    if (!userData || !userData.documentId) {
      console.log(`[ServerProfileService] User not found with documentId: ${documentId}`);
      return { notFound: true };
    }

    console.log(`[ServerProfileService] Found user:`, {
      documentId: userData.documentId,
      username: userData.username,
      isFollowing: userData.isFollowing,
    });

    // Fetch posts using the optimized posts endpoint
    console.log(`[ServerProfileService] Fetching posts for user: ${userData.username}`);
    const postsResult = await fetchUserPostsServer(documentId, 10);

    let userPosts: any[] = [];
    let postsCount = 0;

    if ("error" in postsResult) {
      console.error(`[ServerProfileService] Error fetching posts: ${postsResult.message}`);
      // Continue without posts rather than failing completely
      userPosts = [];
      postsCount = 0;
    } else {
      userPosts = postsResult.posts;
      postsCount = postsResult.total;
      console.log(`[ServerProfileService] Posts fetched successfully: ${userPosts.length} posts, ${postsCount} total`);
    }

    // Check if this is the user's own profile
    let isOwnProfile = false;
    let currentUserDocumentId: string | null = null;

    if (actuallyAuthenticated && session) {
      try {
        // Get current user info to determine if this is their own profile
        const meResponse = await fetch(`${apiUrl}/api/users/me`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.strapiJWT}`,
          },
          cache: "no-store",
        });

        if (meResponse.ok) {
          const currentUser = await meResponse.json();
          currentUserDocumentId = currentUser.documentId;
          isOwnProfile = currentUser.documentId === documentId;
          console.log(`[ServerProfileService] Own profile check: ${isOwnProfile}`);
        }
      } catch (error) {
        console.error("[ServerProfileService] Failed to fetch current user:", error);
      }
    }

    // The isFollowing status is now included in the user response when JWT is provided
    // Use the backend's calculated isFollowing value directly
    const isFollowing = userData.isFollowing;
    console.log(`[ServerProfileService] Follow status from user endpoint: ${isFollowing}`);

    // Transform the data to match frontend expectations
    const transformedUser: UserProfile = {
      id: userData.id,
      documentId: userData.documentId,
      username: userData.username,
      displayName: userData.displayName,
      bio: userData.bio,
      profileImage: userData.profileImage,
      coverImage: userData.coverImage,
      followersCount: userData.followersCount || 0, // Now calculated in backend
      followingCount: userData.followingCount || 0, // Now calculated in backend
      postsCount: postsCount, // Use actual posts count from posts endpoint
      isVerified: userData.isVerified || false,
      confirmed: userData.confirmed || false,
      posts: userPosts, // Use posts from posts endpoint
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    };

    const result: ProfileResponse = {
      user: transformedUser,
      isOwnProfile,
      isAuthenticated: actuallyAuthenticated,
      isFollowing,
    };

    console.log(`[ServerProfileService] Returning profile data:`, {
      username: result.user.username,
      isOwnProfile: result.isOwnProfile,
      isAuthenticated: result.isAuthenticated,
      isFollowing: result.isFollowing,
      followersCount: result.user.followersCount,
      followingCount: result.user.followingCount,
      postsCount: result.user.postsCount,
      actualPostsLoaded: result.user.posts.length,
    });

    return result;

  } catch (error) {
    console.error("[ServerProfileService] Error fetching profile:", error);
    return {
      error: true,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}