"use client";

import { apiClient } from "@/lib/api-client";
import { API_CONFIG, constructApiUrl, getAuthHeaders } from "@/lib/config";

export type ContentType =
  | "image"
  | "video"
  | "text"
  | "text-background"
  | "media-gallery";
export type GalleryLayout = "grid," | "carousel," | "featured";

export class PostService {
  // Helper function to construct full URLs for media items
  private static getFullUrl(relativePath: string): string {
    if (!relativePath) return "";
    if (relativePath.startsWith("http")) return relativePath;

    return constructApiUrl(relativePath);
  }

  // Get posts with pagination
  static async getPosts(page = 1, pageSize = 10) {
    try {
      console.log(
        `PostService: Fetching posts page ${page} with pageSize ${pageSize}`
      );

      // Construct the endpoint with specific populate parameters
      const endpoint = `posts?pagination[page]=${page}&populate[mediaItems][populate][file][fields][0]=formats&populate[user][fields][0]=username&populate[user][fields][1]=displayName&populate[user][populate][profileImage][fields][0]=formats&pagination[pageSize]=${pageSize}`;

      // Log the full URL that will be used
      const fullUrl = constructApiUrl(endpoint);
      console.log(`PostService: Full URL: ${fullUrl}`);

      // Make the request using the API client
      const response = await apiClient.get(endpoint);

      // Validate response structure
      if (!response || !response.data) {
        console.error("PostService: Invalid response structure:", response);
        throw new Error("Invalid API response structure");
      }

      // Add a debug log to inspect the media items structure
      if (
        response.data &&
        response.data.length > 0 &&
        response.data[0].mediaItems
      ) {
        console.log(
          "PostService: First post media items structure:",
          JSON.stringify(response.data[0].mediaItems[0], null, 2)
        );
      }

      console.log(
        `PostService: Successfully fetched ${
          Array.isArray(response.data) ? response.data.length : 0
        } posts`
      );
      return response;
    } catch (error) {
      console.error("PostService: Error fetching posts:", error);
      throw error;
    }
  }

  // Get a single post by ID
  static async getPost(id: number | string) {
    try {
      console.log(`PostService: Fetching post ${id}`);
      // Update the single post endpoint to use the same populate structure
      const endpoint = `posts/${id}?populate[mediaItems][populate][file][fields][0]=formats&populate[user][fields][0]=username&populate[user][fields][1]=displayName&populate[user][populate][profileImage][fields][0]=formats`;
      const response = await apiClient.get(endpoint);
      return response;
    } catch (error) {
      console.error(`PostService: Error fetching post ${id}:`, error);
      throw error;
    }
  }

  // Create a new post with proper Strapi 5 format
  static async createPost(postData: {
    title: string;
    description: string;
    contentType?: ContentType;
    background?: any;
    featured?: boolean;
    galleryLayout?: GalleryLayout;
    userId?: string; // This should be the documentId, not the numeric ID
  }) {
    console.log(
      "PostService: Creating post with data:",
      JSON.stringify(postData, null, 2)
    );

    try {
      // Extract userId from postData
      const { userId, ...postFields } = postData;

      // Create the post data object with proper Strapi 5 format
      const data = {
        data: {
          ...postFields,
          // Only include user if userId is provided
          ...(userId
            ? {
                user: {
                  connect: [userId], // Strapi 5 relation format
                },
              }
            : {}),
          // Ensure the post is published immediately
          publishedAt: new Date().toISOString(),
        },
      };

      console.log(
        "PostService: Sending post creation request with data:",
        JSON.stringify(data, null, 2)
      );

      // Use the API client for consistent authentication handling
      const response = await apiClient.post("posts", data);
      console.log("PostService: Post creation response:", response);
      return response;
    } catch (error) {
      console.error("PostService: Error creating post:", error);
      throw error;
    }
  }

  // Update an existing post
  static async updatePost(id: number | string, postData: any) {
    try {
      console.log(
        `PostService: Updating post ${id} with data:`,
        JSON.stringify(postData, null, 2)
      );

      // For Strapi 5, we need to wrap the data in a data object
      const wrappedData = { data: postData };

      // Use the API client for consistent authentication handling
      const response = await apiClient.put(`posts/${id}`, wrappedData);
      console.log("PostService: Post update response:", response);
      return response;
    } catch (error) {
      console.error(`PostService: Error updating post ${id}:`, error);
      throw error;
    }
  }

  // Delete a post
  static async deletePost(id: number | string) {
    try {
      console.log(`PostService: Deleting post ${id}`);
      const response = await apiClient.delete(`posts/${id}`);
      return response;
    } catch (error) {
      console.error(`PostService: Error deleting post ${id}:`, error);
      throw error;
    }
  }

  // Like a post
  static async likePost(postId: number | string, userId: number | string) {
    try {
      console.log(`PostService: Liking post ${postId} for user ${userId}`);
      const response = await apiClient.post(`posts/${postId}/like`, {
        userId,
      });
      return response;
    } catch (error) {
      console.error(`PostService: Error liking post ${postId}:`, error);
      throw error;
    }
  }

  // Unlike a post
  static async unlikePost(likeId: number | string) {
    try {
      console.log(`PostService: Unliking post ${likeId}`);
      const response = await apiClient.delete(`likes/${likeId}`);
      return response;
    } catch (error) {
      console.error(`PostService: Error unliking post ${likeId}:`, error);
      throw error;
    }
  }

  // Add tags to a post
  static async addTagsToPost(
    postId: number | string,
    tags: string[],
    token?: string
  ) {
    try {
      console.log(`PostService: Adding tags to post ${postId}:`, tags);
      const response = await apiClient.post(
        `posts/${postId}/tags`,
        { tags },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      return response;
    } catch (error) {
      console.error(`PostService: Error adding tags to post ${postId}:`, error);
      throw error;
    }
  }

  // Upload media files
  static async uploadMedia(
    files: File[],
    postId: number | string,
    token?: string
  ) {
    try {
      console.log(`PostService: Uploading media for post ${postId}`);
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await apiClient.post(`upload`, formData, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "Content-Type": "multipart/form-data",
        },
      });
      return response;
    } catch (error) {
      console.error(
        `PostService: Error uploading media for post ${postId}:`,
        error
      );
      throw error;
    }
  }

  // Get media document IDs
  static async getMediaDocumentIds(
    mediaIds: number[],
    token?: string
  ): Promise<string[]> {
    try {
      console.log(`PostService: Getting media document IDs for:`, mediaIds);
      const response = await apiClient.get(
        `upload/files?filters[id][$in]=${mediaIds.join(",")}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data.map((file: any) => file.documentId);
    } catch (error) {
      console.error("PostService: Error getting media document IDs:", error);
      throw error;
    }
  }

  // Create a media item
  static async createMediaItem(mediaData: {
    post: number | string;
    media: number | string;
    type: string;
    order?: number;
  }) {
    try {
      console.log("PostService: Creating media item:", mediaData);
      const response = await apiClient.post("media-items", {
        data: mediaData,
      });
      return response;
    } catch (error) {
      console.error("PostService: Error creating media item:", error);
      throw error;
    }
  }
}
