"use server";

import { revalidatePath } from "next/cache";
import type {
  LikeActionResult,
  CommentActionResult,
  CollectionActionResult,
} from "./profile-data";

export async function likePost(postId: number): Promise<LikeActionResult> {
  try {
    // In a real app, this would update a database
    console.log(`Liking post ${postId}`);

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Calculate new like count (in a real app, this would come from the database)
    const newLikeCount = Math.floor(Math.random() * 100) + 150;

    // Revalidate paths that might display this post
    revalidatePath("/me");
    revalidatePath("/post/[id]", "page");
    revalidatePath("/");

    return {
      success: true,
      postId,
      newLikeCount,
    };
  } catch (error) {
    console.error(`Error liking post ${postId}:`, error);
    return {
      success: false,
      postId,
      newLikeCount: 0,
      message: "Failed to like post",
    };
  }
}

export async function addComment(
  postId: number,
  commentText: string
): Promise<CommentActionResult> {
  try {
    // Validate comment
    if (!commentText.trim()) {
      return {
        success: false,
        postId,
        newCommentCount: 0,
        message: "Comment cannot be empty",
      };
    }

    // In a real app, this would add the comment to a database
    console.log(`Adding comment to post ${postId}: ${commentText}`);

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Calculate new comment count (in a real app, this would come from the database)
    const newCommentCount = Math.floor(Math.random() * 50) + 10;

    // Revalidate paths that might display this post
    revalidatePath("/me");
    revalidatePath("/post/[id]", "page");

    return {
      success: true,
      postId,
      newCommentCount,
    };
  } catch (error) {
    console.error(`Error adding comment to post ${postId}:`, error);
    return {
      success: false,
      postId,
      newCommentCount: 0,
      message: "Failed to add comment",
    };
  }
}

export async function addToCollection(
  postId: number,
  collectionId: number
): Promise<CollectionActionResult> {
  try {
    // In a real app, this would update a database
    console.log(`Adding post ${postId} to collection ${collectionId}`);

    // Simulate a database update
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Revalidate paths that might display this collection
    revalidatePath("/me");
    revalidatePath("/collections");
    revalidatePath("/collections/[id]", "page");

    return {
      success: true,
      collectionId,
      message: "Post added to collection successfully",
    };
  } catch (error) {
    console.error(
      `Error adding post ${postId} to collection ${collectionId}:`,
      error
    );
    return {
      success: false,
      message: "Failed to add post to collection",
    };
  }
}
