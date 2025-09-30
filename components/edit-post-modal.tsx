"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, Type, Palette, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import MediaGallery from "./media-gallery"
import PostBackgroundSelector, { type BackgroundType } from "./post-background-selector"
import { updatePost } from "@/lib/post-management-actions"
import type { MediaItem, MediaGalleryLayout } from "@/types/media"
import { validateContent } from "@/lib/content-moderation"

interface EditPostModalProps {
  post: {
    id: number
    documentId?: string
    description: string
    contentType?: "image" | "video" | "text" | "text-background" | "media-gallery"
    background?: BackgroundType
    mediaItems?: MediaItem[]
    galleryLayout?: MediaGalleryLayout
    [key: string]: any
  }
  onClose: () => void
  onPostUpdated: (updatedPost: any) => void
}

export default function EditPostModal({ post, onClose, onPostUpdated }: EditPostModalProps) {
  const [description, setDescription] = useState(post.description || "")
  const [contentType, setContentType] = useState<"text" | "text-background">(
    post.contentType === "media-gallery" || post.contentType === "image" || post.contentType === "video"
      ? "text"
      : (post.contentType || "text"),
  )
  const [background, setBackground] = useState<BackgroundType | undefined>(post.background)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // Read-only media items for display only
  const existingMediaItems = post.mediaItems || post.media || []
  const hasExistingMedia = existingMediaItems.length > 0

  // Force contentType to "text" when there's existing media
  useEffect(() => {
    if (hasExistingMedia && contentType !== "text") {
      setContentType("text")
    }
  }, [hasExistingMedia, contentType])

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onClose])

  const validateContentResult = (): { isValid: boolean; errorMessage?: string } => {
    // Check description for profanity
    if (description) {
      return validateContent(description)
    }

    return { isValid: true }
  }


  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please add a description to your post",
        variant: "destructive",
      })
      return
    }

    // Validate content for profanity
    const contentValidation = validateContentResult()
    if (!contentValidation.isValid) {
      toast({
        title: "Content moderation",
        description: contentValidation.errorMessage,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const updatedPostData = {
        description,
        contentType,
        background,
      }

      // Use documentId for the update, fallback to id
      const postIdentifier = post.documentId || post.id?.toString()
      if (!postIdentifier) {
        throw new Error("No post identifier found")
      }

      const result = await updatePost(postIdentifier, updatedPostData)

      if (result.success) {
        toast({
          title: "Post updated",
          description: "Your post has been updated successfully",
        })
        onPostUpdated({
          ...post,
          ...updatedPostData,
        })
        onClose()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Error updating post:", error)
      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Post</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!hasExistingMedia && (
            <Tabs value={contentType} onValueChange={(v) => setContentType(v as any)} className="mb-4">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="text" className="flex items-center gap-1">
                  <Type className="h-4 w-4" />
                  <span>Text</span>
                </TabsTrigger>
                <TabsTrigger value="text-background" className="flex items-center gap-1">
                  <Palette className="h-4 w-4" />
                  <span>Background</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {hasExistingMedia && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Edit Text Only</h3>
              <p className="text-xs text-gray-500">Posts with media can only have their text edited.</p>
            </div>
          )}

          {contentType === "text-background" && !hasExistingMedia && (
            <div className="mb-4">
              <PostBackgroundSelector onSelect={setBackground} selectedBackground={background} />
            </div>
          )}

          {/* Display existing media (read-only) */}
          {hasExistingMedia && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Current Media (cannot be edited)</label>
              <div className="p-3 bg-gray-50 rounded-lg border">
                <MediaGallery
                  items={existingMediaItems}
                  layout={post.galleryLayout || "grid"}
                  maxHeight={200}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Media files cannot be modified. You can only edit the text and background.
                </p>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <Textarea
              id="description"
              placeholder="What's on your mind?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !description.trim()}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
