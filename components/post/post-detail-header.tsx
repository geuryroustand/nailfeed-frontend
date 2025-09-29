"use client";

import Link from "next/link";
import {
  ArrowLeft,
  MoreHorizontal,
  Download,
  Trash2,
  Edit,
  Flag,
  AlertCircle,
  BookmarkPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { usePostDeletion } from "@/hooks/use-post-deletion";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { formatDate, formatBackendDate } from "@/lib/date-utils";
import type { Post } from "@/lib/post-data";
import EditPostModal from "@/components/edit-post-modal";
import AddToCollectionDialog from "@/components/collections/add-to-collection-dialog";
import { useCollections } from "@/context/collections-context";
import { useToast } from "@/hooks/use-toast";

interface PostDetailHeaderProps {
  post: Post;
  onEdit?: () => void;
  onReport?: () => void;
}

export default function PostDetailHeader({
  post,
  onEdit,
  onReport,
}: PostDetailHeaderProps) {
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Internal handlers for Edit and Report when not provided
  const handleEdit =
    onEdit ||
    (() => {
      setEditModalOpen(true);
    });

  const handleReport =
    onReport ||
    (() => {
      // TODO: Implement report functionality
      console.log("Report functionality not implemented yet");
    });
  const { user, isAuthenticated } = useAuth() || {
    user: null,
    isAuthenticated: false,
  };
  const router = useRouter();
  const { isSaved } = useCollections();
  const { toast } = useToast();
  const normalizedPostId = useMemo(() => {
    if (typeof post?.documentId === "string" && post.documentId.length > 0) {
      return post.documentId;
    }

    if (typeof post?.id === "string" && post.id.length > 0) {
      return post.id;
    }

    if (typeof post?.id === "number" && Number.isFinite(post.id)) {
      return post.id.toString();
    }

    return null;
  }, [post?.documentId, post?.id]);
  const isPostSaved =
    normalizedPostId !== null ? isSaved(normalizedPostId) : false;
  const postTitle = post.title || post.description;
  const handleCollectionAdded = useCallback(
    (collectionName: string) => {
      toast({
        title: "Saved to collection",
        description: `Added to ${collectionName}`,
      });
    },
    [toast]
  );

  // Post deletion hook
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    deleteError,
    handleDeletePost: deletePostHandler,
  } = usePostDeletion({
    onPostDeleted: (postId: number) => {
      // Redirect to home after deletion
      router.push("/");
    },
  });

  // Check if the current user is the post owner
  const isPostOwner = () => {
    if (!isAuthenticated || !user) return false;

    return (
      (post?.userId &&
        user.id &&
        post.userId.toString() === user.id.toString()) ||
      (post?.user?.id &&
        user.id &&
        post.user.id.toString() === user.id.toString()) ||
      (post?.user?.documentId &&
        user.documentId &&
        post.user.documentId === user.documentId) ||
      (post?.username && user.username && post.username === user.username) ||
      (post?.user?.username &&
        user.username &&
        post.user.username === user.username)
    );
  };

  // Handle post deletion
  const handleDeletePost = () => {
    if (post) {
      deletePostHandler(post);
    }
  };

  // Handle download
  const handleDownload = () => {
    const imageUrl = post?.image || post?.media?.[0]?.url;
    if (imageUrl && !imageUrl.includes("placeholder.svg")) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `nail-design-${post.documentId || post.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Format the timestamp - check for both createdAt (backend format) and timestamp
  const formattedDate = post.createdAt
    ? formatBackendDate(post.createdAt)
    : formatDate(post.timestamp);

  return (
    <>
      {/* Back button */}
      <div className="mb-4">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back to feed</span>
        </Link>
      </div>

      {/* Post header */}
      <div className="p-4 sm:p-6 border-b bg-white rounded-t-xl shadow-sm mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href={`/profile/${post.user?.documentId || post.username}`}
              aria-label={`View ${post.username}'s profile`}
            >
              <Avatar className="h-12 w-12 sm:h-14 sm:w-14 transition-transform hover:scale-105">
                <AvatarImage
                  src={post.userImage || "/abstract-user-icon.png"}
                  alt={post.username || "User"}
                  width={56}
                  height={56}
                  loading="eager"
                />
                <AvatarFallback>
                  {post.username?.substring(0, 2).toUpperCase() || "UN"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="ml-3">
              <Link
                href={`/profile/${post.user?.documentId || post.username}`}
                className="text-base sm:text-lg font-medium hover:text-pink-600 transition-colors"
              >
                {post.username || "Unknown User"}
              </Link>
              <p className="text-sm text-gray-500">{formattedDate}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" aria-label="More options">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAuthenticated && normalizedPostId !== null && (
                <>
                  <AddToCollectionDialog
                    postId={normalizedPostId}
                    postTitle={postTitle}
                    onCollectionAdded={handleCollectionAdded}
                    trigger={
                      <DropdownMenuItem
                        className="flex items-center"
                        onSelect={(event) => event.preventDefault()}
                      >
                        <BookmarkPlus className="h-4 w-4 mr-2" />
                        {isPostSaved
                          ? "Manage collections"
                          : "Add to collection"}
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuSeparator />
                </>
              )}
              {/* Download button - always visible if image exists */}
              {(post?.image || post?.media?.[0]?.url) &&
                !post?.image?.includes("placeholder.svg") && (
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                )}

              {/* Owner-only actions */}
              {isPostOwner() && (
                <>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-red-500 focus:text-red-500 focus:bg-red-50 flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete post
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                </>
              )}

              {/* Non-owner actions */}
              {!isPostOwner() && (
                <DropdownMenuItem onClick={handleReport}>
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          // Only allow closing if not currently deleting
          if (!isDeleting) {
            setIsDeleteDialogOpen(open);
          }
        }}
        title="Delete Post"
        description={
          <div className="space-y-2">
            <div>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </div>
            {deleteError && (
              <div className="text-red-500 text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {deleteError}
              </div>
            )}
          </div>
        }
        onConfirm={handleDeletePost}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
        disabled={isDeleting}
      />

      {/* Edit Post Modal */}
      {editModalOpen && (
        <EditPostModal
          post={post}
          onClose={() => setEditModalOpen(false)}
          onPostUpdated={(updatedPost) => {
            // The post will be revalidated by the updatePost server action
            setEditModalOpen(false);
          }}
        />
      )}
    </>
  );
}
