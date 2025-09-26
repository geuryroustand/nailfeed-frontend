import { PostService } from "./services/post-service";
import { normalizeImageUrl } from "./image-utils";

export type PostComment = {
  id: number;
  username: string;
  text: string;
  likes: number;
  reactions: {
    [key: string]: {
      emoji: string;
      count: number;
      reacted: boolean;
    };
  };
};

export type PostReactionSummary = {
  type?: string;
  emoji: string;
  label: string;
  count: number;
  users?: Array<{
    id?: string | number;
    username?: string;
    displayName?: string;
    profileImage?: any;
  }>;
};

export type Post = {
  id: number;
  documentId?: string;
  userId?: string | number | null;
  userDocumentId?: string;
  username: string;
  userImage: string;
  image?: string;
  title?: string;
  description: string;
  likes: number; // total reactions (likesCount)
  likesList?: Array<{
    id: number;
    documentId: string;
    type: string;
    user?: {
      id: number | string;
      documentId?: string;
      username?: string;
      displayName?: string;
      profileImage?: any;
    };
  }>;
  reactions?: PostReactionSummary[];
  comments: PostComment[];
  timestamp: string;
  tags: string[];
  mediaItems?: any[];
  media?: any[];
  contentType?: string;
  background?: any;
  galleryLayout?: string;
  isOptimistic?: boolean; // Flag for optimistic posts
  tempId?: string; // Temporary ID for optimistic posts
  comments_count?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  user?: {
    id?: string | number | null;
    documentId?: string;
    username?: string;
    displayName?: string;
    profileImage?: any;
  } | null;
  likesCount?: number;
  commentsCount?: number;
  savesCount?: number;
  viewsCount?: number;
  shareCount?: number;
  postStatus?: string;
  userReaction?: string | null;
};

export type PaginatedPostsResponse = {
  posts: Post[];
  nextCursor: number | null;
  hasMore: boolean;
};

export type PostsResponse = {
  posts: Post[];
  hasMore: boolean;
  nextPage?: number;
  error?: {
    code: number | string;
    message: string;
  };
};

const DEFAULT_POST_IMAGE = "/vibrant-floral-nails.png";
const DEFAULT_USER_IMAGE = "/serene-woman-gaze.png";


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

function unwrapCollection(collection: any): any[] {
  if (!collection) return [];
  if (Array.isArray(collection)) return collection;
  if (Array.isArray(collection.data)) return collection.data;
  return [];
}

function resolveMediaUrl(file: any): string {
  if (!file) return "";
  const candidate =
    file.url ||
    file.formats?.medium?.url ||
    file.formats?.small?.url ||
    file.formats?.thumbnail?.url ||
    "";
  return candidate ? normalizeImageUrl(candidate) : "";
}

