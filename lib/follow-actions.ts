"use server";

import qs from "qs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export type FollowUser = {
  id: number | string;
  documentId: string;
  username: string;
  displayName: string;
  profileImage?: { url: string };
  isFollowing?: boolean;
};

export type FollowListResponse = {
  users: FollowUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isAuthenticated: boolean;
};

function getApiUrl(): string {
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://nailfeed-backend-production.up.railway.app"
  );
}

function getApiToken(): string | null {
  // Server-only token
  return process.env.API_TOKEN || null;
}

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const token = getApiToken();
    if (!token) throw new Error("No API token available");

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, {
      ...options,
      headers,
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Request failed:", error);
    throw error;
  }
}

async function getUserDocumentIdByUsername(
  username: string
): Promise<string | null> {
  try {
    const apiUrl = getApiUrl();
    const query = qs.stringify({ filters: { username: { $eq: username } } });
    const userResponse = await apiRequest<any>(`${apiUrl}/api/users?${query}`);
    const userData = userResponse.data || userResponse;
    if (!userData || !userData.length) return null;
    return userData[0].documentId || null;
  } catch (error) {
    console.error(`Error fetching user documentId for ${username}:`, error);
    return null;
  }
}

// Remaining exports unchanged in behavior, but rely on server token above
export async function getFollowers(
  username: string,
  page = 1,
  pageSize = 10
): Promise<FollowListResponse> {
  try {
    const apiUrl = getApiUrl();

    const cookieStore = cookies();
    const userToken =
      cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value;
    const isAuthenticated = !!userToken;

    const userDocumentId = await getUserDocumentIdByUsername(username);
    if (!userDocumentId) {
      return {
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        isAuthenticated,
      };
    }

    const followersQuery = qs.stringify({
      filters: { following: { documentId: { $eq: userDocumentId } } },
      populate: "*",
      pagination: { page, pageSize },
      sort: ["createdAt:desc"],
    });

    const followsResponse = await apiRequest<any>(
      `${apiUrl}/api/follows?${followersQuery}`
    );

    const followingDocumentIds = new Set<string>();
    if (isAuthenticated) {
      try {
        const meResponse = await fetch(
          `${apiUrl}/api/users/me?populate=following`,
          {
            headers: { Authorization: `Bearer ${userToken}` },
          }
        );
        if (meResponse.ok) {
          const meJson = await meResponse.json();
          if (meJson.following) {
            meJson.following.forEach((follow: any) => {
              const docId = follow.following?.documentId;
              if (docId) followingDocumentIds.add(docId);
            });
          }
        }
      } catch (err) {
        console.error("Error fetching current user following:", err);
      }
    }

    const users = (followsResponse.data || [])
      .map((follow: any) => {
        const follower = follow.follower;
        if (!follower) return null;
        const profileImageUrl =
          follower.profileImage && follower.profileImage.url
            ? follower.profileImage.url.startsWith("http")
              ? follower.profileImage.url
              : `${apiUrl}${follower.profileImage.url}`
            : "/abstract-user-icon.png";

        return {
          id: follower.id,
          documentId: follower.documentId,
          username: follower.username,
          displayName: follower.displayName || follower.username,
          profileImage: { url: profileImageUrl },
          isFollowing: followingDocumentIds.has(follower.documentId),
        } as FollowUser;
      })
      .filter(Boolean) as FollowUser[];

    return {
      users,
      total: followsResponse.meta?.pagination?.total || users.length,
      page: followsResponse.meta?.pagination?.page || page,
      pageSize: followsResponse.meta?.pagination?.pageSize || pageSize,
      totalPages:
        followsResponse.meta?.pagination?.pageCount ||
        Math.ceil(users.length / pageSize),
      isAuthenticated,
    };
  } catch (error) {
    console.error("Error in getFollowers:", error);
    return {
      users: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      isAuthenticated: false,
    };
  }
}

