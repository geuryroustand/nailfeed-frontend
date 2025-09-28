"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  MoreHorizontal,
  Trash2,
  AlertCircle,
  Heart,
  Edit,
  Flag,
  BookmarkPlus,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { BackgroundType } from "./post-background-selector";
import type { MediaItem, MediaGalleryLayout } from "@/types/media";
import { getPostMedia, toMediaItems, hasMedia, getMediaCount, getPrimaryMedia, type PostWithMedia } from "@/lib/media-utils";
import { ShareMenu } from "./share-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useCollections } from "@/context/collections-context";
import { EnhancedAvatar } from "@/components/ui/enhanced-avatar";
import { SafePostImage } from "./safe-post-image";
import MediaGallery from "./media-gallery";
import AddToCollectionDialog from "@/components/collections/add-to-collection-dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import FeedCommentSection from "@/components/comments/feed-comment-section";
import EditPostModal from "@/components/edit-post-modal";
import { ReportContentModal } from "@/components/report-content-modal";

// Import the hook
import { usePostDeletion } from "@/hooks/use-post-deletion";

// Import CommentsService
import { CommentsService } from "@/lib/services/comments-service";

// Import the date utility function
import { formatDate, formatBackendDate } from "@/lib/date-utils";

import {
  ReactionService,
  type ReactionType,
  REACTION_TYPES as REACTION_TYPE_ORDER,
} from "@/lib/services/reaction-service";


// Add the import for TryOnButton and TryOnModal at the top of the file
import { TryOnButton } from "@/components/try-on/try-on-button";
import { TryOnModal } from "@/components/try-on/try-on-modal";

import { ReactionModal } from "./reaction-modal";

// Hardcoded API base URL for testing
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:1337";

interface PostProps {
  post: PostWithMedia & {
    username: string;
    userImage: string;
    description: string;
    title?: string;
    likesCount?: number;
    commentsCount?: number;
    likes: number; // For backward compatibility
    comments: any[]; // For backward compatibility
    timestamp: string;
    createdAt?: string;
    background?: BackgroundType;
    reactions?: {
      emoji: string;
      label: string;
      count: number;
      users?: {
        id: string | number;
        username: string;
        displayName?: string;
        avatar?: string;
      }[];
    }[];
    userId?: string;
    user?: {
      id: string;
      documentId?: string;
      username?: string;
    };
    userReaction?: Reaction;
    likesList?: Array<{
      type: string;
      createdAt: string;
      user: {
        username: string;
        email: string;
      };
    }>;
    isOptimistic?: boolean; // Flag for optimistic posts
    tempId?: string; // Temporary ID for optimistic posts
  };
  viewMode?: "cards" | "compact";
  onPostDeleted?: (postId: number) => void;
  onPostUpdated?: (updatedPost: any) => void;
  onLike?: (postId: number, reactionType: string) => void;
  onComment?: (postId: number) => void;
  onSave?: (postId: string | number) => void;
  onShare?: (postId: number) => void;
  className?: string;
  compact?: boolean;
}

type Reaction = "like" | "love" | "haha" | "wow" | "sad" | "angry" | null;

// Define reaction data for reuse
const reactionData = [
  { type: "like", emoji: "👍", label: "Like", color: "text-blue-500" },
  { type: "love", emoji: "❤️", label: "Love", color: "text-red-500" },
  { type: "haha", emoji: "😂", label: "Haha", color: "text-yellow-500" },
  { type: "wow", emoji: "😮", label: "Wow", color: "text-yellow-500" },
  { type: "sad", emoji: "😢", label: "Sad", color: "text-blue-400" },
  { type: "angry", emoji: "😡", label: "Angry", color: "text-orange-500" },
];

