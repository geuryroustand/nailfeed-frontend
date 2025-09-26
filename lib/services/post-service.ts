import qs from "qs";
import { fetchWithRetry, safeJsonParse } from "../fetch-with-retry";
import { API_URL, REQUEST_CONFIG, getServerApiToken } from "../config";

// Runtime helpers
const isServer = typeof window === "undefined";
const serverToken = getServerApiToken();
const useProxy = !isServer || !serverToken; // Use proxy on client or if no server token is available
const getServerSessionJWT = async (): Promise<string | null> => {
  if (!isServer) return null;
  try {
    const { verifySession } = await import("../auth/session");
    const session = await verifySession();
    return session?.strapiJWT ?? null;
  } catch (error) {
    console.error(
      "[v0] PostService.getServerSessionJWT - Failed to resolve session token",
      error
    );
    return null;
  }
};

// Join base and path
const joinUrl = (base: string, path: string) => {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
};

// Call our server proxy for JSON requests
const proxyJson = async (endpoint: string, method = "GET", data?: any) => {
  const res = await fetch("/api/auth-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    credentials: "include",
    body: JSON.stringify({ endpoint, method, data }),
  });
  return res;
};

// Call Strapi directly on server
const directJson = async (
  fullUrl: string,
  method = "GET",
  headers: HeadersInit = {},
  body?: any
) => {
  return fetchWithRetry(
    fullUrl,
    {
      method,
      headers,
      body:
        body !== undefined
          ? typeof body === "string"
            ? body
            : JSON.stringify(body)
          : undefined,
    },
    2
  );
};

export type ContentType =
  | "image"
  | "video"
  | "text"
  | "text-background"
  | "media-gallery";
export type GalleryLayout = "grid" | "carousel" | "featured";

export class PostService {
  // Helper function to construct full URLs for media items
  private static getFullUrl(relativePath: string): string {
    if (!relativePath) return "";
    if (relativePath.startsWith("http")) return relativePath;
    return `${API_URL}${
      relativePath.startsWith("/") ? "" : "/"
    }${relativePath}`;
  }

