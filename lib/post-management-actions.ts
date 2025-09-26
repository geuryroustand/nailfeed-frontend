"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import config from "@/lib/config";
import { verifySession } from "@/lib/auth/session";

interface DeletePostResult {
  success: boolean;
  message?: string;
}

const STRAPI_DELETE_SUCCESS_STATUS = 204;

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    config.api.API_URL ||
    "https://nailfeed-backend-production.up.railway.app"
  );
}

async function getUserAuthToken(): Promise<string | null> {
  const session = await verifySession();
  if (session?.strapiJWT && typeof session.strapiJWT === "string") {
    return session.strapiJWT;
  }

  const cookieJar = await cookies();
  return (
    cookieJar.get("jwt")?.value ?? cookieJar.get("authToken")?.value ?? null
  );
}

function revalidatePostDependencies() {
  revalidatePath("/me");
  revalidatePath("/me/[username]");
  revalidatePath("/");
  revalidatePath("/post/[id]");
}

async function readStrapiError(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    return (
      payload?.error?.message ||
      payload?.message ||
      (typeof payload === "string" ? payload : "") ||
      "Unexpected Strapi error"
    );
  } catch {
    return "Unexpected Strapi error";
  }
}

/**
 * Server action to delete a post and its associated media files
 */
export async function deletePost(
  documentId: string
): Promise<DeletePostResult> {
  try {
    console.log(`Attempting to delete post with documentId: ${documentId}`);

    const token = await getUserAuthToken();
    if (!token) {
      console.error("No authenticated user token available for post deletion");
      return {
        success: false,
        message: "Authentication required. Please log in and try again.",
      };
    }

    const baseUrl = getApiBaseUrl();

    // First, fetch the post to get associated media files
    const fetchEndpoint = `${baseUrl}/api/posts/${documentId}?populate=media`;
    console.log(`Fetching post data from: ${fetchEndpoint}`);

    const fetchResponse = await fetch(fetchEndpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    let mediaFileIds: number[] = [];

    if (fetchResponse.ok) {
      try {
        const postData = await fetchResponse.json();
        const mediaFiles = postData.data?.media || [];

        // Extract file IDs from media files
        mediaFileIds = mediaFiles
          .map((file: any) => file.id)
          .filter((id: any) => id !== undefined && id !== null);

        console.log(
          `Found ${mediaFileIds.length} media files to delete:`,
          mediaFileIds
        );
      } catch (error) {
        console.error("Error parsing post data for media cleanup:", error);
        // Continue with post deletion even if we can't get media files
      }
    } else {
      console.warn(
        `Could not fetch post data for media cleanup (status: ${fetchResponse.status}), proceeding with post deletion`
      );
    }

    // Delete associated media files first
    if (mediaFileIds.length > 0) {
      console.log("Deleting associated media files...");

      for (const fileId of mediaFileIds) {
        try {
          const deleteMediaEndpoint = `${baseUrl}/api/upload/files/${fileId}`;
          console.log(`Deleting media file with ID: ${fileId}`);

          const mediaDeleteResponse = await fetch(deleteMediaEndpoint, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          });

          if (
            mediaDeleteResponse.status === 200 ||
            mediaDeleteResponse.status === 204
          ) {
            console.log(`Successfully deleted media file with ID: ${fileId}`);
          } else {
            console.warn(
              `Failed to delete media file with ID: ${fileId}, status: ${mediaDeleteResponse.status}`
            );
            // Continue with other files and post deletion
          }
        } catch (error) {
          console.error(`Error deleting media file with ID: ${fileId}:`, error);
          // Continue with other files and post deletion
        }
      }
    }

    // Now delete the post itself
    const endpoint = `${baseUrl}/api/posts/${documentId}`;
    console.log(`Sending DELETE request to: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.status === STRAPI_DELETE_SUCCESS_STATUS) {
      console.log(`Successfully deleted post with documentId: ${documentId}`);
      revalidatePostDependencies();
      return { success: true };
    }

    if (response.status === 403) {
      console.error("Permission denied when attempting to delete post");
      return {
        success: false,
        message: "You don't have permission to delete this post.",
      };
    }

    if (response.status === 404) {
      console.error("Post not found when attempting to delete");
      return {
        success: false,
        message: "Post not found. It may have already been deleted.",
      };
    }

    const errorMessage = await readStrapiError(response);
    console.error(`Error deleting post: ${response.status} - ${errorMessage}`);
    return {
      success: false,
      message: errorMessage,
    };
  } catch (error) {
    console.error("Exception when deleting post:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Server action to update a post
 */
export async function updatePost(
  documentId: string,
  updateData: unknown
): Promise<DeletePostResult> {
  try {
    console.log(`Attempting to update post with documentId: ${documentId}`);

    const token = await getUserAuthToken();
    if (!token) {
      console.error("No authenticated user token available for post update");
      return {
        success: false,
        message: "Authentication required. Please log in and try again.",
      };
    }

    const endpoint = `${getApiBaseUrl()}/api/posts/${documentId}`;
    console.log(`Sending PUT request to: ${endpoint}`);

    const response = await fetch(endpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: updateData }),
      cache: "no-store",
    });

    if (response.ok) {
      console.log(`Successfully updated post with documentId: ${documentId}`);
      revalidatePostDependencies();
      return { success: true };
    }

    if (response.status === 403) {
      console.error("Permission denied when attempting to update post");
      return {
        success: false,
        message: "You don't have permission to update this post.",
      };
    }

    if (response.status === 404) {
      console.error("Post not found when attempting to update");
      return {
        success: false,
        message: "Post not found.",
      };
    }

    const errorMessage = await readStrapiError(response);
    console.error(`Error updating post: ${response.status} - ${errorMessage}`);
    return {
      success: false,
      message: errorMessage,
    };
  } catch (error) {
    console.error("Exception when updating post:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
