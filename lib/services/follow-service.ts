import { getClientSessionStatus } from "@/lib/auth/client-session"
import qs from "qs";

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

// Client helper to call server proxy
async function proxy<T>(endpoint: string) {
  const res = await fetch("/api/auth-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint, method: "GET" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

async function getUserDocumentIdByUsername(
  username: string
): Promise<string | null> {
  try {
    const query = qs.stringify({ filters: { username: { $eq: username } } });
    const userResponse = await proxy<any>(`/api/users?${query}`);
    const userData = userResponse.data || userResponse;
    if (!userData || !userData.length) return null;
    return userData[0].documentId || null;
  } catch (error) {
    console.error(`Error fetching user documentId for ${username}:`, error);
    return null;
  }
}

export async function getFollowers(
  username: string,
  page = 1,
  pageSize = 10
): Promise<FollowListResponse> {
  try {
    const isAuthenticated = await getClientSessionStatus()

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

    const followsResponse = await proxy<any>(`/api/follows?${followersQuery}`);

    const users = (followsResponse.data || [])
      .map((follow: any) => {
        const follower = follow.follower;
        if (!follower) return null;

        let profileImageUrl = "/abstract-user-icon.png";
        if (follower.profileImage) {
          profileImageUrl = follower.profileImage.url.startsWith("http")
            ? follower.profileImage.url
            : `${process.env.NEXT_PUBLIC_API_URL || ""}${
                follower.profileImage.url
              }`;
        }

        return {
          id: follower.id,
          documentId: follower.documentId,
          username: follower.username,
          displayName: follower.displayName || follower.username,
          profileImage: { url: profileImageUrl },
          isFollowing: false,
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
    console.error("Error in client getFollowers:", error);
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
    const isAuthenticated = await getClientSessionStatus()

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

    const followsResponse = await proxy<any>(`/api/follows?${followingQuery}`);

    const users = (followsResponse.data || [])
      .map((follow: any) => {
        const following = follow.following;
        if (!following) return null;

        let profileImageUrl = "/abstract-user-icon.png";
        if (following.profileImage) {
          profileImageUrl = following.profileImage.url.startsWith("http")
            ? following.profileImage.url
            : `${process.env.NEXT_PUBLIC_API_URL || ""}${
                following.profileImage.url
              }`;
        }

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
    console.error("Error in client getFollowing:", error);
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
    const response = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: targetUsername,
        unfollow: currentlyFollowing,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        isFollowing: currentlyFollowing,
        message: errorData.message || "Failed to update follow status",
      };
    }

    return { success: true, isFollowing: !currentlyFollowing };
  } catch (error) {
    console.error("Error toggling follow status:", error);
    return {
      success: false,
      isFollowing: currentlyFollowing,
      message: "Failed to update follow status",
    };
  }
}
