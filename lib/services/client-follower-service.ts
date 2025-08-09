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

// Helper to call the server proxy (keeps tokens on the server)
async function proxy<T>(
  endpoint: string,
  init?: { method?: string; data?: any; authorizationOverride?: string }
) {
  const res = await fetch("/api/auth-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint,
      method: init?.method || "GET",
      data: init?.data,
      authorizationOverride: init?.authorizationOverride,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error: ${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

// Get user by username (via proxy)
async function getUserByUsername(username: string): Promise<any> {
  const query = qs.stringify({ filters: { username: { $eq: username } } });
  const data = await proxy<any>(`/api/users?${query}`);
  return data.data?.[0] || data[0] || null;
}

export async function getFollowers(
  username: string,
  page = 1,
  pageSize = 10
): Promise<FollowListResponse> {
  try {
    const isAuthenticated =
      typeof document !== "undefined" &&
      (document.cookie.includes("jwt=") ||
        document.cookie.includes("authToken="));

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

    const followersData = await proxy<any>(`/api/follows?${followersQuery}`);

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
              : `${process.env.NEXT_PUBLIC_API_URL || ""}${imageUrl}`;
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
    const isAuthenticated =
      typeof document !== "undefined" &&
      (document.cookie.includes("jwt=") ||
        document.cookie.includes("authToken="));

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

    const followingData = await proxy<any>(`/api/follows?${followingQuery}`);

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
              : `${process.env.NEXT_PUBLIC_API_URL || ""}${imageUrl}`;
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
