"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { deletePost } from "@/lib/post-management-actions";

interface UsePostDeletionProps {
  onPostDeleted?: (postId: number) => void;
}

export function usePostDeletion({ onPostDeleted }: UsePostDeletionProps = {}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDeletePost = async (post: {
    id: number;
    documentId?: string;
  }) => {
    // Use documentId if available, otherwise fall back to numeric id
    const postIdentifier = post.documentId;
    if (!postIdentifier) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      // Call the server action to delete the post
      const result = await deletePost(postIdentifier as string);

      if (result.success) {
        toast({
          title: "Post deleted",
          description: "Your post has been successfully deleted.",
        });

        // Call the callback to update the UI
        if (onPostDeleted) {
          onPostDeleted(post.id);
        }

        // Close the dialog
        setIsDeleteDialogOpen(false);
      } else {
        setDeleteError(result.message || "Failed to delete post");
        toast({
          title: "Error",
          description: result.message || "Failed to delete post",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete post";
      setDeleteError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    deleteError,
    handleDeletePost,
  };
}
