// Server-side data fetching for posts
import { apiClient } from "@/lib/api-client";
import { fetchWithRetry } from "@/lib/fetch-with-retry";
import { normalizeImageUrl, getImageFormat } from "@/lib/image-utils";

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

export type Post = {
  id: number;
  documentId?: string;
  userId?: string | number | null;
  username: string;
  userImage: string;
  image: string;
  mediaItems: Array<{
    id: string | number;
    type: string;
    url: string;
    file?: any;
  }>;
  contentType: "image" | "video" | "media-gallery" | "text";
  galleryLayout?: "grid" | "carousel";
  description: string;
  likes: number;
  comments: PostComment[];
  timestamp: string;
  tags: string[];
};

export type PaginatedPostsResponse = {
  posts: Post[];
  nextCursor: number | null;
  hasMore: boolean;
};

// Function to get paginated posts - tries API first, falls back to sample data
export async function getPosts(
  limit = 3,
  cursor = 0
): Promise<PaginatedPostsResponse> {
  console.log(`Getting posts with limit ${limit} and cursor ${cursor}`);

  // Check if we should use sample data based on environment variable
  if (process.env.USE_SAMPLE_DATA === "true") {
    console.log("Using sample data based on environment variable");
    return getFallbackPosts(limit, cursor);
  }

  try {
    // Try to fetch posts from Strapi - no caching
    console.log("Fetching posts from Strapi without caching");
    return await fetchPostsFromStrapi(limit, cursor);
  } catch (error) {
    console.error("Error fetching posts from Strapi:", error);

    // Check if it's a rate limit error
    if (
      error instanceof Error &&
      (error.message.includes("Too Many Requests") ||
        error.message.includes("429"))
    ) {
      console.log("Rate limit exceeded, using fallback data");
    } else {
      console.log("Other API error, using fallback data");
    }

    return getFallbackPosts(limit, cursor);
  }
}

// Update the fetchPostsFromStrapi function to handle the Strapi v5 response format
async function fetchPostsFromStrapi(
  limit = 3,
  cursor = 0
): Promise<PaginatedPostsResponse> {
  try {
    // Use a smaller page size to reduce the chance of hitting rate limits
    const pageSize = Math.min(limit, 2); // Even smaller page size (2) to reduce rate limiting
    const page = cursor > 0 ? Math.ceil(cursor / pageSize) + 1 : 1;

    // Use the exact endpoint specified with pagination and specific populate parameters
    const endpoint = `/posts?pagination[page]=${page}&populate[mediaItems][populate][file][fields][0]=formats&populate[user][fields][0]=username&populate[user][fields][1]=displayName&populate[user][populate][profileImage][fields][0]=formats&pagination[pageSize]=${pageSize}`;
    console.log(`Fetching from endpoint: ${endpoint}`);

    // Try with apiClient and retry logic with more conservative settings
    console.log("Using apiClient with conservative retry logic");
    const response = await fetchWithRetry(
      () =>
        apiClient.get(endpoint, {
          cache: "no-store",
        }),
      {
        maxRetries: 1, // Reduced to 1 retry only
        initialDelay: 3000, // Increased delay
        maxDelay: 10000,
        backoffFactor: 2,
        retryStatusCodes: [408, 500, 502, 503, 504], // Removed 429 (rate limit) to handle differently
        onRetry: (attempt, delay, error) => {
          console.log(
            `Retrying fetch (attempt ${attempt}) after ${delay}ms due to error:`,
            error
          );
        },
      }
    );

    console.log("Strapi response received:", response ? "yes" : "no");

    return processPostsResponse(response, limit, cursor);
  } catch (error) {
    console.error("Error in fetchPostsFromStrapi:", error);

    // Check if it's a rate limit error and throw a specific error
    if (
      error instanceof Error &&
      (error.message.includes("Too Many Requests") ||
        error.message.includes("429"))
    ) {
      throw new Error("Too Many Requests");
    }

    throw error;
  }
}