// Function to transform Strapi post data to our Post interface
export function transformStrapiPost(post: any, currentUserId?: string | number): Post {
  if (!post) {
    console.error("Received null or undefined post data");
    throw new Error("Invalid post data received");
  }

  try {
    const base = post.attributes
      ? {
          ...post.attributes,
          id: post.id ?? post.attributes.id,
          documentId: post.attributes.documentId ?? post.documentId,
        }
      : post;

    const userEntity = unwrapEntity(base.user);
    const userProfileImage = unwrapEntity(userEntity?.profileImage);

    let userImageUrl = DEFAULT_USER_IMAGE;
    if (userProfileImage) {
      const candidate =
        userProfileImage.url ||
        userProfileImage.formats?.thumbnail?.url ||
        userProfileImage.formats?.small?.url ||
        "";
      if (candidate) {
        userImageUrl = normalizeImageUrl(candidate);
      }
    }

    const mediaItemsRaw = unwrapCollection(base.media || base.mediaItems);
    const processedMediaItems = mediaItemsRaw.map((item: any, index: number) => {
      const attributes = item.attributes ?? item;

      // Handle Strapi v5 direct media format
      if (item.url && item.mime) {
        return {
          id: item.id ?? index,
          documentId: item.documentId,
          type: item.mime?.startsWith('image/') ? 'image' : 'video',
          order: index,
          url: normalizeImageUrl(item.url),
          file: item,
        };
      }

      // Handle legacy mediaItems format
      const fileData = unwrapEntity(attributes.file) ?? attributes.file;
      const mediaType = attributes.type ?? "image";
      const url = resolveMediaUrl(fileData);

      return {
        id: item.id ?? attributes.id ?? index,
        documentId: attributes.documentId ?? item.documentId,
        type: mediaType,
        order: attributes.order,
        url,
        file: fileData,
      };
    });

    const firstVisualMedia = processedMediaItems.find((media) => media.url) ?? processedMediaItems[0];
    const imageUrl = firstVisualMedia?.url || DEFAULT_POST_IMAGE;

    const tags = unwrapCollection(base.tags)
      .map((tag: any) => {
        const attributes = tag.attributes ?? tag;
        return attributes.name || "";
      })
      .filter(Boolean);

    // Simplified likes handling - we'll get likes data from reaction service when needed
    const likesList: any[] = [];
    const likesCount = typeof base.likesCount === "number" ? base.likesCount : 0;

    const createdAt = base.createdAt ?? base.publishedAt ?? base.updatedAt;
    const timestamp = base.publishedAt ?? base.createdAt ?? base.updatedAt ?? "";

    const documentId = base.documentId || base.slug || `post-${base.id}`;

    const normalizedUser = userEntity
      ? {
          id: userEntity.id,
          documentId: userEntity.documentId,
          username: userEntity.username || "Unknown User",
          displayName: userEntity.displayName ?? userEntity.username ?? "Unknown User",
          profileImage: userEntity.profileImage,
        }
      : null;

    // userReaction is calculated by backend when user is authenticated
    const userReaction = base.userReaction !== undefined ? base.userReaction : null;

    const rawReactions = Array.isArray(base.reactions)
      ? base.reactions
      : Array.isArray(base.reactions?.data)
      ? base.reactions.data
      : undefined;

    const reactionSummaries = rawReactions
      ? rawReactions.map((reaction: any) => ({
          type: reaction.type,
          emoji: reaction.emoji || "",
          label: reaction.label || "",
          count:
            typeof reaction.count === "number"
              ? reaction.count
              : Number(reaction.count ?? 0) || 0,
          users: Array.isArray(reaction.users) ? reaction.users : [],
        }))
      : undefined;

    return {
      id: base.id,
      documentId,
      userId: normalizedUser?.id ?? null,
      userDocumentId: normalizedUser?.documentId,
      username: normalizedUser?.displayName ?? normalizedUser?.username ?? "Unknown User",
      userImage: userImageUrl,
      image: imageUrl,
      title: base.title ?? "",
      description: base.description ?? "",
      likes: likesCount,
      likesList,
      reactions: reactionSummaries,
      comments: [],
      timestamp,
      tags,
      mediaItems: processedMediaItems,
      media: processedMediaItems,
      contentType: base.contentType ?? "image",
      background: base.background ?? null,
      galleryLayout: base.galleryLayout ?? "grid",
      isOptimistic: base.isOptimistic,
      tempId: base.tempId,
      comments_count: base.commentsCount ?? base.comments_count ?? 0,
      createdAt,
      updatedAt: base.updatedAt,
      publishedAt: base.publishedAt,
      user: normalizedUser,
      likesCount,
      commentsCount: base.commentsCount ?? 0,
      savesCount: base.savesCount ?? 0,
      viewsCount: base.viewsCount ?? 0,
      shareCount: base.shareCount ?? 0,
      postStatus: base.postStatus ?? "published",
      userReaction,
    };
  } catch (error) {
    console.error("Error transforming post data:", error, "Post data:", post);
    throw new Error(
      `Error processing post data: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

// Function to get paginated posts
export async function getPosts(limit = 6, offset = 0, currentUserId?: string | null): Promise<PostsResponse> {
  try {
    // Calculate the page number from offset and limit
    const page = Math.floor(offset / limit) + 1;

    // Add a cache buster to avoid hitting the same cached error
    const cacheBuster = new Date().getTime();

    // Fetch posts from the API
    const response = await PostService.getPosts(page, limit, cacheBuster);

    // Check if the response contains an error
    if (response.error) {
      console.error("API returned an error:", response.error);
      throw new Error(
        `API error: ${response.error.message || "Unknown error"}`
      );
    }

    // Check if response and response.data exist before mapping
    if (!response || !response.data) {
      console.error("Invalid API response structure:", response);
      throw new Error("Invalid API response structure");
    }

    // Transform the API response to our Post interface
    const posts = Array.isArray(response.data)
      ? response.data.map(post => transformStrapiPost(post, currentUserId))
      : [];

    // Extract pagination info with fallbacks
    const pagination = response.meta?.pagination || {
      page: 1,
      pageSize: limit,
      pageCount: 1,
    };
    const hasMore = pagination.page < pagination.pageCount;

    return {
      posts,
      hasMore,
      nextPage: hasMore ? pagination.page + 1 : undefined,
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
}

// Function to get a single post by ID or documentId
export async function getPostById(
  idOrDocumentId: string | number,
  currentUserId?: string | null
): Promise<Post | null> {
  try {
    // Determine if we're dealing with a numeric ID or a documentId string
    const isNumericId = !isNaN(Number(idOrDocumentId));

    // Log the request for debugging
    console.log(
      `Fetching post with ${
        isNumericId ? "ID" : "documentId"
      }: ${idOrDocumentId}`
    );

    // Fetch the post from the API
    const response = await PostService.getPost(idOrDocumentId);

    // Check if the response contains an error
    if (response.error) {
      console.error("API returned an error:", response.error);
      throw new Error(
        `API error: ${response.error.message || "Unknown error"}`
      );
    }

    // Transform the API response to our Post interface
    if (response && response.data) {
      return transformStrapiPost(response.data, currentUserId);
    }

    return null;
  } catch (error) {
    console.error(`Error fetching post ${idOrDocumentId}:`, error);
    throw error;
  }
}

