"use server";

import { revalidatePath } from "next/cache";
import { getPosts, type Post } from "@/lib/post-data";
import { PAGINATION } from "@/lib/config";

export async function fetchPostsAction(
  limit = PAGINATION.LOAD_MORE_POST_LIMIT,
  offset = 0
): Promise<{
  posts: Post[];
  hasMore: boolean;
  nextPage?: number;
  error?: {
    code: number | string;
    message: string;
  };
}> {
  try {
    const response = await getPosts(limit, offset);
    return response;
  } catch (error) {
    console.error("Error in fetchPostsAction:", error);
    return {
      posts: [],
      hasMore: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to fetch posts. Please try again later.",
      },
    };
  }
}

export async function refreshPostsAction(): Promise<{
  posts: Post[];
  hasMore: boolean;
  nextPage?: number;
  error?: {
    code: number | string;
    message: string;
  };
}> {
  try {
    // Force revalidation of all post-related pages
    revalidatePath("/");
    revalidatePath("/me");
    revalidatePath("/explore");

    const response = await getPosts(PAGINATION.INITIAL_POST_LIMIT, 0);
    return response;
  } catch (error) {
    console.error("Error in refreshPostsAction:", error);
    return {
      posts: [],
      hasMore: false,
      error: {
        code: "SERVER_ERROR",
        message: "Failed to refresh posts. Please try again later.",
      },
    };
  }
}
