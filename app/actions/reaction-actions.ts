"use server";

import { getCurrentUser } from "./auth-actions";
import { revalidatePath } from "next/cache";

// Base URL for your Strapi API (falls back to Railway URL if envs are missing)
const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://nailfeed-backend-production.up.railway.app";

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

/**
 * Returns the current user's reaction to a post (if any).
 * IMPORTANT (Strapi v5):
 * - Filter post by its documentId using the shorthand: filters[post][$eq]
 * - Filter user (users-permissions) by numeric id: filters[user][id][$eq]
 * - Use the user's JWT (NOT a server API token), so ctx.state.user exists in Strapi.
 */
export async function getUserReaction(
  postDocumentId: string
): Promise<{ id: string; type: ReactionType } | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    // ⬇️ Make sure you expose the user JWT from getCurrentUser()
    const jwt = user.jwt; // <-- adjust if your user object stores the JWT differently

    const url =
      `${API_URL}/api/likes?` +
      `filters[post][$eq]=${encodeURIComponent(postDocumentId)}&` + // post by documentId (shorthand)
      `filters[user][id][$eq]=${encodeURIComponent(String(user.id))}`; // user by numeric id

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`, // must be the user's JWT
      },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = await response.json();

    if (Array.isArray(data.data) && data.data.length > 0) {
      const reaction = data.data[0];
      return {
        id: String(reaction.id ?? reaction.documentId),
        type: (reaction.attributes?.type || reaction.type) as ReactionType,
      };
    }

    return null;
  } catch (error) {
    console.error("Error getting user reaction:", error);
    return null;
  }
}

/**
 * Adds or toggles a reaction for the current user.
 * Behavior:
 * - If the same reaction exists, remove it (toggle off).
 * - If a different reaction exists, remove it first and then create the new one.
 * Notes:
 * - Do NOT send `user` in the payload; your Strapi v5 middleware forces user from JWT.
 * - Connect the post by its documentId.
 */
export async function addReaction(
  postDocumentId: string,
  type: ReactionType
): Promise<{
  success: boolean;
  reaction?: { id: string; type: ReactionType };
  error?: string;
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "User not authenticated" };

    const jwt = user.jwt; // <-- user's JWT

    // Check if the user already reacted to this post
    const existingReaction = await getUserReaction(postDocumentId);

    // If same reaction → toggle off
    if (existingReaction && existingReaction.type === type) {
      const removed = await removeReaction(existingReaction.id);
      if (removed.success) {
        revalidatePath("/");
        return { success: true };
      }
      return { success: false, error: "Failed to remove reaction" };
    }

    // If different reaction exists → remove it first
    if (existingReaction) {
      await removeReaction(existingReaction.id);
    }

    // Create new reaction (user is injected by Strapi middleware from JWT)
    const payload = {
      data: {
        type,
        post: { connect: [postDocumentId] }, // connect by documentId
      },
    };

    const response = await fetch(`${API_URL}/api/likes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`, // user's JWT
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to create reaction: ${response.status}`, errorText);
      return {
        success: false,
        error: `Failed to create reaction: ${response.status}`,
      };
    }

    const data = await response.json();

    if (data.data) {
      revalidatePath("/");
      return {
        success: true,
        reaction: {
          id: String(data.data.id ?? data.data.documentId),
          type: (data.data.attributes?.type || type) as ReactionType,
        },
      };
    }

    return { success: false, error: "Invalid response from API" };
  } catch (error) {
    console.error("Error adding reaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Removes a reaction by id for the current user.
 * - Requires the user's JWT (not a server API token), so Strapi knows who is calling.
 */
export async function removeReaction(
  reactionId: string | number
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "User not authenticated" };

    const jwt = user.jwt; // <-- user's JWT

    const response = await fetch(`${API_URL}/api/likes/${reactionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`, // user's JWT
      },
    });

    if (!response.ok) {
      console.error(`Failed to delete reaction: ${response.status}`);
      return {
        success: false,
        error: `Failed to delete reaction: ${response.status}`,
      };
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error removing reaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Returns reaction counts grouped by type and a sample of users.
 * - Filter post by documentId using shorthand.
 * - If your likes collection is private, provide a read token or call this from
 *   authenticated context with a JWT depending on your permissions model.
 */
export async function getReactionCounts(
  postDocumentId: string
): Promise<Record<ReactionType, { count: number; users: any[] }>> {
  try {
    const url =
      `${API_URL}/api/likes?` +
      `filters[post][$eq]=${encodeURIComponent(postDocumentId)}&` + // post by documentId (shorthand)
      `populate[user]=true&pagination[pageSize]=200`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // If your endpoint requires auth, pass either user's JWT or a read-only token
        Authorization: process.env.PUBLIC_READ_TOKEN
          ? `Bearer ${process.env.PUBLIC_READ_TOKEN}`
          : "",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`Failed to get reaction counts: ${response.status}`);
      return baseCounts();
    }

    const data = await response.json();

    // Initialize accumulator
    const acc = baseCounts();

    // Aggregate counts and basic user info
    if (Array.isArray(data.data)) {
      for (const reaction of data.data) {
        const type = (reaction.attributes?.type ||
          reaction.type) as ReactionType;
        if (!acc[type]) continue;

        acc[type].count++;

        const userData =
          reaction.attributes?.user?.data?.attributes || reaction.user;
        if (userData) {
          acc[type].users.push({
            id: reaction.attributes?.user?.data?.id || reaction.user?.id,
            username: userData.username || "user",
            displayName: userData.displayName || userData.username,
            avatar:
              userData.avatar?.data?.attributes?.url ||
              userData.profileImage?.url ||
              null,
          });
        }
      }
    }

    return acc;
  } catch (error) {
    console.error("Error getting reaction counts:", error);
    return baseCounts();
  }
}

/** Helper: baseline structure for counts by reaction type */
function baseCounts(): Record<ReactionType, { count: number; users: any[] }> {
  return {
    like: { count: 0, users: [] },
    love: { count: 0, users: [] },
    haha: { count: 0, users: [] },
    wow: { count: 0, users: [] },
    sad: { count: 0, users: [] },
    angry: { count: 0, users: [] },
  };
}
