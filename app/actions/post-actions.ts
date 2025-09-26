"use server";

import { validateSession } from "@/lib/auth/session";
import type { ContentType, GalleryLayout } from "@/lib/services/post-service";
import type { BackgroundType } from "@/components/post-background-selector";

export async function createPost(formData: FormData) {
  const startTime = Date.now();
  try {
    console.log("[v0] Server Action: Starting optimized post creation process");

    const { user: authenticatedUser, session } = await validateSession();

    if (!authenticatedUser || !session?.strapiJWT) {
      return {
        success: false,
        error: "Authentication required. Please log in to create posts.",
      };
    }

    const token = session.strapiJWT;
    let userId: string | null = String(authenticatedUser.id);
    let userDocumentId: string | null = null;

    // Try to get the user documentId from form data (preferred)
    userDocumentId = formData.get("userDocumentId") as string;
    if (!userDocumentId) {
      // If no documentId, try to get the regular userId
      if (!userId) {
        userId = formData.get("userId") as string;
      }
    }

    // Extract user data from form (optimized parsing)
    const userObjectJson = formData.get("userObject") as string;
    let userObject: any = null;

    if (userObjectJson) {
      try {
        userObject = JSON.parse(userObjectJson);
        userDocumentId =
          userObject?.documentId || (formData.get("userDocumentId") as string);
        userId = userId || userObject?.id?.toString();

        console.log("[v0] Server Action: User data extracted:", {
          documentId: userDocumentId,
          userId: userId,
          username: userObject?.username,
        });
      } catch (e) {
        console.error("[v0] Server Action: Error parsing user object:", e);
      }
    }

    // If no user ID is found, return an error
    if (!userDocumentId && !userId) {
      console.error("[v0] Server Action: No user ID found");
      return {
        success: false,
        error: "User identification required. Please log in again.",
      };
    }

    console.log(
      "[v0] Server Action: Authentication verified, proceeding with post creation"
    );
    console.log(
      `[v0] Server Action: Using user ID: ${userId || userDocumentId}`
    );

    // Extract data from formData
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const contentType = (formData.get("contentType") as ContentType) || "text";
    const galleryLayout =
      (formData.get("galleryLayout") as GalleryLayout) || "grid";
    const backgroundJson = formData.get("background") as string;
    const tagsJson = formData.get("tags") as string;

    // Parse JSON data
    const background = backgroundJson
      ? (JSON.parse(backgroundJson) as BackgroundType)
      : undefined;

    // Check if tagsJson exists and is not empty before parsing
    let tags: string[] = [];
    if (tagsJson) {
      try {
        const parsedTags = JSON.parse(tagsJson);
        if (Array.isArray(parsedTags)) {
          tags = parsedTags;
        }
      } catch (e) {
        console.error("[v0] Server Action: Error parsing tags JSON:", e);
      }
    }

    console.log("[v0] Server Action: Tags from form data:", tags);

    // Prepare API URL and headers
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      console.error(
        "[v0] Server Action: API_URL environment variable is not set"
      );
      return {
        success: false,
        error: "Server configuration error: API_URL is not defined.",
      };
    }
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    // STEP 1: Get uploaded files from form data (uploaded on client)
    let uploadedMediaItems: any[] = [];
    let uploadedFiles: any[] = [];

    // Get uploaded files data passed from client
    const uploadedFilesJson = formData.get("uploadedFiles") as string;

    if (uploadedFilesJson) {
      try {
        uploadedFiles = JSON.parse(uploadedFilesJson);
        console.log("[v0] Server Action: Using pre-uploaded files:", uploadedFiles.length);

        // Create mediaItems array with uploaded file data
        uploadedMediaItems = uploadedFiles.map((file: any, index: number) => ({
          id: file.id,
          file: file, // Use the complete file object
          type: file.mime.startsWith("image/") ? "image" : "video",
          url: file.url, // Add the direct URL
          order: index + 1,
        }));

        console.log("[v0] Server Action: Prepared media items:", uploadedMediaItems);
      } catch (error) {
        console.error("[v0] Server Action: Error parsing uploaded files:", error);
        return {
          success: false,
          error: "Invalid uploaded files data",
        };
      }
    }

    // STEP 2: Create optimized post with proper user association (Strapi v5 compatible)
    const postData: any = {
      data: {
        title: title || "",
        description,
        contentType,
        background,
        galleryLayout,
        // Ensure proper user connection using documentId for Strapi v5
        user: userDocumentId
          ? { connect: [userDocumentId] }
          : userId
          ? { connect: [userId.toString()] }
          : null,
        tags: tags,
        media: uploadedFiles.map((file: any) => file.id), // Send only IDs to Strapi
        // Set post status and counters with defaults
        postStatus: "published",
        likesCount: 0,
        commentsCount: 0,
        savesCount: 0,
        viewsCount: 0,
        shareCount: 0,
        featured: false,
        isReported: false,
      },
    };

    // Don't send userInfo - it's not part of the Strapi schema
    // User data will be populated through the relation

    console.log(
      "[v0] Server Action: Creating post with data:",
      JSON.stringify(postData, null, 2)
    );

    // STEP 3: Create post with population to get user data back
    const postEndpoint = "/api/posts";
    const postUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${
      postEndpoint.startsWith("/") ? postEndpoint.substring(1) : postEndpoint
    }?populate[user][populate]=profileImage`; // Populate user data for response

    const postResponse = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(postData),
      cache: "no-store",
    });

    // Log the response status for debugging
    console.log(
      `[v0] Server Action: Post creation response status: ${postResponse.status}`
    );

    let responseText;
    try {
      responseText = await postResponse.text();
      console.log(
        "[v0] Server Action: Raw post creation response:",
        responseText
      );
    } catch (e) {
      console.error("[v0] Server Action: Failed to get response text:", e);
    }

    if (!postResponse.ok) {
      console.error(
        `[v0] Server Action: Post creation failed with status ${postResponse.status}:`,
        responseText
      );
      throw new Error(
        `Post creation failed with status ${postResponse.status}: ${responseText}`
      );
    }

    let result;
    try {
      result = JSON.parse(responseText || "{}");
      console.log("[v0] Server Action: Post creation successful:", result);
    } catch (e) {
      console.error("[v0] Server Action: Failed to parse response JSON:", e);
      throw new Error("Failed to parse server response");
    }

    const postId = result.data.id;
    const postDocumentId = result.data.documentId || `doc-${postId}`;

    // Avoid triggering framework-wide revalidations or client SW cache invalidations here.
    // The client feed performs an optimistic update using the returned payload.

    const endTime = Date.now();
    console.log(
      `[v0] Server Action: Post creation completed successfully in ${
        endTime - startTime
      }ms`
    );

    // Extract user data from the populated response
    const createdPostUser = result.data.user;
    const userData = createdPostUser || userObject;

    console.log(
      "[v0] Server Action: User data from response:",
      createdPostUser
    );
    console.log("[v0] Server Action: Final user data:", userData);


    // Return optimized response with user data to prevent "unknown" display
    return {
      success: true,
      post: {
        id: postId,
        documentId: postDocumentId,
        title: title || "",
        description,
        contentType,
        background,
        galleryLayout,
        media: uploadedFiles, // Use the uploaded files directly
        tags,
        // Extract user data from either populated response or original userObject
        user: {
          id: userData?.id || userObject?.id,
          documentId: userData?.documentId || userObject?.documentId,
          username: userData?.username || userObject?.username,
          displayName:
            userData?.displayName ||
            userObject?.displayName ||
            userData?.username ||
            userObject?.username,
          profileImage: userData?.profileImage || userObject?.profileImage,
        },
        createdAt:
          result.data.createdAt ||
          result.data.publishedAt ||
          new Date().toISOString(),
        // Fallback fields for immediate display
        username: userData?.username || userObject?.username || "User",
        userImage: userData?.profileImage?.url || userObject?.profileImage?.url,
      },
    };
  } catch (error) {
    console.error("[v0] Server Action: Error in createPost:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unknown error occurred during post creation. Please try again.",
    };
  }
}