// Helper function to process the posts response
function processPostsResponse(
  response: any,
  limit = 3,
  cursor = 0
): PaginatedPostsResponse {
  // Check if response has the expected structure
  if (!response || !response.data) {
    // Check for error structure
    if (response && response.error) {
      console.error("API returned an error:", response.error);
      throw new Error(
        `API error (${response.error.code || "unknown"}): ${JSON.stringify(
          response.error
        )}`
      );
    }

    console.error("Invalid response structure:", response);
    throw new Error("Invalid API response structure");
  }

  // Handle different response structures
  const postsData = Array.isArray(response.data)
    ? response.data
    : response.data.data && Array.isArray(response.data.data)
    ? response.data.data
    : [];

  // Transform Strapi response to our app's format with better error handling
  const posts = postsData.map((post: any) => {
    try {
      // Extract user information with fallbacks
      const user = post.user || {};
      const username = user.username || "Unknown User";

      // Extract profile image with fallbacks - note the different structure
      let userImage = "/serene-woman-gaze.png";

      // Handle the nested profile image structure from the updated API response
      if (user.profileImage) {
        if (user.profileImage.formats) {
          // Get the best format available
          const formats = user.profileImage.formats;
          userImage = normalizeImageUrl(
            formats.medium?.url ||
              formats.small?.url ||
              formats.thumbnail?.url ||
              formats.large?.url ||
              user.profileImage.url
          );
        } else if (user.profileImage.url) {
          userImage = normalizeImageUrl(user.profileImage.url);
        } else if (typeof user.profileImage === "string") {
          userImage = normalizeImageUrl(user.profileImage);
        }
      }

      // Extract media items with better handling of different response structures
      let mediaItems = [];
      const image = post.image; // Declare image here
      if (post.mediaItems) {
        if (Array.isArray(post.mediaItems)) {
          // Handle Strapi v5 nested media structure
          mediaItems = post.mediaItems.map((item: any) => {
            // Get the file URL from the nested structure
            let url = "/abstract-pastel-swirls.png"; // Fallback

            if (item.file && item.file.formats) {
              // Get the best format available
              const imageUrl = getImageFormat(item.file.formats);
              if (imageUrl) {
                url = normalizeImageUrl(imageUrl);
              }
            } else if (item.url) {
              // Direct URL case
              url = normalizeImageUrl(item.url);
            }

            return {
              id: item.id || `media-${Math.random()}`,
              type: item.type || "image",
              url: url,
              file: item.file, // Keep the original file object with formats
            };
          });
        } else if (
          post.mediaItems.data &&
          Array.isArray(post.mediaItems.data)
        ) {
          // Nested in data array (Strapi format)
          mediaItems = post.mediaItems.data.map((item: any) => {
            const mediaData = item.attributes || item;
            return {
              id: item.id || `media-${Math.random()}`,
              type:
                mediaData.type ||
                (mediaData.url?.includes(".mp4") ? "video" : "image"),
              url:
                mediaData.url ||
                mediaData.formats?.medium?.url ||
                mediaData.formats?.small?.url ||
                mediaData.formats?.thumbnail?.url ||
                "/abstract-pastel-swirls.png",
              file: mediaData.file || mediaData, // Keep the original file object with formats
            };
          });
        }
      }

      // If we still don't have media items but have an image, create a media item from it
      if (mediaItems.length === 0 && image) {
        mediaItems = [
          {
            id: `legacy-image-${Math.random()}`,
            type: "image",
            url: image,
          },
        ];
      }

      // Extract comments with fallbacks
      const comments: PostComment[] = (post.comments || []).map(
        (comment: any) => {
          return {
            id: comment.id || Math.random(),
            username: comment.user?.username || "Anonymous",
            text: comment.text || "",
            likes: comment.likes || 0,
            reactions: {},
          };
        }
      );

      // Extract tags with fallbacks
      const tags: string[] = (post.tags || [])
        .map((tag: any) => tag.name || "")
        .filter(Boolean);

      return {
        id: post.id || Math.random(),
        documentId: post.documentId || post.id?.toString() || "", // Ensure we capture documentId
        userId: user.id || null,
        username,
        userImage,
        image, // Keep for backward compatibility
        mediaItems, // Add this line
        contentType:
          mediaItems.length > 1
            ? "media-gallery"
            : mediaItems.length === 1
            ? mediaItems[0].type === "video"
              ? "video"
              : "image"
            : "text",
        galleryLayout: mediaItems.length > 1 ? "grid" : undefined,
        description: post.description || "",
        likes: post.likesCount || 0,
        comments,
        timestamp: formatTimestamp(
          post.createdAt || post.publishedAt || new Date().toISOString()
        ),
        tags,
      };
    } catch (error) {
      console.error("Error transforming post:", error);
      // Return a placeholder post instead of failing completely
      return {
        id: Math.random(),
        username: "Error Loading Post",
        userImage: "/serene-woman-gaze.png",
        image: "/abstract-pastel-swirls.png",
        description: "This post couldn't be loaded correctly.",
        likes: 0,
        comments: [],
        timestamp: "Recently",
        tags: [],
      };
    }
  });

  // Get pagination info with fallbacks
  const pagination = response.meta?.pagination || {
    page: 1,
    pageSize: limit,
    pageCount: 1,
    total: posts.length,
  };
  const hasMore = pagination.page < pagination.pageCount;
  const nextCursor = hasMore ? cursor + limit : null;

  return {
    posts,
    nextCursor,
    hasMore,
  };
}

