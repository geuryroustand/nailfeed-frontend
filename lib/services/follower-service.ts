"use server";

import qs from "qs";
import { cookies } from "next/headers";

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
  return process.env.API_TOKEN || null;
}

async function getUserByUsername(username: string): Promise<any> {
  try {
    const apiUrl = getApiUrl();
    const token = getApiToken();
    if (!token) throw new Error("No API token available");

    const query = qs.stringify({ filters: { username: { $eq: username } } });
    const response = await fetch(`${apiUrl}/api/users?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 0 },
    });
    if (!response.ok)
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    const data = await response.json();
    return data.data?.[0] || data[0] || null;
  } catch (error) {
    console.error(`Error fetching user by username:`, error);
    return null;
  }
}

export async function getFollowers(
  username: string,
  page = 1,
  pageSize = 10
): Promise<FollowListResponse> {
  try {
    const apiUrl = getApiUrl();
    const token = getApiToken();

    const cookieStore = cookies();
    const userToken =
      cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value;
    const isAuthenticated = !!userToken;

    if (!token) {
      return {
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        isAuthenticated,
      };
    }

    const user = await getUserByUsername(username);
    if (!user) {
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
      populate: ["follower", "follower.profileImage"],
      filters: { following: { id: { $eq: user.id } } },
      pagination: { page, pageSize },
    });

    const followersResponse = await fetch(
      `${apiUrl}/api/follows?${followersQuery}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 0 },
      }
    );
    if (!followersResponse.ok)
      throw new Error(
        `API Error: ${followersResponse.status} ${followersResponse.statusText}`
      );
    const followersData = await followersResponse.json();

    const users = (followersData.data || [])
      .map((follow: any) => {
        const follower = follow.attributes?.follower?.data || follow.follower;
        if (!follower) return null;
        const followerData = follower.attributes || follower;

        let profileImageUrl = "/abstract-user-icon.png";
        if (followerData.profileImage) {
          const profileImage =
            followerData.profileImage.data || followerData.profileImage;
          const imageUrl = profileImage?.attributes?.url || profileImage?.url;
          if (imageUrl)
            profileImageUrl = imageUrl.startsWith("http")
              ? imageUrl
              : `${apiUrl}${imageUrl}`;
        }

        return {
          id: follower.id,
          documentId: followerData.documentId || `follower-${follower.id}`,
          username: followerData.username,
          displayName: followerData.displayName || followerData.username,
          profileImage: { url: profileImageUrl },
          isFollowing: false,
        } as FollowUser;
      })
      .filter(Boolean) as FollowUser[];

    return {
      users,
      total: followersData.meta?.pagination?.total || users.length,
      page: followersData.meta?.pagination?.page || page,
      pageSize: followersData.meta?.pagination?.pageSize || pageSize,
      totalPages:
        followersData.meta?.pagination?.pageCount ||
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
    const token = getApiToken();

    const cookieStore = cookies();
    const userToken =
      cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value;
    const isAuthenticated = !!userToken;

    if (!token) {
      return {
        users: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        isAuthenticated,
      };
    }

    const user = await getUserByUsername(username);
    if (!user) {
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
      populate: ["following", "following.profileImage"],
      filters: { follower: { id: { $eq: user.id } } },
      pagination: { page, pageSize },
    });

    const followingResponse = await fetch(
      `${apiUrl}/api/follows?${followingQuery}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 0 },
      }
    );
    if (!followingResponse.ok)
      throw new Error(
        `API Error: ${followingResponse.status} ${followingResponse.statusText}`
      );
    const followingData = await followingResponse.json();

    const users = (followingData.data || [])
      .map((follow: any) => {
        const following =
          follow.attributes?.following?.data || follow.following;
        if (!following) return null;
        const followingData = following.attributes || following;

        let profileImageUrl = "/abstract-user-icon.png";
        if (followingData.profileImage) {
          const profileImage =
            followingData.profileImage.data || followingData.profileImage;
          const imageUrl = profileImage?.attributes?.url || profileImage?.url;
          if (imageUrl)
            profileImageUrl = imageUrl.startsWith("http")
              ? imageUrl
              : `${apiUrl}${imageUrl}`;
        }

        return {
          id: following.id,
          documentId: followingData.documentId || `following-${following.id}`,
          username: followingData.username,
          displayName: followingData.displayName || followingData.username,
          profileImage: { url: profileImageUrl },
          isFollowing: true,
        } as FollowUser;
      })
      .filter(Boolean) as FollowUser[];

    return {
      users,
      total: followingData.meta?.pagination?.total || users.length,
      page: followingData.meta?.pagination?.page || page,
      pageSize: followingData.meta?.pagination?.pageSize || pageSize,
      totalPages:
        followingData.meta?.pagination?.pageCount ||
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
