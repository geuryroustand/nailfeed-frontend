"use client";

import qs from "qs";
import { normalizeImageUrl } from "@/lib/image-utils";

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

export type ReactionUser = {
  id?: string | number;
  documentId?: string;
  username?: string;
  displayName?: string;
  profileImage?: any;
};

export type ReactionLike = {
  id: string | number;
  type: ReactionType;
  user: ReactionUser | null;
  createdAt?: string;
};

export type ReactionPagination = {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
};

const REACTION_TYPES: ReactionType[] = ["like", "love", "haha", "wow", "sad", "angry"];

const createEmptyCounts = (): Record<ReactionType, number> => ({
  like: 0,
  love: 0,
  haha: 0,
  wow: 0,
  sad: 0,
  angry: 0,
});

const mapReactionTypeToEmoji: Record<ReactionType, string> = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡",
};

function unwrapEntity(entity: any) {
  if (!entity) return null;
  const dataNode = entity.data ?? entity;
  if (!dataNode) return null;
  const attributes = dataNode.attributes ?? dataNode;
  return {
    ...attributes,
    id: dataNode.id ?? attributes.id,
    documentId: attributes.documentId ?? dataNode.documentId,
  };
}

function normalizeMediaFormats(formats: any) {
  if (!formats || typeof formats !== "object") return formats;
  const normalized: Record<string, any> = {};
  Object.entries(formats).forEach(([key, value]) => {
    if (value && typeof value === "object") {
      normalized[key] = {
        ...value,
        url: value.url ? normalizeImageUrl(value.url) : value.url,
      };
    }
  });
  return normalized;
}

function normalizeProfileImage(image: any) {
  if (!image) return image;
  const media = unwrapEntity(image) ?? image;
  if (!media) return undefined;
  return {
    ...media,
    url: media.url ? normalizeImageUrl(media.url) : media.url,
    formats: normalizeMediaFormats(media.formats),
  };
}

function mapLikeEntry(item: any): ReactionLike {
  const attributes = item?.attributes ?? item ?? {};
  const likeId = item?.id ?? attributes.id ?? attributes.documentId ?? Date.now();
  const type = (attributes.type ?? "like") as ReactionType;
  const userEntity = unwrapEntity(attributes.user);

  return {
    id: likeId,
    type,
    createdAt: attributes.createdAt,
    user: userEntity
      ? {
          id: userEntity.id,
          documentId: userEntity.documentId,
          username: userEntity.username,
          displayName: userEntity.displayName ?? userEntity.username,
          profileImage: normalizeProfileImage(userEntity.profileImage),
        }
      : null,
  };
}

type ProxyOptions = {
  useServerToken?: boolean;
  data?: any;
};

async function proxyFetch(endpoint: string, method: string, options: ProxyOptions = {}) {
  const { useServerToken = false, data } = options;
  const response = await fetch("/api/auth-proxy", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      endpoint,
      method,
      ...(data !== undefined ? { data } : {}),
      ...(useServerToken ? { useServerToken: true } : {}),
    }),
    credentials: "include",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

interface LikesResponse {
  likes: ReactionLike[];
  pagination: ReactionPagination;
  countsByType?: Record<ReactionType, number>;
}

function parseLikesResponse(raw: any, page: number, pageSize: number): LikesResponse {
  // Use the 'data' array from backend response
  const rawLikes = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw?.likes)
      ? raw.likes
      : [];

  const likes = rawLikes.map(mapLikeEntry);

  const paginationData = raw?.pagination ?? raw?.meta?.pagination ?? {};
  const pagination: ReactionPagination = {
    page: paginationData.page ?? page,
    pageSize: paginationData.pageSize ?? pageSize,
    pageCount: paginationData.pageCount ?? 1,
    total: paginationData.total ?? raw?.total ?? rawLikes.length,
  };

  // Use backend's byType data directly without client-side processing
  const byTypeData = raw?.byType ?? {};
  let counts: Record<ReactionType, number> | undefined;

  if (byTypeData && typeof byTypeData === "object") {
    counts = {} as Record<ReactionType, number>;
    // Initialize all types to 0
    REACTION_TYPES.forEach((type) => {
      counts![type] = 0;
    });
    // Use backend counts directly
    Object.entries(byTypeData).forEach(([type, entry]: [string, any]) => {
      if (REACTION_TYPES.includes(type as ReactionType)) {
        counts![type as ReactionType] = entry.count ?? 0;
      }
    });
  }

  return { likes, pagination, countsByType: counts };
}