// Helper function to format timestamp
function formatTimestamp(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 6) {
      return date.toLocaleDateString();
    } else if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return "Just now";
    }
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Recently";
  }
}

// Sample posts for fallback
const samplePosts: Post[] = [
  {
    id: 1,
    documentId: "post1",
    username: "nailartist1",
    userImage: "/diverse-avatars.png",
    image: "/sample-nails-1.jpg",
    mediaItems: [
      {
        id: 1,
        type: "image",
        url: "/sample-nails-1.jpg",
      },
    ],
    contentType: "image",
    description: "Beautiful spring nails with floral design",
    likes: 120,
    comments: [
      {
        id: 1,
        username: "user1",
        text: "Love these!",
        likes: 5,
        reactions: {},
      },
    ],
    timestamp: "2024-03-15T10:00:00Z",
    tags: ["spring", "floral", "pink"],
  },
  {
    id: 2,
    documentId: "post2",
    username: "nailartist2",
    userImage: "/diverse-avatars.png",
    image: "/sample-nails-2.jpg",
    mediaItems: [
      {
        id: 2,
        type: "image",
        url: "/sample-nails-2.jpg",
      },
    ],
    contentType: "image",
    description: "Elegant French manicure with gold accents",
    likes: 95,
    comments: [
      {
        id: 2,
        username: "user2",
        text: "So classy!",
        likes: 3,
        reactions: {},
      },
    ],
    timestamp: "2024-03-14T15:30:00Z",
    tags: ["french", "gold", "elegant"],
  },
];

// Function to get fallback paginated posts
function getFallbackPosts(limit = 3, cursor = 0): PaginatedPostsResponse {
  console.log(`Using fallback posts with limit ${limit} and cursor ${cursor}`);

  // Get posts after the cursor
  const startIndex = cursor;
  const endIndex = startIndex + limit;
  const posts = samplePosts.slice(startIndex, endIndex);

  // Determine if there are more posts
  const hasMore = endIndex < samplePosts.length;

  // Return paginated response
  return {
    posts,
    nextCursor: hasMore ? endIndex : null,
    hasMore,
  };
}

// Function to get a single post by ID or documentId
export async function getPostById(
  idOrDocumentId: number | string
): Promise<Post | null> {
  console.log(`Getting post with ID or documentId: ${idOrDocumentId}`);

  // Check if we should use sample data based on environment variable
  if (process.env.USE_SAMPLE_DATA === "true") {
    console.log("Using sample data based on environment variable");
    return getFallbackPostById(idOrDocumentId);
  }

  try {
    // Try to fetch the post from Strapi
    console.log("Fetching post from Strapi");
    return await fetchPostFromStrapi(idOrDocumentId);
  } catch (error) {
    console.error(
      `Error fetching post with ID/documentId ${idOrDocumentId} from Strapi:`,
      error
    );

    // Check if it's a rate limit error
    if (
      error instanceof Error &&
      (error.message.includes("Too Many Requests") ||
        error.message.includes("429"))
    ) {
      console.log("Rate limit exceeded, using fallback data");
    } else {
      console.log("Other API error, using fallback data");
    }

    return getFallbackPostById(idOrDocumentId);
  }
}

