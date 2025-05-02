"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon, Video, Smile, XCircle, MapPin, UserPlus, Palette, LayoutGrid } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import PostBackgroundSelector, { type BackgroundType } from "./post-background-selector"
import MediaGallery from "./media-gallery"
import type { MediaItem } from "@/types/media"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createPost } from "@/app/actions/post-actions"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import type { ContentType, GalleryLayout } from "@/lib/services/post-service"

interface CreatePostModalProps {
  onClose: () => void
  onPostCreated: (post: any) => void
}

export default function CreatePostModal({ onClose, onPostCreated }: CreatePostModalProps) {
  const [content, setContent] = useState("")
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [background, setBackground] = useState<BackgroundType | null>(null)
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false)
  // Updated to match the Strapi enum values
  const [galleryLayout, setGalleryLayout] = useState<GalleryLayout>("grid,")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const MAX_MEDIA_ITEMS = 10
  const { user, isAuthenticated, token } = useAuth()
  const router = useRouter()
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState("")

  // Log user information for debugging
  useEffect(() => {
    if (user) {
      console.log("Current user:", user)
      console.log("User ID:", user.id)
      console.log("User documentId:", user.documentId)
    }
  }, [user])

  // Check if user is authenticated, if not, redirect to login
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to create posts",
        variant: "destructive",
      })
      onClose()
      router.push("/auth")
    } else {
      // Ensure the JWT token is stored in localStorage for the API client to use
      if (token) {
        console.log("Storing JWT token in localStorage")
        localStorage.setItem("jwt", token)
      } else {
        console.warn("No token available in auth context")
      }
    }
  }, [isAuthenticated, onClose, router, toast, token])

  // Auto-resize textarea as content changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content])

  const handleMediaSelect = (type: "image" | "video") => {
    // If selecting media, clear background
    if (background) {
      setBackground(null)
    }

    if (mediaItems.length >= MAX_MEDIA_ITEMS) {
      toast({
        title: `Maximum ${MAX_MEDIA_ITEMS} media items allowed`,
        description: `Please remove some media items before adding more.`,
        variant: "destructive",
      })
      return
    }

    if (fileInputRef.current) {
      fileInputRef.current.accept = type === "image" ? "image/*" : "video/*"
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Handle multiple files
    const newMediaItems: MediaItem[] = []

    Array.from(files).forEach((file) => {
      if (mediaItems.length + newMediaItems.length >= MAX_MEDIA_ITEMS) return

      // Create a local URL for the file preview
      const objectUrl = URL.createObjectURL(file)
      const type = file.type.startsWith("image/") ? "image" : "video"

      newMediaItems.push({
        id: Date.now() + Math.random().toString(36).substring(2, 9),
        type,
        url: objectUrl,
        file: file, // Store the file reference for later upload
      })
    })

    setMediaItems([...mediaItems, ...newMediaItems])

    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveMedia = (id: string) => {
    setMediaItems((prev) => {
      const itemToRemove = prev.find((item) => item.id === id)
      if (itemToRemove && itemToRemove.url.startsWith("blob:")) {
        URL.revokeObjectURL(itemToRemove.url)
      }
      return prev.filter((item) => item.id !== id)
    })
  }

  const handleEmojiSelect = (emoji: any) => {
    setContent((prev) => prev + emoji.native)
    setShowEmojiPicker(false)
  }

  const handleBackgroundSelect = (selectedBackground: BackgroundType | null) => {
    setBackground(selectedBackground)

    // If selecting a background, clear media
    if (selectedBackground && mediaItems.length > 0) {
      // Revoke all object URLs to prevent memory leaks
      mediaItems.forEach((item) => {
        if (item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url)
        }
      })
      setMediaItems([])
    }
  }

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  useEffect(() => {
    // Handle click outside for emoji picker
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showEmojiPicker && !target.closest(".emoji-picker-container")) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    // Clean up function
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)

      // Revoke all object URLs to prevent memory leaks
      mediaItems.forEach((item) => {
        if (item.url.startsWith("blob:")) {
          URL.revokeObjectURL(item.url)
        }
      })
    }
  }, [showEmojiPicker, mediaItems])

  // Update the handleSubmit function to better handle media uploads
  const handleSubmit = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please log in to create posts",
        variant: "destructive",
      })
      onClose()
      router.push("/auth")
      return
    }

    // Double-check that the JWT token is stored
    if (!localStorage.getItem("jwt") && token) {
      console.log("Storing JWT token in localStorage before submission")
      localStorage.setItem("jwt", token)
    }

    if (!content.trim() && mediaItems.length === 0) {
      toast({
        title: "Cannot create empty post",
        description: "Please add some text or media to your post.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      console.log("Starting post creation process")
      console.log("Authentication status:", isAuthenticated ? "Authenticated" : "Not authenticated")
      console.log("User:", user ? `${user.username} (ID: ${user.id}, documentId: ${user.documentId})` : "No user data")
      console.log("Token available:", token ? "Yes" : "No")
      console.log("Token in localStorage:", localStorage.getItem("jwt") ? "Yes" : "No")

      // Create a FormData object to send to the server
      const formData = new FormData()

      // Add basic post data
      formData.append("title", "Untitled Post") // You can add a title field if needed
      formData.append("description", content)

      // Determine the content type based on what's being posted
      let contentType: ContentType
      if (mediaItems.length > 0) {
        contentType = mediaItems.length === 1 ? (mediaItems[0].type === "image" ? "image" : "video") : "media-gallery"
      } else {
        contentType = background ? "text-background" : "text"
      }

      formData.append("contentType", contentType)
      formData.append("galleryLayout", galleryLayout)

      // Add JWT token to ensure it's available on the server
      if (token) {
        formData.append("jwt", token)
      }

      // Add user documentId to ensure it's available on the server
      if (user?.documentId) {
        formData.append("userDocumentId", user.documentId)
      } else if (user?.id) {
        // Fallback to regular ID if documentId is not available
        formData.append("userId", user.id.toString())
      }

      // Add the full user object for debugging
      if (user) {
        formData.append("userObject", JSON.stringify(user))
      }

      // Add tags if any
      if (tags.length > 0) {
        formData.append("tags", JSON.stringify(tags))
      }

      // Add background if present
      if (background) {
        formData.append("background", JSON.stringify(background))
      }

      // Add media items if present
      if (mediaItems.length > 0) {
        // Add metadata about media items
        const mediaItemsMetadata = mediaItems.map((item) => ({
          id: item.id,
          type: item.type,
          name: item.file?.name || `file-${item.id}`,
          size: item.file?.size || 0,
          mimeType: item.file?.type || (item.type === "image" ? "image/jpeg" : "video/mp4"),
        }))
        formData.append("mediaItems", JSON.stringify(mediaItemsMetadata))

        // Add the actual files
        mediaItems.forEach((item, index) => {
          if (item.file) {
            // Use a more descriptive name for the file to help with debugging
            formData.append(`mediaFiles`, item.file, `${index}-${item.file.name}`)
          }
        })
      }

      console.log("Submitting form data to server action")

      // Submit the form using the server action
      const result = await createPost(formData)

      console.log("Server action result:", result)

      if (result.success) {
        // Create a new post object for the UI
        const newPost = {
          id: result.post.id,
          username: user?.username || "you",
          userImage: user?.profileImage?.url || "/diverse-avatars.png",
          description: content,
          likes: 0,
          comments: [],
          timestamp: "Just now",
          contentType,
          mediaItems: result.post.mediaItems || mediaItems,
          galleryLayout,
          background: background || undefined,
          tags: tags || [],
        }

        onPostCreated(newPost)
        onClose()

        toast({
          title: "Post created successfully!",
          description: "Your content has been shared with the community.",
          duration: 3000,
        })
      } else {
        console.error("Error from server:", result.error)

        // If the error is related to authentication, redirect to login
        if (result.error?.includes("Authentication required") || result.error?.includes("log in")) {
          toast({
            title: "Authentication required",
            description: "Please log in to create posts",
            variant: "destructive",
          })
          onClose()
          router.push("/auth")
        } else {
          toast({
            title: "Error creating post",
            description: result.error || "An error occurred while creating your post.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error creating post:", error)
      toast({
        title: "Error creating post",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isPostButtonDisabled = (!content.trim() && mediaItems.length === 0) || isSubmitting

  // If not authenticated, don't render the modal
  if (!isAuthenticated) {
    return null
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-4 border-b flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-center">Create Post</DialogTitle>
        </DialogHeader>

        <div className="p-4 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImage?.url || "/diverse-avatars.png"} alt="Your profile" />
              <AvatarFallback>{user?.username?.substring(0, 2).toUpperCase() || "YO"}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-sm">{user?.username || "You"}</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-4 flex-grow">
          <div className="space-y-4">
            {background ? (
              <div
                className={`rounded-lg p-4 ${background.value} ${background.animation || ""} relative min-h-[200px] flex items-center justify-center`}
              >
                <textarea
                  ref={textareaRef}
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={`w-full text-xl font-semibold resize-none border-none focus:outline-none focus:ring-0 p-0 bg-transparent text-center ${
                    background.type === "color" || background.type === "gradient" ? "text-white" : "text-black"
                  }`}
                  style={{ minHeight: "100px" }}
                />
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
              <textarea
                ref={textareaRef}
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full text-base resize-none border-none focus:outline-none focus:ring-0 p-0 overflow-hidden"
                style={{ minHeight: "100px" }}
              />
            )}

            {showBackgroundSelector && mediaItems.length === 0 && (
              <PostBackgroundSelector onSelect={handleBackgroundSelect} selectedBackground={background} />
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
                      <DropdownMenuItem onClick={() => setGalleryLayout("grid,")}>Grid</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setGalleryLayout("carousel,")}>Carousel</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setGalleryLayout("featured")}>Featured</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="w-full">
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

            {/* Tags section */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div key={tag} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder="Add a tag..."
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && currentTag.trim()) {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  className="text-xs px-2 py-1 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex-shrink-0">
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
                className={`h-9 w-9 rounded-full ${showBackgroundSelector ? "bg-gray-200 text-pink-500" : "text-pink-500"}`}
                onClick={() => setShowBackgroundSelector(!showBackgroundSelector)}
                disabled={mediaItems.length > 0}
              >
                <Palette className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-yellow-500"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-red-500">
                <MapPin className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-purple-500">
                <UserPlus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {showEmojiPicker && (
            <div className="emoji-picker-container absolute z-10 bottom-[120px] left-1/2 transform -translate-x-1/2">
              {/* Emoji picker would be rendered here */}
            </div>
          )}

          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />

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
  )
}
