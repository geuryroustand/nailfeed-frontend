"use client";

import type React from "react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ImageIcon,
  Video,
  Smile,
  XCircle,
  MapPin,
  UserPlus,
  Palette,
  LayoutGrid,
  Hash,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PostBackgroundSelector, {
  type BackgroundType,
} from "./post-background-selector";
import MediaGallery from "./media-gallery";
import type { MediaItem } from "@/types/media";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import type { ContentType, GalleryLayout } from "@/lib/services/post-service";
import dynamic from "next/dynamic";
// Update the import at the top of the file
import {
  containsProfanity,
  validateContent as validateContentText,
} from "@/lib/content-moderation";
import { createPostBasic } from "@/app/actions/simple-post-actions";
import { uploadPostMedia } from "@/lib/services/strapi-upload-service";

// Dynamically import EmojiPicker to avoid SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => <div className="p-4 text-center">Loading emoji picker...</div>,
});

interface CreatePostModalProps {
  onClose: () => void;
  onPostCreated: (post: any) => void;
  onPostCreationFailed?: (optimisticPostId: string) => void; // For handling failed optimistic updates
}

export default function CreatePostModal({
  onClose,
  onPostCreated,
  onPostCreationFailed,
}: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [background, setBackground] = useState<BackgroundType | null>(null);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const [galleryLayout, setGalleryLayout] = useState<GalleryLayout>("grid");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const MAX_MEDIA_ITEMS = 10;
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showTrendingTags, setShowTrendingTags] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const mounted = useRef(true);
  const [title, setTitle] = useState("");
  const [showTitleInput, setShowTitleInput] = useState(false);

  // Trending tags suggestion (mock data - could be fetched from API)
  const trendingTags = [
    "summernails",
    "frenchnails",
    "gelnails",
    "acrylicnails",
    "nailart",
    "naildesign",
    "nailinspiration",
    "nailsofinstagram",
    "glitternails",
    "mattenails",
    "ombrenails",
    "coffinnails",
  ];

  // Use MediaItem type from "@/types/media" for type compatibility
  // Extract hashtags from content
  const extractedTags = useMemo(() => {
    const hashtagRegex = /#(\w+)/g;
    const matches = [...content.matchAll(hashtagRegex)];
    return matches
      .map((match) => match[1].toLowerCase())
      .filter((tag, index, self) => self.indexOf(tag) === index); // Remove duplicates
  }, [content]);

  // const [formData, setFormData] = useState({
  //   description: "",
  //   contentType: "image" as ContentType,
  //   background: null as BackgroundType | null,
  //   galleryLayout: "grid" as GalleryLayout,
  // })

  // Check if user is authenticated, if not, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to create posts",
        variant: "destructive",
      });
      onClose();
      router.push("/auth");
    }
  }, [isAuthenticated, onClose, router, toast]);

  // Auto-resize textarea as content changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      updateCursorPosition();
    }
  }, [content]);

  const handleMediaSelect = (type: "image" | "video") => {
    // If selecting media, clear background
    if (background) {
      setBackground(null);
    }

    if (mediaItems.length >= MAX_MEDIA_ITEMS) {
      toast({
        title: `Maximum ${MAX_MEDIA_ITEMS} media items allowed`,
        description: `Please remove some media items before adding more.`,
        variant: "destructive",
      });
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.accept = type === "image" ? "image/*" : "video/*";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Handle multiple files
    const newMediaItems: MediaItem[] = [];

    Array.from(files).forEach((file) => {
      if (mediaItems.length + newMediaItems.length >= MAX_MEDIA_ITEMS) return;

      // Create a local URL for the file preview
      const objectUrl = URL.createObjectURL(file);
      const type = file.type.startsWith("image/") ? "image" : "video";

      newMediaItems.push({
        id: Date.now() + Math.random().toString(36).substring(2, 9),
        type,
        url: objectUrl,
        file: file, // Store the file reference for later upload
      });
    });

    setMediaItems([...mediaItems, ...newMediaItems]);

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveMedia = (id: string) => {
    setMediaItems((prev) => {
      const itemToRemove = prev.find((item) => item.id === id);
      if (
        itemToRemove &&
        itemToRemove.url &&
        itemToRemove.url.startsWith("blob:")
      ) {
        URL.revokeObjectURL(itemToRemove.url);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleEmojiSelect = (emojiData: any) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const emoji = emojiData.emoji;
    const cursorPos = textarea.selectionStart;

    const textBefore = content.substring(0, cursorPos);
    const textAfter = content.substring(cursorPos);

    setContent(textBefore + emoji + textAfter);

    // Focus back on textarea and set cursor position after inserted emoji
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = cursorPos + emoji.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      updateCursorPosition();
    }, 0);

    // Close emoji picker after selection
    setShowEmojiPicker(false);
  };

  const handleBackgroundSelect = (
    selectedBackground: BackgroundType | null
  ) => {
    setBackground(selectedBackground);

    // If selecting a background, clear media
    if (selectedBackground && mediaItems.length > 0) {
      // Revoke all object URLs to prevent memory leaks
      mediaItems.forEach((item) => {
        if (item.url && item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url);
        }
      });
      setMediaItems([]);
    }
  };

  const insertHashtag = (tag: string) => {
    // Insert the hashtag at the current cursor position or at the end
    const textarea = textareaRef.current;
    if (!textarea) return;

    const tagText = ` #${tag} `;
    const cursorPos = textarea.selectionStart;

    const textBefore = content.substring(0, cursorPos);
    const textAfter = content.substring(cursorPos);

    setContent(textBefore + tagText + textAfter);

    // Focus back on textarea and set cursor position after inserted tag
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = cursorPos + tagText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      updateCursorPosition();
    }, 0);

    setShowTrendingTags(false);
  };

  // Format content to highlight hashtags
  const formatContentWithHashtags = () => {
    if (!content) return null;

    const parts = content.split(/(#\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith("#")) {
        return (
          <span key={index} className="text-pink-500 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    // Handle click outside for emoji picker and trending tags
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target) &&
        !target.closest(".emoji-button")
      ) {
        setShowEmojiPicker(false);
      }
      if (
        showTrendingTags &&
        !target.closest(".trending-tags-container") &&
        !target.closest(".hashtag-button")
      ) {
        setShowTrendingTags(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    // Clean up function
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker, showTrendingTags]);

  // Separate useEffect for cleaning up blob URLs to avoid unnecessary revocations
  useEffect(() => {
    return () => {
      // Revoke all object URLs to prevent memory leaks when component unmounts
      mediaItems.forEach((item) => {
        if (item.url && item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, []);

  // Track component mounting state
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Update the validateContent function to use the imported function:
  const validateContent = (): { isValid: boolean; errorMessage?: string } => {
    // Check title for profanity if it exists
    if (title && containsProfanity(title)) {
      return {
        isValid: false,
        errorMessage:
          "Your title contains inappropriate language. Please revise it.",
      };
    }

    // Check description for profanity
    if (content) {
      return validateContentText(content);
    }

    return { isValid: true };
  };

  const invalidateServiceWorkerCache = useCallback(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "INVALIDATE_CACHE",
        pattern: "/api/posts",
      });
    }
  }, []);

  // Optimized handleSubmit with optimistic UI updates and better error handling
  const handleSubmit = async () => {
    // Reset previous errors
    setSubmitError(null);

    // Validate content for profanity
    const contentValidation = validateContent();
    if (!contentValidation.isValid) {
      setSubmitError(
        contentValidation.errorMessage ||
          "Your post contains inappropriate content."
      );
      toast({
        title: "Content moderation",
        description: contentValidation.errorMessage,
        variant: "destructive",
      });
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create posts",
        variant: "destructive",
      });
      onClose();
      router.push("/auth");
      return;
    }

    if (!content.trim() && mediaItems.length === 0) {
      toast({
        title: "Cannot create empty post",
        description: "Please add some text or media to your post.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Declare optimisticPost outside try-catch so it's accessible in catch
    let optimisticPost: any = null;

    try {
      // Determine the content type based on what's being posted
      let contentType: ContentType;
      if (mediaItems.length > 0) {
        contentType =
          mediaItems.length === 1
            ? mediaItems[0].type === "image"
              ? "image"
              : "video"
            : "media-gallery";
      } else {
        contentType = background ? "text-background" : "text";
      }

      // Create optimistic post data with unique temp ID
      const tempId = `temp-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      optimisticPost = {
        id: tempId,
        documentId: tempId,
        username: user.username || user.displayName || "You",
        userImage: user.profileImage?.url || "",
        title: title.trim(),
        description: content,
        likes: 0,
        comments: [],
        comments_count: 0,
        reactions: [],
        timestamp: "Just now",
        createdAt: new Date().toISOString(),
        contentType,
        mediaItems: mediaItems.map((item, index) => ({
          id: `temp-media-${index}`,
          type: item.type,
          url: item.url,
          file: item.file,
        })),
        galleryLayout,
        background: background || undefined,
        tags: extractedTags || [],
        userId: user.id,
        userDocumentId: user.documentId || user.id.toString(),
        user: {
          id: user.id,
          documentId: user.documentId,
          username: user.username,
          displayName: user.displayName || user.username,
          profileImage: user.profileImage,
        },
        isOptimistic: true, // Flag to identify optimistic posts
      };

      // Show optimistic UI immediately
      onPostCreated(optimisticPost);
      onClose();

      // Show immediate success feedback
      toast({
        title: "Publishing post...",
        description: "Your content is being shared with the community.",
        duration: 2000,
      });

      // Prepare FormData for the server action
      const formData = new FormData();

      // Add basic post data
      formData.append("title", title.trim());
      formData.append("description", content);
      formData.append("contentType", contentType);
      formData.append("galleryLayout", galleryLayout);
      formData.append("userDocumentId", user?.documentId || "");
      formData.append(
        "userObject",
        JSON.stringify({
          ...user,
          username: user.username,
          displayName: user.displayName || user.username,
        })
      );

      // Add background if exists
      if (background) {
        formData.append("background", JSON.stringify(background));
      }

      // Add extracted hashtags
      formData.append("tags", JSON.stringify(extractedTags));

      // STEP 1: Create post with basic data only
      console.log("[CreatePost] Creating post with basic data...");
      const postResponse = await createPostBasic(formData);

      if (!postResponse.success) {
        throw new Error(postResponse.error || "Failed to create post");
      }

      const createdPost = postResponse.post;
      console.log("[CreatePost] Post created:", {
        id: createdPost.id,
        documentId: createdPost.documentId,
      });

      // STEP 2: Upload media files with post references (if any)
      if (mediaItems.length > 0) {
        console.log("[CreatePost] Uploading media files to post...");

        const filesToUpload = mediaItems
          .map((item) => item.file)
          .filter(
            (file) => file instanceof File || file instanceof Blob
          ) as File[];

        if (filesToUpload.length > 0) {
          // CRITICAL: Use numeric ID for Strapi relations, not documentId
          const uploadResult = await uploadPostMedia(
            filesToUpload,
            createdPost.id
          );

          if (!uploadResult.success) {
            console.warn(
              "[CreatePost] Media upload failed:",
              uploadResult.error
            );
          } else {
            console.log("[CreatePost] Media upload completed");

            // STEP 3: Fetch updated post data with media relations
            console.log(
              "[CreatePost] Fetching updated post data with media..."
            );
            try {
              // Use auth-proxy GET to handle authentication correctly
              const endpoint = `/api/posts/${createdPost.documentId}`;
              const params = new URLSearchParams({
                "populate[user][populate]": "profileImage",
                populate: "media",
              });
              const updatedPostUrl = `/api/auth-proxy?endpoint=${encodeURIComponent(
                endpoint
              )}&${params.toString()}`;

              console.log("[CreatePost] Fetching from:", updatedPostUrl);

              const updatedPostResponse = await fetch(updatedPostUrl, {
                method: "GET",
              });

              if (updatedPostResponse.ok) {
                const updatedPostData = await updatedPostResponse.json();
                const updatedPost = updatedPostData.data;

                console.log("[CreatePost] Updated post data:", {
                  id: updatedPost.id,
                  mediaCount: updatedPost.media?.length || 0,
                });

                // Update the created post with fresh media data
                createdPost.media = updatedPost.media || [];
              } else {
                console.warn("[CreatePost] Failed to fetch updated post data");
              }
            } catch (error) {
              console.error("[CreatePost] Error fetching updated post:", error);
            }
          }
        }
      }

      // Use the (potentially updated) post data for response
      const responseData = postResponse;

      if (!responseData.success) {
        throw new Error(responseData.error || "Failed to create post");
      }

      // Create the real post with server data and preserve user info
      const realPost = {
        ...optimisticPost,
        id: createdPost.id,
        documentId: createdPost.documentId,
        // Use uploaded media data when available, fallback to optimistic
        media: createdPost.media || optimisticPost.mediaItems,
        mediaItems: createdPost.media || optimisticPost.mediaItems,
        createdAt: createdPost.createdAt || optimisticPost.createdAt,
        // Preserve user data from context
        username: user.username || user.displayName || "You",
        userImage: user.profileImage?.url || "",
        user: createdPost.user || {
          id: user.id,
          documentId: user.documentId,
          username: user.username,
          displayName: user.displayName || user.username,
          profileImage: user.profileImage,
        },
        isOptimistic: false, // No longer optimistic
        tempId: optimisticPost.id, // Keep reference to temp ID for replacement
        // Add initial comment count to avoid API fetch
        comments_count: 0,
        comments: [],
        // Default reaction count/state
        likes: 0,
        reactions: [],
        // Add upload stats for debugging
        uploadStats: responseData.post.uploadStats,
      };

      // Signal to replace optimistic post with real post
      onPostCreated(realPost);

      // Invalidate cache for fresh data
      invalidateServiceWorkerCache();

      // Show final success message with upload stats
      const uploadStats = responseData.post.uploadStats;
      const mediaMessage = uploadStats?.uploadedFiles
        ? `${uploadStats.uploadedFiles} files uploaded successfully`
        : "Content shared successfully";

      toast({
        title: "Post published successfully!",
        description: mediaMessage,
        duration: 3000,
      });
    } catch (error) {
      // Handle optimistic post failure
      if (onPostCreationFailed && optimisticPost) {
        onPostCreationFailed(optimisticPost.id.toString());
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.";

      setSubmitError(errorMessage);
      toast({
        title: "Error creating post",
        description: errorMessage,
        variant: "destructive",
      });

      // Reopen the modal so user can try again
      // The optimistic post should be removed by the parent component
    } finally {
      if (mounted.current) {
        setIsSubmitting(false);
      }
    }
  };

  const isPostButtonDisabled =
    (!content.trim() && mediaItems.length === 0) || isSubmitting;

  // If not authenticated, don't render the modal
  if (!isAuthenticated) {
    return null;
  }

  const getCursorPosition = () => {
    if (!textareaRef.current) return 0;

    // Create a temporary span to measure text width
    const tempSpan = document.createElement("span");
    tempSpan.style.font = window.getComputedStyle(textareaRef.current).font;
    tempSpan.style.position = "absolute";
    tempSpan.style.visibility = "hidden";
    tempSpan.style.whiteSpace = "pre";
    document.body.appendChild(tempSpan);

    // Get text before cursor
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPos);

    // Measure width
    tempSpan.textContent = textBeforeCursor;
    const width = tempSpan.getBoundingClientRect().width;

    // Clean up
    document.body.removeChild(tempSpan);

    return width;
  };

  const updateCursorPosition = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-center">
            Create Post
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImage?.url} alt="Your profile" />
              <AvatarFallback>
                {user?.username?.substring(0, 2).toUpperCase() || "YO"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-sm">{user?.username || "You"}</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-4 flex-grow">
          <div className="space-y-4">
            {title && (
              <div className="mb-2">
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              </div>
            )}
            {background ? (
              <div
                className={`rounded-lg p-4 ${background.value} ${
                  background.animation || ""
                } relative min-h-[200px] flex items-center justify-center`}
              >
                <div
                  className={`w-full text-xl font-semibold border-none focus:outline-none focus:ring-0 p-0 bg-transparent text-center relative ${
                    background.type === "color" ||
                    background.type === "gradient"
                      ? "text-white"
                      : "text-black"
                  }`}
                >
                  <div className="relative">
                    {formatContentWithHashtags()}
                    {/* Blinking cursor indicator */}
                    <div
                      className="absolute inline-block w-0.5 h-5 bg-current animate-blink"
                      style={{
                        left: `${getCursorPosition()}px`,
                        top: "0.25rem",
                        display: isFocused ? "block" : "none",
                      }}
                    />
                  </div>
                  <textarea
                    ref={textareaRef}
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyUp={updateCursorPosition}
                    onMouseUp={updateCursorPosition}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`w-full text-xl font-semibold resize-none border-none focus:outline-none focus:ring-0 p-0 bg-transparent text-center absolute top-0 left-0 opacity-0 z-10 ${
                      background.type === "color" ||
                      background.type === "gradient"
                        ? "text-white"
                        : "text-black"
                    }`}
                    style={{ minHeight: "100px" }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
                  onClick={() => setBackground(null)}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="relative">
                <div className="w-full text-base resize-none border-none focus:outline-none focus:ring-0 p-0 overflow-hidden min-h-[100px] relative">
                  <div className="relative">
                    {formatContentWithHashtags()}
                    {/* Blinking cursor indicator */}
                    <div
                      className="absolute inline-block w-0.5 h-5 bg-gray-800 animate-blink"
                      style={{
                        left: `${getCursorPosition()}px`,
                        top: "0.25rem",
                        display: isFocused ? "block" : "none",
                      }}
                    />
                  </div>
                </div>
                <textarea
                  ref={textareaRef}
                  placeholder="What's on your mind? Use #hashtags to tag your post!"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyUp={updateCursorPosition}
                  onMouseUp={updateCursorPosition}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="w-full text-base resize-none border-none focus:outline-none focus:ring-0 p-0 overflow-hidden absolute top-0 left-0 opacity-0 z-10"
                  style={{ minHeight: "100px" }}
                />
              </div>
            )}

            {showBackgroundSelector && mediaItems.length === 0 && (
              <PostBackgroundSelector
                onSelect={handleBackgroundSelect}
                selectedBackground={background}
              />
            )}

            {mediaItems.length > 0 && (
              <div className="space-y-2 w-full">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">
                    Media Gallery ({mediaItems.length}/{MAX_MEDIA_ITEMS})
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <LayoutGrid className="h-4 w-4 mr-1" />
                        <span>Layout</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setGalleryLayout("grid")}
                      >
                        Grid
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setGalleryLayout("carousel")}
                      >
                        Carousel
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setGalleryLayout("featured")}
                      >
                        Featured
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="w-full border border-gray-200 rounded-lg p-2">
                  <MediaGallery
                    items={mediaItems}
                    layout={galleryLayout}
                    editable={true}
                    onRemove={handleRemoveMedia}
                    maxHeight={300}
                  />
                </div>
              </div>
            )}

            {/* Hashtags section */}
            {extractedTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Hashtags in your post</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {extractedTags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-pink-50 text-pink-600 text-xs px-2 py-1 rounded-full flex items-center"
                    >
                      #{tag}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error message display */}
            {submitError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                <p className="font-medium">Error creating post:</p>
                <p>{submitError}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t flex-shrink-0">
          {showTitleInput && (
            <div className="mb-4 p-3 border rounded-lg">
              <label
                htmlFor="post-title"
                className="block text-sm font-medium mb-2"
              >
                Post Title:
              </label>
              <input
                id="post-title"
                type="text"
                placeholder="Enter a catchy title for your post..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-base font-medium"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {title.length}/100 characters
              </p>
            </div>
          )}
          <div className="rounded-lg border p-3 mb-4">
            <p className="text-sm font-medium mb-2">Add to your post</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-green-500"
                onClick={() => handleMediaSelect("image")}
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-blue-500"
                onClick={() => handleMediaSelect("video")}
              >
                <Video className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-full ${
                  showBackgroundSelector
                    ? "bg-gray-200 text-pink-500"
                    : "text-pink-500"
                }`}
                onClick={() =>
                  setShowBackgroundSelector(!showBackgroundSelector)
                }
                disabled={mediaItems.length > 0}
              >
                <Palette className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-full ${
                  showEmojiPicker
                    ? "bg-gray-200 text-yellow-500"
                    : "text-yellow-500"
                } emoji-button`}
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowTrendingTags(false);
                }}
              >
                <Smile className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-full ${
                  showTrendingTags
                    ? "bg-gray-200 text-purple-500"
                    : "text-purple-500"
                } hashtag-button`}
                onClick={() => {
                  setShowTrendingTags(!showTrendingTags);
                  setShowEmojiPicker(false);
                }}
              >
                <Hash className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-red-500"
              >
                <MapPin className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-purple-500"
              >
                <UserPlus className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 rounded-full ${
                  showTitleInput ? "bg-gray-200 text-teal-500" : "text-teal-500"
                }`}
                onClick={() => setShowTitleInput(!showTitleInput)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M4 7V4h16v3" />
                  <path d="M9 20h6" />
                  <path d="M12 4v16" />
                </svg>
              </Button>
            </div>
          </div>

          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="emoji-picker-container absolute z-20 bottom-[120px] left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl"
            >
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                searchPlaceholder="Search emojis..."
                width={320}
                height={400}
                previewConfig={{
                  showPreview: true,
                  defaultCaption: "Pick your emoji...",
                }}
                skinTonesDisabled
                theme={require("emoji-picker-react").Theme.LIGHT}
                lazyLoadEmojis
              />
            </div>
          )}

          {showTrendingTags && (
            <div className="trending-tags-container absolute z-10 bottom-[120px] left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-3 w-[90%] max-w-[400px]">
              <p className="text-sm font-medium mb-2">Trending Hashtags</p>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-full bg-gray-50 hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200"
                    onClick={() => insertHashtag(tag)}
                  >
                    #{tag}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />

          <Button
            onClick={handleSubmit}
            disabled={isPostButtonDisabled}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-medium py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