// Function to fetch a single post from Strapi
async function fetchPostFromStrapi(
  idOrDocumentId: number | string
): Promise<Post | null> {
  try {
    // Determine if we're using a numeric ID or a documentId
    const isNumericId = /^\d+$/.test(idOrDocumentId.toString());

    // Use the appropriate endpoint based on the ID type
    // For documentId, use the filters approach
    // For numeric ID, use the direct ID approach but with simplified populate parameters
    const endpoint = isNumericId
      ? `/api/posts/${idOrDocumentId}?populate[mediaItems][populate]=*&populate[user]=*`
      : `/api/posts?filters[documentId][$eq]=${idOrDocumentId}&populate[mediaItems][populate]=*&populate[user]=*`;

    console.log(`Fetching from endpoint: ${endpoint}`);

    // Use apiClient with retry logic
    const response = await fetchWithRetry(
      () =>
        apiClient.get(endpoint, {
          cache: "no-store",
        }),
      {
        maxRetries: 1,
        initialDelay: 2000,
        maxDelay: 5000,
        backoffFactor: 2,
        retryStatusCodes: [408, 500, 502, 503, 504],
        onRetry: (attempt, delay, error) => {
          console.log(
            `Retrying fetch (attempt ${attempt}) after ${delay}ms due to error:`,
            error
          );
        },
      }
    );

    if (!response || !response.data) {
      console.error("Invalid response structure:", response);
      return null;
    }

    // Process the post data based on whether we used a filter or direct ID
    let postData;

    if (isNumericId) {
      // Direct ID endpoint returns the post directly
      postData = response.data;
    } else {
      // Filter endpoint returns an array, take the first item
      const postsArray = Array.isArray(response.data) ? response.data : [];
      if (postsArray.length === 0) {
        console.log(`No post found with documentId: ${idOrDocumentId}`);
        return null;
      }
      postData = postsArray[0];
    }

    // Transform the post data using the same logic as in processPostsResponse
    try {
      // Extract user information with fallbacks
      const user = postData.user || {};
      const username = user.username || "Unknown User";

      // Extract profile image with fallbacks
      let userImage = "/serene-woman-gaze.png";

      // Handle the nested profile image structure
      if (user.profileImage) {
        if (user.profileImage.formats) {
          // Get the best format available
          const formats = user.profileImage.formats;
          userImage = normalizeImageUrl(
            formats.medium?.url ||
              formats.small?.url ||
              formats.thumbnail?.url ||
              formats.large?.url ||
              user.profileImage.url
          );
        } else if (user.profileImage.url) {
          userImage = normalizeImageUrl(user.profileImage.url);
        } else if (typeof user.profileImage === "string") {
          userImage = normalizeImageUrl(user.profileImage);
        }
      }

      // Extract media items
      let mediaItems = [];
      const image = postData.image;
      if (postData.mediaItems) {
        if (Array.isArray(postData.mediaItems)) {
          // Handle Strapi v5 nested media structure
          mediaItems = postData.mediaItems.map((item: any) => {
            // Get the file URL from the nested structure
            let url = "/abstract-pastel-swirls.png"; // Fallback

            if (item.file && item.file.formats) {
              // Get the best format available
              const imageUrl = getImageFormat(item.file.formats);
              if (imageUrl) {
                url = normalizeImageUrl(imageUrl);
              }
            } else if (item.url) {
              // Direct URL case
              url = normalizeImageUrl(item.url);
            }

            return {
              id: item.id || `media-${Math.random()}`,
              type: item.type || "image",
              url: url,
              file: item.file, // Keep the original file object with formats
            };
          });
        } else if (
          postData.mediaItems.data &&
          Array.isArray(postData.mediaItems.data)
        ) {
          // Nested in data array (Strapi format)
          mediaItems = postData.mediaItems.data.map((item: any) => {
            const mediaData = item.attributes || item;
            return {
              id: item.id || `media-${Math.random()}`,
              type:
                mediaData.type ||
                (mediaData.url?.includes(".mp4") ? "video" : "image"),
              url:
                mediaData.url ||
                mediaData.formats?.medium?.url ||
                mediaData.formats?.small?.url ||
                mediaData.formats?.thumbnail?.url ||
                "/abstract-pastel-swirls.png",
              file: mediaData.file || mediaData, // Keep the original file object with formats
            };
          });
        }
      }

      // If we still don't have media items but have an image, create a media item from it
      if (mediaItems.length === 0 && image) {
        mediaItems = [
          {
            id: `legacy-image-${Math.random()}`,
            type: "image",
            url: image,
          },
        ];
      }

      // Extract comments with fallbacks - simplified to avoid API errors
      const comments: PostComment[] = [];

      // Extract tags with fallbacks - simplified to avoid API errors
      const tags: string[] = [];

      return {
        id: postData.id || Math.random(),
        documentId: postData.documentId || postData.id?.toString() || "",
        userId: user.id || null,
        username,
        userImage,
        image, // Keep for backward compatibility
        mediaItems,
        contentType:
          mediaItems.length > 1
            ? "media-gallery"
            : mediaItems.length === 1
            ? mediaItems[0].type === "video"
              ? "video"
              : "image"
            : "text",
        galleryLayout: mediaItems.length > 1 ? "grid" : undefined,
        description: postData.description || "",
        likes: postData.likesCount || 0,
        comments,
        timestamp: formatTimestamp(
          postData.createdAt || postData.publishedAt || new Date().toISOString()
        ),
        tags,
      };
    } catch (error) {
      console.error("Error transforming post:", error);
      return null;
    }
  } catch (error) {
    console.error(
      `Error in fetchPostFromStrapi for ID/documentId ${idOrDocumentId}:`,
      error
    );
    throw error;
  }
}

// Function to get a fallback post by ID or documentId
function getFallbackPostById(idOrDocumentId: number | string): Post | null {
  console.log(`Using fallback post with ID/documentId: ${idOrDocumentId}`);

  // Try to find by documentId first
  let post = samplePosts.find(
    (p) => p.documentId === idOrDocumentId.toString()
  );

  // If not found, try by numeric ID
  if (!post) {
    const numericId =
      typeof idOrDocumentId === "string"
        ? Number.parseInt(idOrDocumentId, 10)
        : idOrDocumentId;
    post = samplePosts.find((p) => p.id === numericId);
  }

  return post || null;
}
