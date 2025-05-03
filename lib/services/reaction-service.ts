"use client";

import { apiClient } from "@/lib/api-client";

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

export class ReactionService {
  // Get user's reaction to a post
  static async getUserReaction(
    postId: string | number,
    userId: string | number
  ) {
    try {
      console.log(
        `ReactionService: Fetching reaction for post ${postId} by user ${userId}`
      );

      const endpoint = `/likes?filters[post][id][$eq]=${postId}&filters[user][id][$eq]=${userId}&populate[post][fields][0]=id&populate[user][fields][0]=id`;
      const response = await apiClient.get(endpoint);

      if (response && response.data && response.data.length > 0) {
        return {
          id: response.data[0].id,
          documentId: response.data[0].documentId,
          type: response.data[0].type,
        };
      }

      return null;
    } catch (error) {
      console.error(
        `ReactionService: Error fetching reaction for post ${postId}:`,
        error
      );
      throw error;
    }
  }

  // Add a reaction to a post
  static async addReaction(
    postId: string | number,
    userId: string | number,
    type: ReactionType
  ) {
    /* Commented out reaction functionality
    try {
      console.log(
        `ReactionService: Adding ${type} reaction to post ${postId} by user ${userId}`
      );

      // First check if the user already has a reaction
      const existingReaction = await this.getUserReaction(postId, userId);

      if (existingReaction) {
        // If the reaction type is the same, remove it (toggle off)
        if (existingReaction.type === type) {
          return await this.removeReaction(
            existingReaction.documentId || existingReaction.id
          );
        }
        // Otherwise, update the existing reaction
        else {
          return await this.updateReaction(
            existingReaction.documentId || existingReaction.id,
            type
          );
        }
      }

      // Create a new reaction
      const data = {
        data: {
          type,
          post: {
            connect: [postId.toString()],
          },
          user: {
            connect: [userId.toString()],
          },
          publishedAt: new Date().toISOString(),
        },
      };

      const response = await apiClient.post("/likes", data);
      console.log(`ReactionService: Reaction added successfully:`, response);

      // Update the post's likesCount
      await this.updatePostLikesCount(postId);

      return response;
    } catch (error) {
      console.error(
        `ReactionService: Error adding reaction to post ${postId}:`,
        error
      );
      throw error;
    }
    */
    return null;
  }

  // Update an existing reaction
  static async updateReaction(reactionId: string | number, type: ReactionType) {
    /* Commented out reaction functionality
    try {
      console.log(
        `ReactionService: Updating reaction ${reactionId} to ${type}`
      );

      const data = {
        data: {
          type,
        },
      };

      const response = await apiClient.put(`/likes/${reactionId}`, data);
      console.log(`ReactionService: Reaction updated successfully:`, response);
      return response;
    } catch (error) {
      console.error(
        `ReactionService: Error updating reaction ${reactionId}:`,
        error
      );
      throw error;
    }
    */
    return null;
  }

  // Remove a reaction
  static async removeReaction(reactionId: string | number) {
    /* Commented out reaction functionality
    try {
      console.log(`ReactionService: Removing reaction ${reactionId}`);

      const response = await apiClient.delete(`/likes/${reactionId}`);
      console.log(`ReactionService: Reaction removed successfully:`, response);
      return response;
    } catch (error) {
      console.error(
        `ReactionService: Error removing reaction ${reactionId}:`,
        error
      );
      throw error;
    }
    */
    return null;
  }

  // Get all reactions for a post
  static async getPostReactions(postId: string | number) {
    /* Commented out reaction functionality
    try {
      console.log(`ReactionService: Fetching all reactions for post ${postId}`);

      const endpoint = `/likes?filters[post][id][$eq]=${postId}&populate[post][fields][0]=id&populate[user][fields][0]=id`;
      const response = await apiClient.get(endpoint);

      return response;
    } catch (error) {
      console.error(
        `ReactionService: Error fetching reactions for post ${postId}:`,
        error
      );
      throw error;
    }
    */
    return { data: [] };
  }

  // Get reaction counts by type for a post
  static async getReactionCounts(postId: string | number) {
    /* Commented out reaction functionality
    try {
      console.log(
        `ReactionService: Fetching reaction counts for post ${postId}`
      );

      const reactions = await this.getPostReactions(postId);

      if (!reactions || !reactions.data) {
        return {};
      }

      // Count reactions by type
      const counts: Record<ReactionType, number> = {
        like: 0,
        love: 0,
        haha: 0,
        wow: 0,
        sad: 0,
        angry: 0,
      };

      reactions.data.forEach((reaction: any) => {
        if (
          reaction.type &&
          counts[reaction.type as ReactionType] !== undefined
        ) {
          counts[reaction.type as ReactionType]++;
        }
      });

      return counts;
    } catch (error) {
      console.error(
        `ReactionService: Error fetching reaction counts for post ${postId}:`,
        error
      );
      throw error;
    }
    */
    return {
      like: 0,
      love: 0,
      haha: 0,
      wow: 0,
      sad: 0,
      angry: 0,
    };
  }

  // Update the post's likesCount field
  static async updatePostLikesCount(postId: string | number) {
    /* Commented out reaction functionality
    try {
      console.log(`ReactionService: Updating likesCount for post ${postId}`);

      // Get the total number of reactions
      const reactions = await this.getPostReactions(postId);
      const likesCount =
        reactions && reactions.data ? reactions.data.length : 0;

      // Update the post
      const data = {
        data: {
          likesCount,
        },
      };

      await apiClient.put(`/posts/${postId}`, data);
      console.log(
        `ReactionService: Updated likesCount to ${likesCount} for post ${postId}`
      );

      return likesCount;
    } catch (error) {
      console.error(
        `ReactionService: Error updating likesCount for post ${postId}:`,
        error
      );
      throw error;
    }
    */
    return 0;
  }
}
