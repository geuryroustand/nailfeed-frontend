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

    // STEP 1: Get media files from form data for upload after post creation
    const mediaFiles: File[] = [];

    // Extract actual File objects from formData
    const fileKeys = Array.from(formData.keys()).filter(key => key.startsWith('mediaFiles'));
    for (const key of fileKeys) {
      const file = formData.get(key) as File;
      if (file && file instanceof File) {
        mediaFiles.push(file);
      }
    }

    console.log("[v0] Server Action: Found media files for upload:", mediaFiles.length);

    // STEP 2: Create post without media (will be attached via upload endpoint)
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
        // Do NOT include media field - will be handled by upload endpoint
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

    console.log("[v0] Server Action: Post created successfully:", {
      id: postId,
      documentId: postDocumentId,
    });

    // STEP 3: Upload media files using Strapi's native upload endpoint with relations
    let uploadedMedia: any[] = [];
    if (mediaFiles.length > 0) {
      console.log("[v0] Server Action: Uploading media files using native Strapi endpoint");

      try {
        const uploadFormData = new FormData();

        // Add files to upload
        mediaFiles.forEach((file, index) => {
          uploadFormData.append("files", file, `${index}-${file.name}`);
        });

        // Strapi v5 relation parameters for automatic media attachment
        uploadFormData.append("ref", "api::post.post");
        uploadFormData.append("refId", postDocumentId); // Use documentId for Strapi v5
        uploadFormData.append("field", "media");

        console.log("[v0] Server Action: Upload relation parameters:", {
          ref: "api::post.post",
          refId: postDocumentId,
          field: "media"
        });

        const uploadUrl = `${apiUrl}/api/upload`;
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error("[v0] Server Action: Media upload failed:", errorText);
          // Don't fail the entire operation - post is already created
          console.log("[v0] Server Action: Continuing without media - post created successfully");
        } else {
          uploadedMedia = await uploadResponse.json();
          console.log("[v0] Server Action: Media uploaded successfully:", uploadedMedia.length);
        }
      } catch (error) {
        console.error("[v0] Server Action: Media upload error:", error);
        // Post is already created, so we don't fail the entire operation
      }
    }

    // STEP 4: Fetch complete post data with populated media relations
    let finalPostData = result.data;
    if (mediaFiles.length > 0) {
      try {
        const completePostUrl = `${apiUrl}/api/posts/${postDocumentId}?populate[user][populate]=profileImage&populate=media&populate=tags`;
        const completePostResponse = await fetch(completePostUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (completePostResponse.ok) {
          const completePostResult = await completePostResponse.json();
          finalPostData = completePostResult.data;
          console.log("[v0] Server Action: Complete post data fetched with media");
        }
      } catch (error) {
        console.error("[v0] Server Action: Failed to fetch complete post data:", error);
        // Continue with basic post data
      }
    }

    const endTime = Date.now();
    console.log(
      `[v0] Server Action: Post creation completed successfully in ${
        endTime - startTime
      }ms`
    );

    // Extract user data from the populated response
    const createdPostUser = finalPostData.user || result.data.user;
    const userData = createdPostUser || userObject;

    console.log("[v0] Server Action: Final user data:", userData);

    // Return optimized response with populated media
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
        media: finalPostData.media || uploadedMedia || [], // Use populated media first, fallback to upload response
        tags,
        // Extract user data from populated response
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
          finalPostData.createdAt ||
          finalPostData.publishedAt ||
          new Date().toISOString(),
        // Fallback fields for immediate display
        username: userData?.username || userObject?.username || "User",
        userImage: userData?.profileImage?.url || userObject?.profileImage?.url,
        uploadStats: {
          totalFiles: mediaFiles.length,
          uploadedFiles: uploadedMedia.length,
          uploadSuccess: uploadedMedia.length === mediaFiles.length,
        },
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