  // Get posts with pagination
  static async getPosts(page = 1, pageSize = 10, cacheBuster?: number) {
    // Client-side throttling
    const now = Date.now();
    PostService.requestTracker.lastRequestTime ??= 0;
    const timeSinceLast = now - PostService.requestTracker.lastRequestTime;
    if (timeSinceLast < PostService.requestTracker.minRequestInterval) {
      await new Promise((r) =>
        setTimeout(
          r,
          PostService.requestTracker.minRequestInterval - timeSinceLast
        )
      );
    }
    PostService.requestTracker.lastRequestTime = Date.now();

    try {
      const query = {
        fields: [
          "id",
          "documentId",
          "title",
          "description",
          "contentType",
          "background",
          "galleryLayout",
          "createdAt",
          "updatedAt",
          "publishedAt",
          "likesCount",
          "commentsCount",
          "savesCount",
          "viewsCount",
          "shareCount",
          "postStatus",
        ],
        populate: {
          user: {
            fields: ["id", "username", "displayName", "documentId"],
            populate: { profileImage: { fields: ["url", "formats"] } },
          },
          media: {
            fields: ["id", "url", "formats", "mime", "documentId"],
          },
          tags: { fields: ["id", "name", "documentId"] },
        },
        pagination: { page, pageSize },
        sort: ["publishedAt:desc"],
      };

      const queryString = qs.stringify(query, { encodeValuesOnly: true });
      const cacheParam = cacheBuster ? `&_cb=${cacheBuster}` : "";
      const endpoint = `/api/posts?${queryString}${cacheParam}`;

      // Perform request (proxy on client, direct on server)
      let resp: Response;
      if (useProxy) {
        // console.log(
        //   "[v0] PostService.getPosts - Using proxy for endpoint:",
        //   endpoint
        // );
        resp = await proxyJson(endpoint, "GET");
      } else {
        const fullUrl = joinUrl(API_URL, endpoint);
        const headers: HeadersInit = { "Content-Type": "application/json" };
        const sessionJwt = await getServerSessionJWT();
        if (sessionJwt) {
          headers["Authorization"] = `Bearer ${sessionJwt}`;
        } else if (serverToken) {
          headers["Authorization"] = `Bearer ${serverToken}`;
        }
        // console.log(
        //   "[v0] PostService.getPosts - Direct call to:",
        //   fullUrl,
        //   "using session token:",
        //   !!sessionJwt,
        //   "fallback server token:",
        //   !!serverToken
        // );
        resp = await directJson(fullUrl, "GET", headers);
      }

      if (resp.status === 429) {
        return { error: { code: "429", message: "Too Many Requests" } };
      }
      if (!resp.ok) {
        return {
          error: {
            code: String(resp.status),
            message: resp.statusText || "HTTP error",
          },
        };
      }

      const data = await safeJsonParse(resp);
      if (data.error) return data;

      // Log first post data to check userReaction
      // if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      //   console.log("[v0] PostService.getPosts - First post data:", {
      //     id: data.data[0].id,
      //     userReaction: data.data[0].userReaction,
      //     username: data.data[0].user?.username || data.data[0].username,
      //     title: data.data[0].title?.substring(0, 50),
      //     likesCount: data.data[0].likesCount,
      //     commentsCount: data.data[0].commentsCount,
      //     likes: data.data[0].likes,
      //     reactions: data.data[0].reactions,
      //     hasReactionsField: 'reactions' in data.data[0],
      //   })
      // }

      return data;
    } catch (error) {
      return {
        error: {
          code: "UNKNOWN_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  // Get posts by username
  static async getPostsByUsername(
    username: string,
    token?: string
  ): Promise<any[]> {
    try {
      const query = {
        filters: { user: { username: { $eq: username } } },
        fields: [
          "id",
          "documentId",
          "title",
          "description",
          "contentType",
          "background",
          "galleryLayout",
          "createdAt",
          "updatedAt",
          "publishedAt",
          "likesCount",
          "commentsCount",
          "savesCount",
          "viewsCount",
          "shareCount",
          "postStatus",
        ],
        populate: {
          user: {
            fields: ["id", "username", "displayName", "documentId"],
            populate: { profileImage: { fields: ["url", "formats"] } },
          },
          media: {
            fields: ["id", "url", "formats", "mime", "documentId"],
          },
          tags: { fields: ["id", "name", "documentId"] },
        },
        sort: ["publishedAt:desc"],
        pagination: { pageSize: 50 },
      };

      let res: Response;
      if (useProxy) {
        res = await proxyJson(
          `/api/posts?${qs.stringify(query, { encodeValuesOnly: true })}`,
          "GET"
        );
      } else {
        const fullUrl = joinUrl(
          API_URL,
          `/api/posts?${qs.stringify(query, { encodeValuesOnly: true })}`
        );
        const headers: HeadersInit = { "Content-Type": "application/json" };
        const auth = token || serverToken;
        if (auth) headers["Authorization"] = `Bearer ${auth}`;
        res = await fetch(fullUrl, {
          method: "GET",
          headers,
          cache: "no-store",
        });
      }

      if (!res.ok) return [];
      const responseData = await res.json();

      let posts: any[] = [];
      if (responseData.data && Array.isArray(responseData.data))
        posts = responseData.data;
      else if (responseData.results && Array.isArray(responseData.results))
        posts = responseData.results;
      else if (Array.isArray(responseData)) posts = responseData;

      return posts;
    } catch {
      return [];
    }
  }

  // Get a single post by ID or documentId
  static async getPost(idOrDocumentId: string | number) {
    try {
      const identifier = idOrDocumentId?.toString().trim();
      if (!identifier) {
        return {
          error: {
            code: "bad_request",
            message: "Missing post identifier",
          },
        };
      }

      const isNumericId = !Number.isNaN(Number(identifier));

      const populateConfig = {
        user: {
          fields: ["id", "documentId", "username", "displayName"],
          populate: {
            profileImage: {
              fields: ["url", "formats"],
            },
          },
        },
        media: {
          fields: ["id", "url", "formats", "mime", "documentId"],
        },
        tags: {
          fields: ["id", "name", "documentId"],
        },
        likes: {
          fields: ["id", "documentId", "type", "createdAt"],
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
        },
      };

      const qsOptions = { encodeValuesOnly: true, indices: false as const };
      const baseQueryString = qs.stringify(
        { populate: populateConfig },
        qsOptions
      );

      const encodedIdentifier = encodeURIComponent(identifier);
      const directEndpoint = `/api/posts/${encodedIdentifier}${
        baseQueryString ? `?${baseQueryString}` : ""
      }`;

      const sessionJwt =
        !useProxy && isServer ? await getServerSessionJWT() : null;

      const fetchEndpoint = async (endpoint: string) => {
        if (useProxy) {
          return proxyJson(endpoint, "GET");
        }

        const fullUrl = joinUrl(API_URL, endpoint);
        const headers: HeadersInit = { "Content-Type": "application/json" };

        if (sessionJwt) {
          headers["Authorization"] = `Bearer ${sessionJwt}`;
        } else if (serverToken) {
          headers["Authorization"] = `Bearer ${serverToken}`;
        }

        return fetchWithRetry(fullUrl, { method: "GET", headers });
      };

      console.log("[v0] PostService.getPost - Fetching:", directEndpoint);

      let resp = await fetchEndpoint(directEndpoint);

      if (!resp.ok) {
        const shouldFallbackToFilters =
          resp.status === 404 || (!isNumericId && resp.status >= 400);

        if (shouldFallbackToFilters) {
          const fallbackFilters = isNumericId
            ? { id: { $eq: Number(identifier) } }
            : { documentId: { $eq: identifier } };

          const fallbackQueryString = qs.stringify(
            {
              filters: fallbackFilters,
              populate: populateConfig,
              pagination: { limit: 1 },
            },
            qsOptions
          );

          console.log(
            "[v0] PostService.getPost - Falling back to filtered query"
          );
          resp = await fetchEndpoint(`/api/posts?${fallbackQueryString}`);
        }
      }

      if (!resp.ok) {
        const errorData = await safeJsonParse(resp);
        return {
          error: {
            code: String(resp.status),
            message:
              errorData?.error?.message || resp.statusText || "Unknown error",
          },
        };
      }

      const data = await safeJsonParse(resp);

      // Maintain backward compatibility with the former array response shape
      if (Array.isArray(data?.data)) {
        const firstEntry = data.data[0] || null;
        return firstEntry
          ? { data: firstEntry, meta: data.meta }
          : { data: null, meta: data.meta };
      }

      return data;
    } catch (error) {
      return {
        error: {
          code: "UNKNOWN_ERROR",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  }

  /**
   * Create a new post - DEPRECATED
   * Use createOptimizedPost server action instead for better performance.
   */
  static async createPost(postData: any) {
    throw new Error(
      "PostService.createPost is deprecated. Use createOptimizedPost server action instead."
    );
  }

  static async updatePost(id: number | string, postData: any) {
    try {
      const data = { data: postData };

      let res: Response;
      if (useProxy) {
        res = await proxyJson(`/api/posts/${id}`, "PUT", data);
      } else {
        const token = serverToken || "";
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
        const fullUrl = joinUrl(API_URL, `/api/posts/${id}`);
        res = await fetch(fullUrl, {
          method: "PUT",
          headers,
          body: JSON.stringify(data),
        });
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error (${res.status}): ${errorText}`);
      }
      return await res.json();
    } catch (error) {
      throw error;
    }
  }

  static async deletePost(id: number | string) {
    try {
      let res: Response;
      if (useProxy) {
        res = await proxyJson(`/api/posts/${id}`, "DELETE");
      } else {
        const token = serverToken || "";
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
        const fullUrl = joinUrl(API_URL, `/api/posts/${id}`);
        res = await fetch(fullUrl, { method: "DELETE", headers });
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error (${res.status}): ${errorText}`);
      }
      return await res.json();
    } catch (error) {
      throw error;
    }
  }

  // Like a post
  static async likePost(postId: number | string, userId: number | string) {
    try {
      const data = {
        data: {
          post: {
            connect: [typeof postId === "string" ? postId : postId.toString()],
          },
          user: {
            connect: [typeof userId === "string" ? userId : userId.toString()],
          },
        },
      };

      let res: Response;
      if (useProxy) {
        res = await proxyJson("/api/likes", "POST", data);
      } else {
        const token = serverToken || "";
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
        const fullUrl = joinUrl(API_URL, "/api/likes");
        res = await fetch(fullUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        });
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error (${res.status}): ${errorText}`);
      }

      return await res.json();
    } catch (error) {
      throw error;
    }
  }

  // Unlike a post
  static async unlikePost(likeId: number | string) {
    try {
      let res: Response;
      if (useProxy) {
        res = await proxyJson(`/api/likes/${likeId}`, "DELETE");
      } else {
        const token = serverToken || "";
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };
        const fullUrl = joinUrl(API_URL, `/api/likes/${likeId}`);
        res = await fetch(fullUrl, { method: "DELETE", headers });
      }

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error (${res.status}): ${errorText}`);
      }

      return await res.json();
    } catch (error) {
      throw error;
    }
  }

  // Add tags to a post
  static async addTagsToPost(postId: number | string, tags: string[]) {
    try {
      const postResponse = await this.getPost(postId);
      const postData = (postResponse as any)?.data || {};

      const existingTags = postData.tags || [];
      const newTags = [...existingTags, ...tags.map((name) => ({ name }))];

      const updateData = { tags: newTags };
      return await this.updatePost(postId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // internal request throttling
  private static requestTracker = {
    lastRequestTime: 0,
    minRequestInterval: REQUEST_CONFIG.minRequestInterval,
  };
}