export class ReactionService {
  static getEmoji(type: ReactionType) {
    return mapReactionTypeToEmoji[type];
  }

  // DEPRECATED: Reaction counts now come directly from backend in post.reactions
  // This method is kept for backward compatibility only
  static async getReactionCounts(
    postDocumentId: string | number,
  ): Promise<Record<ReactionType, { count: number; users: ReactionUser[] }>> {
    console.warn("[ReactionService] getReactionCounts is deprecated. Use post.reactions from backend instead.");

    // Return empty structure - this should not be used with new backend
    const emptyResult: Record<ReactionType, { count: number; users: ReactionUser[] }> = {} as any;
    REACTION_TYPES.forEach((type) => {
      emptyResult[type] = { count: 0, users: [] };
    });
    return emptyResult;
  }

  static async fetchPostLikes(
    postDocumentId: string,
    options: {
      page?: number;
      pageSize?: number;
      reactionType?: ReactionType | "all";
    } = {},
  ): Promise<{
    likes: ReactionLike[];
    pagination: ReactionPagination;
    countsByType?: Record<ReactionType, number>;
  }> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    const reactionFilter = options.reactionType && options.reactionType !== "all" ? options.reactionType : undefined;

    const encodedId = encodeURIComponent(String(postDocumentId));
    const populateQuery = qs.stringify(
      {
        fields: ["id", "type", "createdAt"],
        populate: {
          user: {
            fields: ["id", "documentId", "username", "displayName"],
            populate: {
              profileImage: {
                fields: ["url", "formats"],
              },
            },
          },
        },
        pagination: {
          page,
          pageSize,
        },
        ...(reactionFilter
          ? {
              filters: {
                type: {
                  $eq: reactionFilter,
                },
              },
            }
          : {}),
      },
      { encodeValuesOnly: true, indices: false },
    );

    try {
      const endpoint = `/api/likes/post/${encodedId}?${populateQuery}`;
      const data = await proxyFetch(endpoint, "GET", { useServerToken: true });
      return parseLikesResponse(data, page, pageSize);
    } catch (error) {
      console.error("[ReactionService] Failed to fetch likes:", error);
      return {
        likes: [],
        pagination: {
          page,
          pageSize,
          pageCount: 1,
          total: 0,
        },
        countsByType: createEmptyCounts(),
      };
    }
  }

  // DEPRECATED: User reaction now comes directly from backend in post.userReaction
  // This method is kept for backward compatibility only
  static async getUserReaction(postDocumentId: string | number): Promise<{ id?: string; type: ReactionType } | null> {
    console.warn("[ReactionService] getUserReaction is deprecated. Use post.userReaction from backend instead.");

    try {
      const endpoint = `/api/likes/post/${encodeURIComponent(String(postDocumentId))}/me`;
      const data = await proxyFetch(endpoint, "GET");
      if (data?.like) {
        return {
          id: data.like.id?.toString?.(),
          type: (data.like.type ?? "like") as ReactionType,
        };
      }
      return null;
    } catch (error) {
      console.warn("[ReactionService] Unable to resolve current user reaction:", error);
      return null;
    }
  }

  static async addReaction(
    postDocumentId: string | number,
    type: ReactionType,
  ): Promise<{ action: "created" | "updated" | "removed"; like?: { id?: string; type: ReactionType } } | null> {
    try {
      const response = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: "/api/likes",
          method: "POST",
          data: { type, postId: String(postDocumentId) },
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error (${response.status}): ${text}`);
      }

      const result = await response.json();
      return {
        action: result.action,
        like: result.like
          ? {
              id: result.like.id?.toString?.(),
              type: (result.like.type ?? type) as ReactionType,
            }
          : undefined,
      };
    } catch (error) {
      console.error("[ReactionService] Failed to toggle reaction:", error);
      throw new Error("Failed to update reaction: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  }

  static async removeReactionByPost(postDocumentId: string | number) {
    try {
      const endpoint = `/api/likes/post/${postDocumentId}`;
      await proxyFetch(endpoint, "DELETE");
      return true;
    } catch (error) {
      console.error("[ReactionService] Failed to remove reaction:", error);
      return false;
    }
  }
}

export { REACTION_TYPES, mapReactionTypeToEmoji };
