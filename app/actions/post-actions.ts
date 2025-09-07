"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { ContentType, GalleryLayout } from "@/lib/services/post-service";
import type { BackgroundType } from "@/components/post-background-selector";

export async function createPost(formData: FormData) {
  try {
    console.log("[v0] Server Action: Starting post creation process");

    // Check if user is authenticated - try multiple sources
    const cookieStore = await cookies();
    let token =
      cookieStore.get("jwt")?.value || cookieStore.get("authToken")?.value;
    let userId = cookieStore.get("userId")?.value;
    let userDocumentId: string | null = null;

    // If no token in cookies, try to get it from the form data
    if (!token) {
      token = formData.get("jwt") as string;
      console.log(
        "[v0] Server Action: Using token from form data:",
        token ? "Token found" : "No token"
      );
    }

    if (!token) {
      console.error(
        "[v0] Server Action: No authentication token found in cookies or form data"
      );
      return {
        success: false,
        error: "Authentication required. Please log in to create posts.",
      };
    }

    console.log("[v0] Server Action: Token found, length:", token.length);
    console.log(
      "[v0] Server Action: Token starts with:",
      token.substring(0, 20) + "..."
    );

    // Store the token in cookies for future requests
    if (token) {
      const cookieStoreInstance = await cookies();
      cookieStoreInstance.set("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
      cookieStoreInstance.set("authToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    // Try to get the user documentId from form data (preferred)
    userDocumentId = formData.get("userDocumentId") as string;
    if (!userDocumentId) {
      // If no documentId, try to get the regular userId
      if (!userId) {
        userId = formData.get("userId") as string;
      }
    }

    // Try to extract documentId from the full user object if available
    const userObjectJson = formData.get("userObject") as string;
    if (userObjectJson) {
      try {
        const userObject = JSON.parse(userObjectJson);

        if (userObject && userObject.documentId && !userDocumentId) {
          userDocumentId = userObject.documentId;
          console.log(
            "[v0] Server Action: Extracted user document ID from user object:",
            userDocumentId
          );
        } else if (userObject && userObject.id && !userId) {
          userId = userObject.id.toString();
          console.log(
            "[v0] Server Action: Extracted user ID from user object:",
            userId
          );
        }
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
    const apiUrl =
      process.env.API_URL ||
      "https://nailfeed-backend-production.up.railway.app";
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    // STEP 1: Upload media files first if they exist
    let uploadedMediaItems: any[] = [];
    const mediaFilesEntries = formData.getAll("mediaFiles");
    const hasMediaFiles = mediaFilesEntries.length > 0;

    if (hasMediaFiles) {
      console.log("[v0] Server Action: Uploading media files first...");

      try {
        // Upload files to Strapi upload endpoint
        const uploadFormData = new FormData();

        for (let i = 0; i < mediaFilesEntries.length; i++) {
          const file = mediaFilesEntries[i] as File;
          if (file instanceof File) {
            uploadFormData.append("files", file, `${i}-${file.name}`);
          }
        }

        const uploadUrl = `${apiUrl}/api/upload`;

        console.log("[v0] Server Action: Upload URL:", uploadUrl);
        console.log(
          "[v0] Server Action: Upload headers - Authorization:",
          `Bearer ${token.substring(0, 20)}...`
        );

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadFormData,
        });

        console.log(
          "[v0] Server Action: Upload response status:",
          uploadResponse.status
        );
        console.log(
          "[v0] Server Action: Upload response headers:",
          Object.fromEntries(uploadResponse.headers.entries())
        );

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error(
            "[v0] Server Action: Upload failed with status:",
            uploadResponse.status
          );
          console.error(
            "[v0] Server Action: Upload error response:",
            errorText
          );
          throw new Error(
            `File upload failed with status ${uploadResponse.status}: ${errorText}`
          );
        }

        const uploadedFiles = await uploadResponse.json();
        console.log(
          "[v0] Server Action: Files uploaded successfully:",
          uploadedFiles
        );

        // Create mediaItems array with uploaded file IDs
        uploadedMediaItems = uploadedFiles.map((file: any, index: number) => ({
          file: file.id, // Use the uploaded file ID
          type: file.mime.startsWith("image/") ? "image" : "video",
          order: index + 1,
        }));

        console.log(
          "[v0] Server Action: Prepared media items:",
          uploadedMediaItems
        );
      } catch (error) {
        console.error("[v0] Server Action: File upload failed:", error);
        return {
          success: false,
          error: `File upload failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
      }
    }

    // STEP 2: Create the post with uploaded media items
    const postData: any = {
      data: {
        title: title || "",
        description,
        contentType,
        background,
        galleryLayout,
        user: {
          connect: userDocumentId
            ? [userDocumentId]
            : userId
            ? [userId.toString()]
            : [],
        },
        tags: tags,
        mediaItems: uploadedMediaItems, // Include uploaded media items directly
      },
    };

    console.log(
      "[v0] Server Action: Creating post with data:",
      JSON.stringify(postData, null, 2)
    );

    const postEndpoint = "/api/posts";
    const postUrl = `${apiUrl}${apiUrl.endsWith("/") ? "" : "/"}${
      postEndpoint.startsWith("/") ? postEndpoint.substring(1) : postEndpoint
    }`;

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

    revalidatePath("/", "layout");
    revalidatePath("/profile", "layout");
    revalidatePath("/explore", "layout");
    revalidatePath(`/post/${postId}`, "layout");

    // Trigger immediate cache invalidation via revalidation API
    try {
      const revalidateUrl = `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/revalidate/post`;
      await fetch(revalidateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            process.env.REVALIDATE_SECRET || "fallback-secret"
          }`,
        },
        body: JSON.stringify({
          paths: ["/"],
          tags: ["posts", "feed"],
          postId: postId,
        }),
      }).catch((error) => {
        console.log("[v0] Server Action: Revalidation API call failed:", error);
      });

      // Send message to service worker to invalidate cache
      if (typeof window !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.active?.postMessage({
              type: "INVALIDATE_CACHE",
            });
          })
          .catch((error) => {
            console.log(
              "[v0] Server Action: Service worker message failed:",
              error
            );
          });
      }
    } catch (error) {
      console.log("[v0] Server Action: Cache invalidation failed:", error);
    }

    console.log(
      "[v0] Server Action: Post creation process completed successfully"
    );
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
        mediaItems: uploadedMediaItems,
        tags,
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