export default function Post({
  post,
  viewMode = "cards",
  onPostDeleted,
  onPostUpdated,
  onLike,
  onComment,
  onSave,
  onShare,
  className = "",
  compact = false,
}: PostProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [reaction, setReaction] = useState<Reaction>(
    (post.userReaction as Reaction) || null
  );
  const [showReactions, setShowReactions] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(post.likesCount || post.likes || 0);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(() => {
    // Use backend's commentsCount first, then fallback to legacy fields
    return post.commentsCount || post.comments_count || (Array.isArray(post.comments) ? post.comments.length : 0) || 0;
  });
  const reactionsRef = useRef<HTMLDivElement>(null);
  const likeButtonRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  const [showDebug, setShowDebug] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { user, isAuthenticated } = useAuth() || {
    user: null,
    isAuthenticated: false,
  };
  const { isSaved } = useCollections();
  const normalizedPostId = useMemo(() => {
    if (typeof post.documentId === "string" && post.documentId.length > 0) {
      return post.documentId;
    }

    if (typeof post.id === "string" && post.id.length > 0) {
      return post.id;
    }

    if (typeof post.id === "number" && Number.isFinite(post.id)) {
      return post.id.toString();
    }

    return null;
  }, [post.documentId, post.id]);
  const isPostSaved = normalizedPostId !== null ? isSaved(normalizedPostId) : false;
  const [lastSavedCollection, setLastSavedCollection] = useState<string | null>(null);
  const saveFeedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [isReactionLoading, setIsReactionLoading] = useState(false); // Declare isReactionLoading
  const [totalReactionCount, setTotalReactionCount] = useState<number>(
    post.likesCount || post.likes || 0
  );

  const handleCollectionAdded = useCallback(
    (collectionName: string) => {
      setLastSavedCollection(collectionName);
      if (saveFeedbackTimeoutRef.current) {
        window.clearTimeout(saveFeedbackTimeoutRef.current);
      }
      saveFeedbackTimeoutRef.current = window.setTimeout(() => {
        setLastSavedCollection(null);
      }, 4000);

      if (normalizedPostId !== null) {
        onSave?.(normalizedPostId);
      }
    },
    [normalizedPostId, onSave]
  );
  useEffect(() => {
    return () => {
      if (saveFeedbackTimeoutRef.current) {
        window.clearTimeout(saveFeedbackTimeoutRef.current);
      }
    };
  }, []);

  // Inside the Post component, add a new state for the try-on modal
  const [tryOnModalOpen, setTryOnModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Post deletion hook
  const {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isDeleting,
    deleteError,
    handleDeletePost: deletePostHandler,
  } = usePostDeletion({
    onPostDeleted,
  });

  const [reactionCounts, setReactionCounts] = useState<
    Record<ReactionType, number>
  >(() => {
    const base = REACTION_TYPE_ORDER.reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<ReactionType, number>);

    // Use backend's reactions data if available, otherwise fallback to manual counting
    if (post.reactions && Array.isArray(post.reactions)) {
      post.reactions.forEach((reaction) => {
        // Find reaction type by emoji
        const type = REACTION_TYPE_ORDER.find(t => ReactionService.getEmoji(t) === reaction.emoji);
        if (type) {
          base[type] = reaction.count || 0;
        }
      });
    } else if (Array.isArray(post.likesList)) {
      // Fallback to manual counting for legacy data
      post.likesList.forEach((like: any) => {
        const type = like?.type as ReactionType | undefined;
        if (type && base[type] !== undefined) {
          base[type] += 1;
        }
      });
    }

    if (post.userReaction && base[post.userReaction as ReactionType] !== undefined) {
      const type = post.userReaction as ReactionType;
      base[type] = Math.max(base[type], 1);
    }

    return base;
  });

  const reactionSummary = useMemo(
    () => {
      // Use backend's reactions data if available
      if (post.reactions && Array.isArray(post.reactions)) {
        return post.reactions
          .filter(reaction => reaction.count > 0)
          .map(reaction => {
            const type = REACTION_TYPE_ORDER.find(t => ReactionService.getEmoji(t) === reaction.emoji) || 'like';
            return {
              type: type as ReactionType,
              emoji: reaction.emoji,
              label: reaction.label,
              count: reaction.count,
              users: reaction.users || [],
            };
          });
      }

      // Fallback to computed counts
      return REACTION_TYPE_ORDER.map((type) => ({
        type,
        emoji: ReactionService.getEmoji(type) || "👍",
        label: type,
        count: reactionCounts[type],
      }));
    },
    [reactionCounts, post.reactions]
  );

  const handleReactionSummaryUpdate = useCallback(
    (counts: Record<ReactionType, number>, total: number) => {
      setReactionCounts(counts);
      setTotalReactionCount(total);
      // Don't update likeCount here - it should stay with the backend's likesCount value
      // likeCount represents the backend's likesCount, total represents all reaction types
    },
    []
  );

  useEffect(() => {
    setReaction((post.userReaction as Reaction) || null);
  }, [post.userReaction]);

  const handleReaction = async (reactionType: Reaction) => {
    let previousReaction: Reaction = null; // Declare previousReaction variable
    const previousCountsSnapshot = { ...reactionCounts };
    const previousTotal = totalReactionCount;

    try {
      // Added loading state at the start
      setIsReactionLoading(true);

      if (!isAuthenticated) {
        toast({
          title: "Login Required",
          description: "Please login to react to posts",
          variant: "destructive",
        });
        return;
      }

      if (!user) {
        console.error("[v0] User not found in auth context");
        toast({
          title: "Authentication Error",
          description: "Please refresh the page and try again",
          variant: "destructive",
        });
        return;
      }

      console.log("[v0] Using user from auth context:", user);
      console.log(
        "[v0] Current reaction:",
        reaction,
        "New reaction:",
        reactionType
      );

      previousReaction = reaction;
      const isNewReaction = !reaction;
      const postAuthorId =
        post.userId ||
        post.authorId ||
        post.user?.id ||
        post.user?.documentId ||
        post.userDocumentId;

      console.log("[v0] Post object structure:", {
        userId: post.userId,
        authorId: post.authorId,
        userObj: post.user,
        userDocumentId: post.userDocumentId,
        extractedPostAuthorId: postAuthorId,
      });

      const previousReactionType = reaction;

      const nextReaction: Reaction | null =
        reaction === reactionType ? null : reactionType;
      setReaction(nextReaction);

      setReactionCounts((prev) => {
        const updated = { ...prev };

        if (
          previousReactionType &&
          updated[previousReactionType as ReactionType] !== undefined
        ) {
          updated[previousReactionType as ReactionType] = Math.max(
            0,
            (updated[previousReactionType as ReactionType] ?? 0) - 1
          );
        }

        if (nextReaction) {
          updated[nextReaction] = (updated[nextReaction] ?? 0) + 1;
        }

        return updated;
      });

      // Don't manually update counts - let the backend and ReactionSummary handle this
      // The ReactionSummary component will refresh counts after server operations

      // Persist on server
      await ReactionService.addReaction(post.documentId, reactionType);

      // Notifications are now handled entirely by the backend when reactions are created
      console.log("[v0] Post component - reaction processed, notifications handled by backend");

      // Server persisted. UI already updated optimistically above.
    } catch (error) {
      console.error("Error handling reaction:", error);
      setReaction(previousReaction);
      setReactionCounts(previousCountsSnapshot);
      setTotalReactionCount(previousTotal);
      // Don't revert likeCount - it should stay with backend value
      toast({
        title: "Error",
        description: "Failed to update your reaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsReactionLoading(false);
    }
  };

  const handleLikeClick = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to react to posts",
        variant: "destructive",
      });
      return;
    }

    // If no reaction is set, show the reaction picker
    // If a reaction is set, toggle it off
    if (!reaction) {
      setShowReactions(true);
    } else {
      // Call handleReaction with the current reaction to toggle it off
      await handleReaction(reaction);
    }
  };

  const getReactionEmoji = (reactionType: Reaction) => {
    switch (reactionType) {
      case "like":
        return "👍";
      case "love":
        return "❤️";
      case "haha":
        return "😂";
      case "wow":
        return "😮";
      case "sad":
        return "😢";
      case "angry":
        return "😡";
      default:
        return null;
    }
  };

  const getReactionColor = (reactionType: Reaction) => {
    switch (reactionType) {
      case "like":
        return "text-blue-500";
      case "love":
        return "text-red-500";
      case "haha":
        return "text-yellow-500";
      case "wow":
        return "text-yellow-500";
      case "sad":
        return "text-blue-400";
      case "angry":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  const getReactionText = (reactionType: Reaction) => {
    switch (reactionType) {
      case "like":
        return "Like";
      case "love":
        return "Love";
      case "haha":
        return "Haha";
      case "wow":
        return "Wow";
      case "sad":
        return "Sad";
      case "angry":
        return "Angry";
      default:
        return "Like";
    }
  };

  const getTextColorForBackground = () => {
    if (!post.background) return "text-black";

    if (
      post.background.type === "color" ||
      post.background.type === "gradient"
    ) {
      return "text-white";
    }

    return "text-black";
  };

  // Generate the post URL - prefer documentId if available
  const getPostUrl = () => {
    // Use documentId if available, otherwise fall back to id
    const postIdentifier = post.documentId || post.id;
    return `/post/${postIdentifier}`;
  };

  // Handle share success
  const handleShareSuccess = () => {
    toast({
      title: "Post shared!",
      description: "Thanks for sharing this post.",
      duration: 2000,
    });
  };

  // Check if the current user is the post owner
  const isPostOwner = () => {
    if (!isAuthenticated || !user) return false;

    // Check various possible ID fields to determine ownership
    return (
      // Check numeric IDs
      (post.userId &&
        user.id &&
        post.userId.toString() === user.id.toString()) ||
      (post.authorId &&
        user.id &&
        post.authorId.toString() === user.id.toString()) ||
      (post.user?.id &&
        user.id &&
        post.user.id.toString() === user.id.toString()) ||
      // Check document IDs (Strapi v5 specific)
      (post.userDocumentId &&
        user.documentId &&
        post.userDocumentId === user.documentId) ||
      (post.user?.documentId &&
        user.documentId &&
        post.user.documentId === user.documentId) ||
      // Check usernames
      (post.username && user.username && post.username === user.username) ||
      (post.user?.username &&
        user.username &&
        post.user.username === user.username)
    );
  };

  // Handle post deletion
  const handleDeletePost = () => {
    deletePostHandler(post);
  };

  // Handle comment added
  const handleCommentAdded = () => {
    setCommentCount((prev) => prev + 1);
    // If we have a comments_count property on the post, update it too
    if (post.comments_count !== undefined) {
      post.comments_count += 1;
    }
    // If onPostUpdated is provided, call it with the updated post
    if (onPostUpdated) {
      onPostUpdated({
        ...post,
        comments_count:
          post.comments_count !== undefined
            ? post.comments_count
            : commentCount + 1,
      });
    }
  };

  // Handle comment deleted
  const handleCommentDeleted = () => {
    setCommentCount((prev) => Math.max(0, prev - 1));
    // If we have a comments_count property on the post, update it too
    if (post.comments_count !== undefined && post.comments_count > 0) {
      post.comments_count -= 1;
    }
    // If onPostUpdated is provided, call it with the updated post
    if (onPostUpdated) {
      onPostUpdated({
        ...post,
        comments_count:
          post.comments_count !== undefined
            ? post.comments_count
            : Math.max(0, commentCount - 1),
      });
    }
  };

  // Render post content based on contentType
  const renderPostContent = () => {
    const contentType = post.contentType || "text";

    switch (contentType) {
      case "text-background":
        if (post.background) {
          return (
            <div
              className={`rounded-lg p-6 mb-3 ${post.background.value} ${
                post.background.animation || ""
              }`}
              style={getBackgroundStyle(post.background)}
            >
              <p
                className={`text-xl font-semibold text-center ${getTextColorForBackground()}`}
              >
                {formatDescriptionWithHashtags(post)}
              </p>
            </div>
          );
        }
        // Fallback if no background data
        return (
          <div className="mb-3">
            <p className="text-sm">{formatDescriptionWithHashtags(post)}</p>
          </div>
        );

      case "image":
      case "video":
      case "media-gallery":
        return (
          <>
            {/* Description for media posts */}
            <div className="mb-3">
              <p className="text-sm">{formatDescriptionWithHashtags(post)}</p>
            </div>
            {/* Media content */}
            {hasMedia(post) && (
              <div className="mb-3 w-full">
                <Link href={getPostUrl()} className="block w-full">
                  <MediaGallery
                    items={toMediaItems(post)}
                    layout={post.galleryLayout || "grid"}
                    maxHeight={400}
                  />
                </Link>
              </div>
            )}
          </>
        );

      case "text":
      default:
        return (
          <div className="mb-3">
            <p className="text-sm">{formatDescriptionWithHashtags(post)}</p>
          </div>
        );
    }
  };

  // Get the image URL for the post - this is used for the TryOnButton and TryOnModal
  const postImageUrl = getImageUrl(post);

  // Log the image URL for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // Test image loading in development mode
      const img = new Image();
      img.onload = () => {
        console.log("Post image loaded successfully:", postImageUrl);
      };
      img.onerror = (e) => {
        console.error("Post image failed to load:", postImageUrl, e);
      };
      img.src = postImageUrl;
    }
  }, [postImageUrl, post]);

  // Handle clicking outside the reactions panel for the like button
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        reactionsRef.current &&
        !reactionsRef.current.contains(event.target as Node) &&
        likeButtonRef.current &&
        !likeButtonRef.current.contains(event.target as Node)
      ) {
        setShowReactions(false);
      }
    };

    if (showReactions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showReactions]);

  // Set up network request monitoring for comment fetching
  useEffect(() => {
    // Create a performance observer to monitor network requests
    if (typeof window !== "undefined" && window.PerformanceObserver) {
      // This will help us capture the actual URL being used
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Filter for comment-related requests
          if (
            (entry.initiatorType === "fetch" &&
              entry.name.includes("comment")) ||
            entry.name.includes("comments")
          ) {
            console.log("🔍 Comment API Request URL:", entry.name);
          }
        }
      });

      // Start observing network requests
      observer.observe({ entryTypes: ["resource"] });

      return () => {
        // Clean up the observer when component unmounts
        observer.disconnect();
      };
    }
  }, [post]);

  // Update comment count when post changes (use backend's commentsCount)
  useEffect(() => {
    // Use backend's commentsCount directly - no need to fetch or calculate
    const newCount = post.commentsCount || post.comments_count || (Array.isArray(post.comments) ? post.comments.length : 0) || 0;
    setCommentCount(newCount);
  }, [post.commentsCount, post.comments_count, post.comments]);

  return (
    <>
      <div
        className={`bg-white rounded-xl shadow-sm overflow-hidden mb-4 mx-4 ${className}`}
      >
        {/* Add direct image test in development mode */}

        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Link href={getProfileUrl(post)} className="flex items-center group">
              <EnhancedAvatar
                src={post.userImage}
                alt={post.username}
                className="h-10 w-10"
                fallbackClassName="bg-pink-100 text-pink-800"
              />
              <div className="ml-3">
                {/* Post author username and timestamp */}
                <div className="flex items-center">
                  <p className="text-sm font-medium group-hover:text-pink-500 transition-colors">
                    {post.username}
                  </p>
                  {isPostOwner() && (
                    <span className="ml-2 text-xs bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {post.createdAt
                    ? formatBackendDate(post.createdAt)
                    : formatDate(post.timestamp)}
                </p>
              </div>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                  <MoreHorizontal className="h-5 w-5 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthenticated && normalizedPostId !== null && (
                  <AddToCollectionDialog
                    postId={normalizedPostId}
                    postTitle={post.title || post.description}
                    onCollectionAdded={handleCollectionAdded}
                    trigger={
                      <DropdownMenuItem className="flex items-center" onSelect={(event) => event.preventDefault()}>
                        <BookmarkPlus className="h-4 w-4 mr-2" />
                        {isPostSaved ? "Manage collections" : "Add to collection"}
                      </DropdownMenuItem>
                    }
                  />
                )}
                <DropdownMenuItem>Hide post</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setReportModalOpen(true)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report post
                </DropdownMenuItem>
                {isPostOwner() && (
                  <DropdownMenuItem
                    onClick={() => setEditModalOpen(true)}
                    className="flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit post
                  </DropdownMenuItem>
                )}
                {isPostOwner() && (
                  <DropdownMenuItem
                    className="text-red-500 focus:text-red-500 focus:bg-red-50 flex items-center"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete post
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Post content area - wrapped in Link for navigation */}
        <Link href={getPostUrl()} className="block">
          {/* Post title - only display if it exists */}
          {post.title && (
            <div className="mb-2">
              <h2 className="text-lg font-bold text-gray-900 hover:text-pink-600 transition-colors">{post.title}</h2>
            </div>
          )}

          {/* Content rendering based on contentType */}
          <div className="hover:opacity-90 transition-opacity">
            {renderPostContent()}
          </div>
        </Link>

        {/* Enhanced Dedicated Reactions Section */}
        <div className="mt-3 mb-2">
          <div
            className="bg-gray-50 p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setModalOpen(true)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {/* Display emojis only for reactions that have counts > 0 */}
                {reactionSummary
                  .filter((reaction) => reaction.count > 0)
                  .slice(0, 3) // Show max 3 different emoji types
                  .map((reaction, index) => (
                    <span key={reaction.label} className="text-sm">
                      {reaction.emoji}
                    </span>
                  ))}
                {/* Show +X more if there are more than 3 reaction types */}
                {reactionSummary.filter((reaction) => reaction.count > 0)
                  .length > 3 && (
                  <span className="text-xs text-gray-500 ml-1">
                    +
                    {reactionSummary.filter((reaction) => reaction.count > 0)
                      .length - 3}{" "}
                    more
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {totalReactionCount > 0
                  ? `${totalReactionCount} reactions`
                  : "0 reactions"}
              </div>
            </div>
          </div>
        </div>

        {/* Likes and comments count */}
        <div className="flex items-center justify-between mt-3 pb-3 border-b">
          <div className="flex items-center">
            {reaction && (
              <span className="mr-1 text-sm">{getReactionEmoji(reaction)}</span>
            )}
            <span className="text-sm text-gray-500">
              {likeCount > 0 ? `${likeCount}` : ""}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {commentCount > 0 && `${commentCount} comments`}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between py-1 relative">
          <div className="relative flex-1">
            <button
              ref={likeButtonRef}
              className={`flex items-center justify-center w-full py-2 rounded-md hover:bg-gray-100 transition-colors ${
                reaction ? getReactionColor(reaction) : "text-gray-500"
              } ${isReactionLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={handleLikeClick}
              disabled={isReactionLoading}
              aria-label={
                reaction
                  ? `${getReactionText(reaction)} this post`
                  : "Like this post"
              }
            >
              {isReactionLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2"></div>
                  <span className="text-sm font-medium">Processing...</span>
                </>
              ) : reaction ? (
                <>
                  <span className="mr-2 text-lg">
                    {getReactionEmoji(reaction)}
                  </span>
                  <span className="text-sm font-medium hidden md:inline-block">
                    {getReactionText(reaction)}
                  </span>
                  <span className="text-sm font-medium md:hidden">
                    {getReactionText(reaction)}
                  </span>
                </>
              ) : (
                <>
                  <Heart className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium hidden md:inline-block">
                    Like
                  </span>
                  <span className="text-sm font-medium md:hidden">Like</span>
                </>
              )}
            </button>

            {/* Reaction picker */}
            {showReactions && !isReactionLoading && (
              <div
                ref={reactionsRef}
                className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg border p-2 flex space-x-1 z-10"
              >
                {reactionData.map((reactionItem) => (
                  <button
                    key={reactionItem.type}
                    className={`hover:scale-125 transition-transform p-1 rounded-full hover:bg-gray-100 ${
                      reaction === reactionItem.type
                        ? "bg-blue-100 ring-2 ring-blue-500"
                        : ""
                    }`}
                    onClick={() => {
                      handleReaction(reactionItem.type as Reaction);
                      setShowReactions(false);
                    }}
                    disabled={isReactionLoading}
                    aria-label={reactionItem.label}
                  >
                    <span className="text-xl">{reactionItem.emoji}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="flex items-center justify-center flex-1 py-2 rounded-md hover:bg-gray-100 transition-colors text-gray-500"
            onClick={() => setCommentOpen(!commentOpen)}
            aria-label={`View ${commentCount} comments`}
          >
            <MessageCircle className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium hidden md:inline-block">
              Comments
            </span>
            <span className="text-sm font-medium md:hidden">Comments</span>
          </button>


          <ShareMenu
            url={getPostUrl()}
            title={post.description}
            description={`Check out this post by ${post.username}`}
            image={postImageUrl}
            variant="ghost"
            className="flex-1 justify-center py-2 h-auto rounded-md hover:bg-gray-100 transition-colors text-gray-500"
            onShare={handleShareSuccess}
          />

          {/* Add the Try On button with the correct designImageUrl prop */}
          <TryOnButton
            designImageUrl={postImageUrl}
            designTitle={post.title || `${post.username}'s design`}
            variant="ghost"
            size="default"
            className="flex-1 justify-center py-2 h-auto rounded-md hover:bg-gray-100 transition-colors text-gray-500"
          />
        </div>

        {lastSavedCollection && (
          <div
            className="mt-3 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700"
            role="status"
            aria-live="polite"
          >
            <span aria-hidden="true">*</span>
            <span>Added to {lastSavedCollection}</span>
          </div>
        )}

        {commentOpen && (
          <FeedCommentSection
            postId={post.id}
            documentId={post.documentId || post.id.toString()}
            onCommentAdded={handleCommentAdded}
            onCommentDeleted={handleCommentDeleted}
            allowViewingForAll={true} // Add this prop to indicate all users can view comments
          />
        )}
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

      {/* Try On Modal */}
      <TryOnModal
        open={tryOnModalOpen}
        onOpenChange={setTryOnModalOpen}
        designImageUrl={postImageUrl}
        designTitle={post.title || `${post.username}'s design`}
      />

      {/* Reaction Modal */}
      <ReactionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        totalCount={totalReactionCount}
        postId={post.documentId || post.id?.toString()}
        initialCounts={reactionCounts}
        onSummaryUpdate={handleReactionSummaryUpdate}
      />

      {/* Edit Post Modal */}
      {editModalOpen && (
        <EditPostModal
          post={post}
          onClose={() => setEditModalOpen(false)}
          onPostUpdated={(updatedPost) => {
            if (onPostUpdated) {
              onPostUpdated(updatedPost);
            }
            setEditModalOpen(false);
          }}
        />
      )}

      {/* Report Post Modal */}
      <ReportContentModal
        isOpen={reportModalOpen}
        onOpenChange={setReportModalOpen}
        contentType="post"
        contentId={post.documentId || post.id?.toString() || ""}
        contentTitle={post.title || post.description}
        contentAuthor={post.username}
      />
    </>
  );
}

// Function to get image URL for TryOn feature
function getImageUrl(post: any) {
  const primaryMedia = getPrimaryMedia(post);

  if (primaryMedia && primaryMedia.type === "image") {
    return primaryMedia.url;
  }

  // Default fallback
  return "/vibrant-floral-nails.png";
}

// Function to format post description to highlight hashtags
function formatDescriptionWithHashtags(post: any) {
  if (!post.description) return null;

  const parts = post.description.split(/(#\w+)/g);
  return parts.map((part, index) => {
    if (part.startsWith("#")) {
      return (
        <Link
          href={`/explore?tag=${part.substring(1)}`}
          key={index}
          className="text-pink-500 font-medium hover:underline"
          onClick={(e) => e.stopPropagation()} // Prevent triggering parent link
        >
          {part}
        </Link>
      );
    }
    return part;
  });
}

// Function to get inline styles for background colors as fallback
function getBackgroundStyle(background: any) {
  if (!background) return {};

  // Map background value to actual CSS styles as fallback
  const backgroundMap: Record<string, string> = {
    'bg-red-500': '#ef4444',
    'bg-blue-500': '#3b82f6',
    'bg-green-500': '#10b981',
    'bg-yellow-500': '#f59e0b',
    'bg-purple-500': '#8b5cf6',
    'bg-pink-500': '#ec4899',
    'bg-indigo-500': '#6366f1',
    'bg-gray-500': '#6b7280',
    'bg-orange-500': '#f97316',
    'bg-teal-500': '#14b8a6',
  };

  if (background.type === 'color' && backgroundMap[background.value]) {
    return { backgroundColor: backgroundMap[background.value] };
  }

  if (background.type === 'gradient') {
    // Handle gradient backgrounds
    const gradientMap: Record<string, string> = {
      'bg-gradient-to-r from-blue-500 to-purple-600': 'linear-gradient(to right, #3b82f6, #9333ea)',
      'bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500': 'linear-gradient(to bottom right, #ec4899, #ef4444, #f59e0b)',
      'bg-gradient-to-r from-green-400 to-blue-500': 'linear-gradient(to right, #4ade80, #3b82f6)',
    };

    if (gradientMap[background.value]) {
      return { background: gradientMap[background.value] };
    }
  }

  return {};
}

// Function to get the profile URL for the post author
function getProfileUrl(post: any) {
  // Use documentId for profile links (Strapi v5)
  const userDocumentId = post.userDocumentId || post.user?.documentId;
  if (userDocumentId) {
    return `/profile/${userDocumentId}`;
  }

  // Fallback to username if documentId is not available
  return `/profile/${post.username}`;
}



















