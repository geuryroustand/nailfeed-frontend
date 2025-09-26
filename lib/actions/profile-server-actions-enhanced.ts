"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { getApiUrl } from "@/lib/api-helpers";
import qs from "qs";

/**
 * Get enhanced engagement statistics for a user profile
 */
export async function getProfileEngagementStats(username: string) {
  try {
    const token =
      cookies().get("jwt")?.value || cookies().get("authToken")?.value;

    if (!token) {
      return null;
    }

    const apiUrl = getApiUrl();

    // Fetch user's posts with engagement data
    const query = qs.stringify(
      {
        filters: {
          user: {
            username: {
              $eq: username,
            },
          },
        },
        populate: {
          reactions: true,
          comments: true,
          saves: true,
        },
      },
      { encodeValuesOnly: true }
    );

    const response = await fetch(`${apiUrl}/api/posts?${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 300, // Cache for 5 minutes
        tags: [`profile-engagement-${username}`],
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const posts = Array.isArray(data) ? data : data.data || [];

    // Calculate engagement statistics
    let totalLikes = 0;
    let totalComments = 0;
    let totalSaves = 0;

    posts.forEach((post: any) => {
      totalLikes += post.likesCount || 0;
      totalComments += post.commentsCount || 0;
      totalSaves += post.savesCount || 0;
    });

    return {
      likes: totalLikes,
      comments: totalComments,
      saves: totalSaves,
    };
  } catch (error) {
    console.error("Error fetching engagement stats:", error);
    return null;
  }
}

/**
 * Prefetch profile data for better performance
 */
export async function prefetchProfileData(username: string) {
  try {
    const token =
      cookies().get("jwt")?.value || cookies().get("authToken")?.value;

    if (!token) {
      return;
    }

    const apiUrl = getApiUrl();

    // Prefetch profile data in the background
    const query = qs.stringify(
      {
        filters: {
          username: {
            $eq: username,
          },
        },
        populate: {
          profileImage: true,
          coverImage: true,
          posts: {
            sort: ["publishedAt:desc"],
            pagination: {
              limit: 12,
            },
            populate: {
              mediaItems: {
                populate: ["file"],
              },
            },
          },
        },
      },
      { encodeValuesOnly: true }
    );

    // Fire and forget - this is for prefetching
    fetch(`${apiUrl}/api/users?${query}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 60,
        tags: [`profile-${username}`],
      },
    }).catch(() => {
      // Silently fail for prefetch
    });
  } catch (error) {
    // Silently fail for prefetch
  }
}

/**
 * Revalidate profile cache
 */
export async function revalidateProfileCache(username: string) {
  try {
    revalidateTag(`profile-${username}`);
    revalidateTag(`profile-engagement-${username}`);
    revalidatePath(`/me/${username}`);
    revalidatePath("/me");
  } catch (error) {
    console.error("Error revalidating profile cache:", error);
  }
}

/**
 * Update profile view count
 */
export async function trackProfileView(username: string) {
  try {
    const token =
      cookies().get("jwt")?.value || cookies().get("authToken")?.value;

    if (!token) {
      return;
    }

    const apiUrl = getApiUrl();

    // Track profile view asynchronously
    fetch(`${apiUrl}/api/analytics/profile-view`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {
      // Silently fail for analytics
    });
  } catch (error) {
    // Silently fail for analytics
  }
}
