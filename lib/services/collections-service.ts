import type {
  Collection,
  CollectionShare,
} from "@/types/collection";
import { verifySession } from "@/lib/auth/session";
import { normalizeImageUrl } from "@/lib/image-utils";
import { transformStrapiPost } from "@/lib/post-data";
import type { Post as FeedPost } from "@/lib/post-data";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { getServerApiToken } from "@/lib/config";

// Helper function to get Strapi API URL
function getStrapiUrl(): string {
  return process.env.API_URL || "https://api.nailfeed.com";
}

// Helper function to get auth headers for server requests
async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const session = await verifySession();
    const token = session?.strapiJWT;

    if (!token) {
      throw new Error("No authentication token available");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.error("Failed to get auth headers:", error);
    throw new Error("Authentication required");
  }
}

export interface StrapiCollection {
  id: number | string;
  documentId: string;
  name: string;
  description?: string;
  coverImage?: {
    id: number;
    url: string;
    name: string;
    alternativeText?: string;
  };
  visibility: "private" | "unlisted" | "public";
  shareToken?: string;
  owner: {
    id: number;
    documentId: string;
    username: string;
  };
  posts?: {
    id: number | string;
    documentId: string;
  }[];
  shares?: {
    id: number;
    documentId: string;
    type: "link" | "user" | "social";
    recipient?: string;
    permission: "view" | "edit";
    isActive: boolean;
    expiresAt?: string;
  }[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface CreateCollectionData {
  name: string;
  description?: string;
  visibility?: "private" | "unlisted" | "public";
  coverImage?: number; // Media ID
  isPrivate?: boolean; // For backward compatibility
}

export interface UpdateCollectionData {
  name?: string;
  description?: string;
  visibility?: "private" | "unlisted" | "public";
  coverImage?: number | null;
}

export interface AddPostToCollectionData {
  posts: string[]; // Array of post document IDs to connect
}

function ensureArray<T = any>(input: any): T[] {
  if (!input) {
    return [];
  }

  if (Array.isArray(input)) {
    return input as T[];
  }

  if (Array.isArray(input?.data)) {
    return input.data as T[];
  }

  return [];
}

export interface CreateCollectionShareData {
  type: "link" | "user" | "social";
  recipient?: string;
  permission?: "view" | "edit";
  expiresAt?: string;
}

// Transform Strapi collection to frontend format
function transformCollection(strapiCollection: StrapiCollection): Collection {
  // Handle Strapi v5 owner relation properly
  const ownerSource = (strapiCollection as any).owner?.data ?? (strapiCollection as any).owner
  const owner = ownerSource
    ? {
        id: ownerSource.id?.toString() ?? undefined,
        documentId:
          ownerSource.documentId ??
          ownerSource.document_id ??
          ownerSource.id?.toString() ??
          ownerSource.attributes?.documentId ??
          ownerSource.attributes?.document_id,
        username:
          ownerSource.username ??
          ownerSource.attributes?.username ??
          ownerSource.handle,
        displayName: ownerSource.displayName ?? ownerSource.attributes?.displayName,
      }
    : undefined

  // Ensure we have a valid documentId for Strapi v5
  const collectionId = strapiCollection.documentId ?? strapiCollection.id?.toString()
  if (!collectionId) {
    throw new Error(`Collection missing documentId: ${JSON.stringify(strapiCollection)}`)
  }

  return {
    id: collectionId,
    name: strapiCollection.name,
    description: strapiCollection.description,
    coverImage: strapiCollection.coverImage?.url
      ? normalizeImageUrl(strapiCollection.coverImage.url)
      : undefined,
    isPrivate: strapiCollection.visibility === "private",
    createdAt: strapiCollection.createdAt,
    updatedAt: strapiCollection.updatedAt,
    postIds:
      strapiCollection.posts
        ?.map((post) => {
          if (post.documentId) {
            return post.documentId
          }

          if (typeof post.id === "number" && Number.isFinite(post.id)) {
            return post.id.toString()
          }

          if (typeof post.id === "string" && post.id.length > 0) {
            return post.id
          }

          return undefined
        })
        .filter((id): id is string => typeof id === "string" && id.length > 0) || [],
    shares:
      strapiCollection.shares?.map((share) => ({
        id: share.documentId,
        collectionId: strapiCollection.documentId,
        type: share.type,
        recipient: share.recipient,
        permission: share.permission,
        createdAt: strapiCollection.createdAt, // Fallback since share doesn't have createdAt
        expiresAt: share.expiresAt,
        isActive: share.isActive,
      })) || [],
    shareLink: strapiCollection.shareToken
      ? `/shared/collection/${strapiCollection.documentId}?token=${strapiCollection.shareToken}`
      : undefined,
    isShared: (strapiCollection.shares?.length || 0) > 0,
    owner,
  };
}

export class CollectionsService {
  // Get all user collections
  static async getUserCollections(): Promise<Collection[]> {
    const headers = await getAuthHeaders();
    const session = await verifySession();

    if (!session?.userId) {
      throw new Error("User authentication required");
    }

    const params = new URLSearchParams({
      "populate[0]": "coverImage",
      "populate[1]": "owner",
      "populate[2]": "posts",
      "populate[3]": "shares",
      "filters[owner][id][$eq]": session.userId.toString(),
      "fields[0]": "name",
      "fields[1]": "description",
      "fields[2]": "visibility",
      "fields[3]": "shareToken",
      "fields[4]": "createdAt",
      "fields[5]": "updatedAt",
      "fields[6]": "publishedAt",
      "publicationState": "live",
      "pagination[limit]": "100",
      sort: "updatedAt:desc",
    });

    const response = await fetch(
      `${getStrapiUrl()}/api/collections?${params}`,
      {
        method: "GET",
        headers,
        cache: "no-store", // Force fresh data for user collections
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Strapi getUserCollections error:", response.status, errorText);
      throw new Error(`Failed to fetch user collections: ${response.status}`);
    }

    const data = await response.json();
    return data.data.map(transformCollection);
  }

  static async getPublicCollections(): Promise<Collection[]> {
    const params = new URLSearchParams({
      "populate[0]": "coverImage",
      "populate[1]": "owner",
      "fields[0]": "name",
      "fields[1]": "description",
      "fields[2]": "visibility",
      "fields[3]": "shareToken",
      "fields[4]": "createdAt",
      "fields[5]": "updatedAt",
      "filters[visibility][$eq]": "public",
      publicationState: "live",
      sort: "updatedAt:desc",
    });

    const token = getServerApiToken();
    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetchWithRetry(
      `${getStrapiUrl()}/api/collections?${params.toString()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
      2
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Strapi public collections error:",
        response.status,
        errorText
      );
      throw new Error(`Failed to fetch public collections: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data?.data)
      ? data.data
          .map(transformCollection)
          .filter((collection) => !collection.isPrivate)
      : [];
  }

  // Get a specific collection by ID
  static async getCollection(documentId: string): Promise<Collection> {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      "populate[0]": "coverImage",
      "populate[1]": "owner",
      "populate[2]": "posts",
      "populate[3]": "shares",
    });

    const response = await fetch(
      `${getStrapiUrl()}/api/collections/${documentId}?${params}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Strapi collection error:", response.status, errorText);
      throw new Error(`Failed to fetch collection: ${response.status}`);
    }

    const data = await response.json();
    return transformCollection(data.data);
  }

  static async getPublicCollection(documentId: string): Promise<Collection | null> {
    const params = new URLSearchParams({
      "populate[0]": "coverImage",
      "populate[1]": "owner",
      "populate[2]": "posts",
      "filters[documentId][$eq]": documentId,
      "filters[visibility][$eq]": "public",
      "fields[0]": "name",
      "fields[1]": "description",
      "fields[2]": "visibility",
      "fields[3]": "shareToken",
      "fields[4]": "createdAt",
      "fields[5]": "updatedAt",
      publicationState: "live",
    });

    const token = getServerApiToken();
    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetchWithRetry(
      `${getStrapiUrl()}/api/collections?${params.toString()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
      2
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Strapi public collection error:",
        response.status,
        errorText
      );
      throw new Error(`Failed to fetch public collection: ${response.status}`);
    }

    const data = await response.json();
    const entry = Array.isArray(data?.data) ? data.data[0] : null;

    if (!entry) {
      return null;
    }

    const collection = transformCollection(entry);
    if (collection.isPrivate) {
      return null;
    }

    return collection;
  }

  static async getPublicCollectionWithPosts(
    documentId: string
  ): Promise<Collection | null> {
    const params = new URLSearchParams({
      "populate[0]": "coverImage",
      "populate[1]": "owner",
      "populate[2]": "posts",
      "populate[3]": "posts.media",
      "populate[4]": "posts.user",
      "populate[5]": "posts.tags",
      "filters[documentId][$eq]": documentId,
      "filters[visibility][$eq]": "public",
      publicationState: "live",
    });

    const token = getServerApiToken();
    const headers: HeadersInit = {
      Accept: "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetchWithRetry(
      `${getStrapiUrl()}/api/collections?${params.toString()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
      2
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Strapi public collection detail error:",
        response.status,
        errorText
      );
      throw new Error(`Failed to fetch public collection: ${response.status}`);
    }

    const payload = await response.json();
    const entry = Array.isArray(payload?.data) ? payload.data[0] : null;

    if (!entry) {
      return null;
    }

    const collection = transformCollection(entry);
    if (collection.isPrivate) {
      return null;
    }

    const postsSource = ensureArray(entry?.attributes?.posts ?? entry?.posts);
    const posts = postsSource
      .map((post: any) => {
        try {
          return transformStrapiPost(post);
        } catch (error) {
          console.error(
            "Failed to transform post for collection",
            documentId,
            error
          );
          return null;
        }
      })
      .filter((post): post is FeedPost => Boolean(post));

    return {
      ...collection,
      posts,
    };
  }

  // Create a new collection
  static async createCollection(
    data: CreateCollectionData
  ): Promise<Collection> {
    const headers = await getAuthHeaders();

    // Get current user session to get user ID for the owner relation
    const session = await verifySession();
    const userId = session?.userId;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Handle both new format and backward compatibility
    const visibility =
      data.visibility || (data.isPrivate === false ? "public" : "private");

    const payload = {
      data: {
        name: data.name,
        description: data.description,
        visibility,
        // In Strapi v5, relations are set using documentId or id
        owner: userId, // This connects the collection to the authenticated user
        ...(data.coverImage && { coverImage: data.coverImage }),
      },
    };

    console.log(
      "Creating collection with payload:",
      JSON.stringify(payload, null, 2)
    );

    const response = await fetch(`${getStrapiUrl()}/api/collections`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Strapi create collection error:",
        response.status,
        errorText
      );
      throw new Error(
        `Failed to create collection: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log("Collection created successfully:", result);

    // Fetch the created collection with populated fields
    return this.getCollection(result.data.documentId);
  }

  // Update a collection
  static async updateCollection(
    documentId: string,
    data: UpdateCollectionData
  ): Promise<Collection> {
    const headers = await getAuthHeaders();

    const payload = {
      data,
    };

    const response = await fetch(
      `${getStrapiUrl()}/api/collections/${documentId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Strapi update collection error:",
        response.status,
        errorText
      );
      throw new Error(`Failed to update collection: ${response.status}`);
    }

    // Fetch the updated collection with populated fields
    return this.getCollection(documentId);
  }

  // Delete a collection
  static async deleteCollection(documentId: string): Promise<void> {
    const headers = await getAuthHeaders();

    const response = await fetch(
      `${getStrapiUrl()}/api/collections/${documentId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Strapi delete collection error:",
        response.status,
        errorText
      );
      throw new Error(`Failed to delete collection: ${response.status}`);
    }
  }

  // Add posts to a collection
  static async addPostsToCollection(
    documentId: string,
    postIds: string[]
  ): Promise<Collection> {
    // Get current collection to merge posts
    const currentCollection = await this.getCollection(documentId);
    const existingPostIds = currentCollection.postIds;
    const normalizedIncoming = postIds.map((id) => id.toString());
    const newPostIds = [...new Set([...existingPostIds, ...normalizedIncoming])];

    const headers = await getAuthHeaders();

    const payload = {
      data: {
        posts: newPostIds,
      },
    };

    const response = await fetch(
      `${getStrapiUrl()}/api/collections/${documentId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Strapi add posts to collection error:",
        response.status,
        errorText
      );
      throw new Error(`Failed to add posts to collection: ${response.status}`);
    }

    return this.getCollection(documentId);
  }

  // Remove posts from a collection
  static async removePostsFromCollection(
    documentId: string,
    postIds: string[]
  ): Promise<Collection> {
    // Get current collection to filter out posts
    const currentCollection = await this.getCollection(documentId);
    const normalizedRemovals = postIds.map((id) => id.toString());
    const remainingPostIds = currentCollection.postIds.filter(
      (id) => !normalizedRemovals.includes(id.toString())
    );

    const headers = await getAuthHeaders();

    const payload = {
      data: {
        posts: remainingPostIds,
      },
    };

    const response = await fetch(
      `${getStrapiUrl()}/api/collections/${documentId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Strapi remove posts from collection error:",
        response.status,
        errorText
      );
      throw new Error(
        `Failed to remove posts from collection: ${response.status}`
      );
    }

    return this.getCollection(documentId);
  }

  // Get collections that contain a specific post
  static async getPostCollections(postId: string | number): Promise<Collection[]> {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      "populate[0]": "coverImage",
      "populate[1]": "owner",
      "populate[2]": "posts",
      "populate[3]": "shares",
      "filters[posts][documentId][$eq]": postId.toString(),
      sort: "updatedAt:desc",
    });

    const response = await fetch(
      `${getStrapiUrl()}/api/collections?${params}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Strapi post collections error:",
        response.status,
        errorText
      );
      throw new Error(`Failed to fetch post collections: ${response.status}`);
    }

    const data = await response.json();
    return data.data.map(transformCollection);
  }

  // Share a collection
  static async shareCollection(
    collectionId: string,
    shareData: CreateCollectionShareData
  ): Promise<CollectionShare> {
    // TODO: Implement collection sharing with proper auth-proxy endpoint
    throw new Error("Collection sharing not yet implemented");
  }

  // Remove a collection share
  static async removeCollectionShare(shareId: string): Promise<void> {
    // TODO: Implement collection share removal with proper auth-proxy endpoint
    throw new Error("Collection share removal not yet implemented");
  }

  // Update share permission
  static async updateSharePermission(
    shareId: string,
    permission: "view" | "edit"
  ): Promise<void> {
    // TODO: Implement share permission update with proper auth-proxy endpoint
    throw new Error("Share permission update not yet implemented");
  }

  // Generate share link for a collection
  static async generateShareLink(collectionId: string): Promise<string> {
    const headers = await getAuthHeaders();

    // Generate a unique share token
    const shareToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const payload = {
      data: {
        shareToken,
        visibility: "unlisted", // Make it accessible via link
      },
    };

    const response = await fetch(
      `${getStrapiUrl()}/api/collections/${collectionId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Strapi generate share link error:",
        response.status,
        errorText
      );
      throw new Error(`Failed to generate share link: ${response.status}`);
    }

    return `/shared/collection/${collectionId}?token=${shareToken}`;
  }

  // Get shared collection by token (for public access)
  static async getSharedCollection(
    documentId: string,
    token: string
  ): Promise<Collection> {
    // For shared collections, we can use the public API since they're meant to be accessible
    const baseUrl = getStrapiUrl();

    const params = new URLSearchParams({
      "populate[0]": "coverImage",
      "populate[1]": "owner",
      "populate[2]": "posts",
      "populate[3]": "shares",
      "filters[shareToken][$eq]": token,
    });

    const response = await fetch(
      `${baseUrl}/api/collections/${documentId}?${params}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Strapi shared collection error:",
        response.status,
        errorText
      );
      throw new Error(`Failed to fetch shared collection: ${response.status}`);
    }

    const data = await response.json();
    return transformCollection(data.data);
  }
}