export async function getFollowing(
  username: string,
  page = 1,
  pageSize = 10
): Promise<FollowListResponse> {
  try {
    const apiUrl = getApiUrl();

    const cookieStore = cookies();
    const userToken =
      cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value;
    const isAuthenticated = !!userToken;

    const userDocumentId = await getUserDocumentIdByUsername(username);
    if (!userDocumentId) {
      return {
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        isAuthenticated,
      };
    }

    const followingQuery = qs.stringify({
      filters: { follower: { documentId: { $eq: userDocumentId } } },
      populate: "*",
      pagination: { page, pageSize },
      sort: ["createdAt:desc"],
    });

    const followsResponse = await apiRequest<any>(
      `${apiUrl}/api/follows?${followingQuery}`
    );

    const users = (followsResponse.data || [])
      .map((follow: any) => {
        const following = follow.following;
        if (!following) return null;
        const profileImageUrl =
          following.profileImage && following.profileImage.url
            ? following.profileImage.url.startsWith("http")
              ? following.profileImage.url
              : `${apiUrl}${following.profileImage.url}`
            : "/abstract-user-icon.png";

        return {
          id: following.id,
          documentId: following.documentId,
          username: following.username,
          displayName: following.displayName || following.username,
          profileImage: { url: profileImageUrl },
          isFollowing: true,
        } as FollowUser;
      })
      .filter(Boolean) as FollowUser[];

    return {
      users,
      total: followsResponse.meta?.pagination?.total || users.length,
      page: followsResponse.meta?.pagination?.page || page,
      pageSize: followsResponse.meta?.pagination?.pageSize || pageSize,
      totalPages:
        followsResponse.meta?.pagination?.pageCount ||
        Math.ceil(users.length / pageSize),
      isAuthenticated,
    };
  } catch (error) {
    console.error("Error in getFollowing:", error);
    return {
      users: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
      isAuthenticated: false,
    };
  }
}

export async function toggleFollowStatus(
  targetUsername: string,
  currentlyFollowing: boolean
): Promise<{ success: boolean; isFollowing: boolean; message?: string }> {
  try {
    const cookieStore = cookies();
    const token =
      cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value;

    if (!token) {
      return {
        success: false,
        isFollowing: currentlyFollowing,
        message: "Authentication required to follow users",
      };
    }

    const apiUrl = getApiUrl();
    const targetDocId = await getUserDocumentIdByUsername(targetUsername);
    if (!targetDocId) {
      return {
        success: false,
        isFollowing: currentlyFollowing,
        message: "User not found",
      };
    }

    if (currentlyFollowing) {
      const followQuery = qs.stringify({
        filters: {
          $and: [
            { follower: { documentId: { $eq: "me" } } },
            { following: { documentId: { $eq: targetDocId } } },
          ],
        },
      });

      const followResponse = await fetch(
        `${apiUrl}/api/follows?${followQuery}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!followResponse.ok)
        throw new Error(
          `API Error: ${followResponse.status} ${followResponse.statusText}`
        );
      const followJson = await followResponse.json();

      const followId = followJson.data?.[0]?.id || followJson[0]?.id;
      if (!followId)
        return {
          success: true,
          isFollowing: false,
          message: "Already unfollowed",
        };

      const del = await fetch(`${apiUrl}/api/follows/${followId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!del.ok)
        throw new Error(`API Error: ${del.status} ${del.statusText}`);

      revalidatePath(`/profile/${targetUsername}`);
      return { success: true, isFollowing: false };
    } else {
      const create = await fetch(`${apiUrl}/api/follows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: { following: targetDocId } }),
      });
      if (!create.ok)
        throw new Error(`API Error: ${create.status} ${create.statusText}`);
      revalidatePath(`/profile/${targetUsername}`);
      return { success: true, isFollowing: true };
    }
  } catch (error) {
    console.error("Error toggling follow status:", error);
    return {
      success: false,
      isFollowing: currentlyFollowing,
      message: "Failed to update follow status",
    };
  }
}
