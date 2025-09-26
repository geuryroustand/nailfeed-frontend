import type { Collection, CollectionShare } from '@/types/collection';
import { verifySession } from '@/lib/auth/session';

// Helper function to get Strapi API URL
function getStrapiUrl(): string {
  return process.env.STRAPI_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://nailfeed-backend-production.up.railway.app';
}

// Helper function to get auth headers for server requests
async function getAuthHeaders(): Promise<HeadersInit> {
  try {
    const session = await verifySession();
    const token = session?.strapiJWT;

    if (!token) {
      throw new Error('No authentication token available');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  } catch (error) {
    console.error('Failed to get auth headers:', error);
    throw new Error('Authentication required');
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
  visibility: 'private' | 'unlisted' | 'public';
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
    type: 'link' | 'user' | 'social';
    recipient?: string;
    permission: 'view' | 'edit';
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
  visibility?: 'private' | 'unlisted' | 'public';
  coverImage?: number; // Media ID
}

export interface UpdateCollectionData {
  name?: string;
  description?: string;
  visibility?: 'private' | 'unlisted' | 'public';
  coverImage?: number | null;
}

export interface AddPostToCollectionData {
  posts: string[]; // Array of post document IDs to connect
}

export interface CreateCollectionShareData {
  type: 'link' | 'user' | 'social';
  recipient?: string;
  permission?: 'view' | 'edit';
  expiresAt?: string;
}

// Transform Strapi collection to frontend format
function transformCollection(strapiCollection: StrapiCollection): Collection {
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

  return {
    id: strapiCollection.documentId,
    name: strapiCollection.name,
    description: strapiCollection.description,
    coverImage: strapiCollection.coverImage?.url,
    isPrivate: strapiCollection.visibility === 'private',
    createdAt: strapiCollection.createdAt,
    updatedAt: strapiCollection.updatedAt,
    postIds:
      strapiCollection.posts
        ?.map((post) => {
          if (post.documentId) {
            return post.documentId;
          }

          if (typeof post.id === 'number' && Number.isFinite(post.id)) {
            return post.id.toString();
          }

          if (typeof post.id === 'string' && post.id.length > 0) {
            return post.id;
          }

          return undefined;
        })
        .filter((id): id is string => typeof id === 'string' && id.length > 0) || [],
    shares: strapiCollection.shares?.map(share => ({
      id: share.documentId,
      collectionId: strapiCollection.documentId,
      type: share.type,
      recipient: share.recipient,
      permission: share.permission,
      createdAt: strapiCollection.createdAt, // Fallback since share doesn't have createdAt
      expiresAt: share.expiresAt,
      isActive: share.isActive,
    })) || [],
    shareLink: strapiCollection.shareToken ?
      `/shared/collection/${strapiCollection.documentId}?token=${strapiCollection.shareToken}` :
      undefined,
    isShared: (strapiCollection.shares?.length || 0) > 0,
    owner,
  };
}

export class CollectionsService {
  // Get all user collections
  static async getUserCollections(): Promise<Collection[]> {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      'populate[0]': 'coverImage',
      'populate[1]': 'owner',
      'populate[2]': 'posts',
      'populate[3]': 'shares',
      'sort': 'updatedAt:desc',
    });

    const response = await fetch(`${getStrapiUrl()}/api/collections?${params}`, {
      method: 'GET',
      headers,
      cache: 'no-store', // Force fresh data
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strapi collections error:', response.status, errorText);
      throw new Error(`Failed to fetch collections: ${response.status}`);
    }

    const data = await response.json();
    return data.data.map(transformCollection);
  }

  // Get a specific collection by ID
  static async getCollection(documentId: string): Promise<Collection> {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      'populate[0]': 'coverImage',
      'populate[1]': 'owner',
      'populate[2]': 'posts',
      'populate[3]': 'shares',
    });

    const response = await fetch(`${getStrapiUrl()}/api/collections/${documentId}?${params}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strapi collection error:', response.status, errorText);
      throw new Error(`Failed to fetch collection: ${response.status}`);
    }

    const data = await response.json();
    return transformCollection(data.data);
  }

  // Create a new collection
  static async createCollection(data: CreateCollectionData): Promise<Collection> {
    const headers = await getAuthHeaders();

    const payload = {
      data: {
        ...data,
        visibility: data.visibility || 'private',
      },
    };

    const response = await fetch(`${getStrapiUrl()}/api/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Strapi create collection error:', response.status, errorText);
      throw new Error(`Failed to create collection: ${response.status}`);
    }

    const result = await response.json();
    // Fetch the created collection with populated fields
    return this.getCollection(result.data.documentId);
  }

  // Update a collection
  static async updateCollection(documentId: string, data: UpdateCollectionData): Promise<Collection> {
    const payload = {
      data,
    };

    const response = await fetch(`${getBaseUrl()}/api/auth-proxy/collections/${documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to update collection: ${response.status}`);
    }

    // Fetch the updated collection with populated fields
    return this.getCollection(documentId);
  }

  // Delete a collection
  static async deleteCollection(documentId: string): Promise<void> {
    const response = await fetch(`${getBaseUrl()}/api/auth-proxy/collections/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete collection: ${response.status}`);
    }
  }

  // Add posts to a collection
  static async addPostsToCollection(documentId: string, postIds: string[]): Promise<Collection> {
    // Get current collection to merge posts
    const currentCollection = await this.getCollection(documentId);
    const existingPostIds = currentCollection.postIds;
    const normalizedIncoming = postIds.map((id) => id.toString());
    const newPostIds = [...new Set([...existingPostIds, ...normalizedIncoming])];

    const payload = {
      data: {
        posts: newPostIds,
      },
    };

    const response = await fetch(`${getBaseUrl()}/api/auth-proxy/collections/${documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to add posts to collection: ${response.status}`);
    }

    return this.getCollection(documentId);
  }

  // Remove posts from a collection
  static async removePostsFromCollection(documentId: string, postIds: string[]): Promise<Collection> {
    // Get current collection to filter out posts
    const currentCollection = await this.getCollection(documentId);
    const normalizedRemovals = postIds.map((id) => id.toString());
    const remainingPostIds = currentCollection.postIds.filter(
      (id) => !normalizedRemovals.includes(id.toString())
    );

    const payload = {
      data: {
        posts: remainingPostIds,
      },
    };

    const response = await fetch(`${getBaseUrl()}/api/auth-proxy/collections/${documentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to remove posts from collection: ${response.status}`);
    }

    return this.getCollection(documentId);
  }

  // Get collections that contain a specific post
  static async getPostCollections(postId: string | number): Promise<Collection[]> {
    const params = new URLSearchParams({
      'filters[posts][documentId][$eq]': postId.toString(),
    });

    const response = await fetch(`${getBaseUrl()}/api/auth-proxy/collections?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
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
    throw new Error('Collection sharing not yet implemented');
  }

  // Remove a collection share
  static async removeCollectionShare(shareId: string): Promise<void> {
    // TODO: Implement collection share removal with proper auth-proxy endpoint
    throw new Error('Collection share removal not yet implemented');
  }

  // Update share permission
  static async updateSharePermission(shareId: string, permission: 'view' | 'edit'): Promise<void> {
    // TODO: Implement share permission update with proper auth-proxy endpoint
    throw new Error('Share permission update not yet implemented');
  }

  // Generate share link for a collection
  static async generateShareLink(collectionId: string): Promise<string> {
    // Generate a unique share token
    const shareToken = Math.random().toString(36).substring(2, 15) +
                      Math.random().toString(36).substring(2, 15);

    const payload = {
      data: {
        shareToken,
        visibility: 'unlisted', // Make it accessible via link
      },
    };

    const response = await fetch(`${getBaseUrl()}/api/auth-proxy/collections/${collectionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate share link: ${response.status}`);
    }

    return `/shared/collection/${collectionId}?token=${shareToken}`;
  }

  // Get shared collection by token (for public access)
  static async getSharedCollection(documentId: string, token: string): Promise<Collection> {
    // For shared collections, we can use the public API since they're meant to be accessible
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://nailfeed-backend-production.up.railway.app';

    const params = new URLSearchParams({
      'populate[0]': 'coverImage',
      'populate[1]': 'owner',
      'populate[2]': 'posts',
      'populate[3]': 'shares',
      'filters[shareToken][$eq]': token,
    });

    const response = await fetch(`${baseUrl}/api/collections/${documentId}?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch shared collection: ${response.status}`);
    }

    const data = await response.json();
    return transformCollection(data.data);
  }
}
