"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { X, ImageIcon, Video, Type, Palette, Loader2 } from "lucide-react"
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
  const [contentType, setContentType] = useState<"text" | "text-background" | "media-gallery">(
    post.contentType || "text",
  )
  const [background, setBackground] = useState<BackgroundType | undefined>(post.background)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(post.mediaItems || [])
  const [galleryLayout, setGalleryLayout] = useState<MediaGalleryLayout>(post.galleryLayout || "grid")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

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
        id: post.id,
        description,
        contentType,
        background,
        mediaItems,
        galleryLayout,
      }

      const result = await updatePost(updatedPostData)

      if (result.success) {
        toast({
          title: "Post updated",
          description: "Your post has been updated successfully",
        })
        onPostUpdated(result.post)
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
          <Tabs value={contentType} onValueChange={(v) => setContentType(v as any)} className="mb-4">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="text" className="flex items-center gap-1">
                <Type className="h-4 w-4" />
                <span>Text</span>
              </TabsTrigger>
              <TabsTrigger value="text-background" className="flex items-center gap-1">
                <Palette className="h-4 w-4" />
                <span>Background</span>
              </TabsTrigger>
              <TabsTrigger value="media-gallery" className="flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                <span>Media</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {contentType === "text-background" && (
            <div className="mb-4">
              <PostBackgroundSelector value={background} onChange={setBackground} />
            </div>
          )}

          {contentType === "media-gallery" && (
            <div className="mb-4">
              <div className="mb-2">
                <label className="block text-sm font-medium mb-1">Media Gallery</label>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant={galleryLayout === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGalleryLayout("grid")}
                    className="flex-1"
                  >
                    Grid
                  </Button>
                  <Button
                    type="button"
                    variant={galleryLayout === "carousel" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGalleryLayout("carousel")}
                    className="flex-1"
                  >
                    Carousel
                  </Button>
                </div>
              </div>

              {mediaItems.length > 0 && (
                <div className="mb-4">
                  <MediaGallery items={mediaItems} layout={galleryLayout} maxHeight={300} />
                </div>
              )}

              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-dashed"
                  onClick={() => {
                    // In a real app, this would open a file picker
                    // For demo purposes, we'll just add a placeholder image
                    setMediaItems([
                      ...mediaItems,
                      {
                        id: `new-image-${Date.now()}`,
                        type: "image",
                        url: "/vibrant-geometric-nails.png",
                      },
                    ])
                  }}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-dashed"
                  onClick={() => {
                    // In a real app, this would open a file picker
                    // For demo purposes, we'll just add a placeholder video
                    setMediaItems([
                      ...mediaItems,
                      {
                        id: `new-video-${Date.now()}`,
                        type: "video",
                        url: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
                      },
                    ])
                  }}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
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
