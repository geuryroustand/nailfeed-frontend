"use client"

import React, { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon, Loader2, AlertCircle, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { createOptimizedPost } from "@/app/actions/optimized-post-actions"
import type { ContentType, GalleryLayout } from "@/lib/services/post-service"
import type { BackgroundType } from "@/components/post-background-selector"

interface OptimizedPostCreationProps {
  onPostCreated?: (post: any) => void
  onClose?: () => void
  className?: string
}

interface UploadProgress {
  stage: 'idle' | 'creating-post' | 'uploading-media' | 'completed' | 'error'
  message: string
  progress: number
}

export default function OptimizedPostCreation({
  onPostCreated,
  onClose,
  className = "",
}: OptimizedPostCreationProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [contentType, setContentType] = useState<ContentType>("text")
  const [galleryLayout, setGalleryLayout] = useState<GalleryLayout>("grid")
  const [background, setBackground] = useState<BackgroundType | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    stage: 'idle',
    message: '',
    progress: 0
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { user, isAuthenticated } = useAuth()

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/')
      const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit

      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a valid image or video file`,
          variant: "destructive",
        })
        return false
      }

      if (!isValidSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB size limit`,
          variant: "destructive",
        })
        return false
      }

      return true
    })

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 10)) // Max 10 files

    // Auto-detect content type based on files
    if (validFiles.length > 0) {
      setContentType(validFiles.length > 1 ? "media-gallery" : "image")
    }
  }, [toast])

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!isAuthenticated || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a post",
        variant: "destructive",
      })
      return
    }

    if (!title.trim() && !description.trim() && selectedFiles.length === 0) {
      toast({
        title: "Content required",
        description: "Please add a title, description, or media files",
        variant: "destructive",
      })
      return
    }

    setUploadProgress({
      stage: 'creating-post',
      message: 'Creating post...',
      progress: 20
    })

    try {
      const formData = new FormData()

      // Add basic post data
      formData.append("title", title.trim())
      formData.append("description", description.trim())
      formData.append("contentType", contentType)
      formData.append("galleryLayout", galleryLayout)

      if (background) {
        formData.append("background", JSON.stringify(background))
      }

      if (tags.length > 0) {
        formData.append("tags", JSON.stringify(tags))
      }

      // Add user data
      formData.append("userDocumentId", user.documentId || String(user.id))
      formData.append("userObject", JSON.stringify(user))

      // Add media files
      if (selectedFiles.length > 0) {
        setUploadProgress({
          stage: 'uploading-media',
          message: `Uploading ${selectedFiles.length} files...`,
          progress: 50
        })

        selectedFiles.forEach((file, index) => {
          formData.append("mediaFiles", file, `${index}-${file.name}`)
        })
      }

      setUploadProgress({
        stage: 'uploading-media',
        message: 'Processing upload...',
        progress: 80
      })

      // Create post with optimized flow
      const result = await createOptimizedPost(formData)

      if (result.success) {
        setUploadProgress({
          stage: 'completed',
          message: 'Post created successfully!',
          progress: 100
        })

        toast({
          title: "Post created!",
          description: `Post uploaded with ${result.post.uploadStats?.uploadedFiles || 0} media files`,
        })

        // Reset form
        setTitle("")
        setDescription("")
        setSelectedFiles([])
        setTags([])
        setBackground(null)
        setContentType("text")

        // Notify parent component
        if (onPostCreated) {
          onPostCreated(result.post)
        }

        // Close modal if callback provided
        if (onClose) {
          setTimeout(onClose, 1000) // Brief delay to show success
        }
      } else {
        throw new Error(result.error || "Failed to create post")
      }
    } catch (error) {
      console.error("Post creation failed:", error)

      setUploadProgress({
        stage: 'error',
        message: error instanceof Error ? error.message : 'Upload failed',
        progress: 0
      })

      toast({
        title: "Post creation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    }

    // Reset progress after 3 seconds
    setTimeout(() => {
      setUploadProgress({
        stage: 'idle',
        message: '',
        progress: 0
      })
    }, 3000)
  }

  const isSubmitting = uploadProgress.stage !== 'idle' && uploadProgress.stage !== 'error'
  const isCompleted = uploadProgress.stage === 'completed'
  const hasError = uploadProgress.stage === 'error'

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.profileImage?.url} />
            <AvatarFallback>{user?.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <span>Create New Post</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title Input */}
          <div>
            <input
              type="text"
              placeholder="Add a title for your post..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
          </div>

          {/* Description Input */}
          <div>
            <textarea
              placeholder="What's on your mind?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              maxLength={2000}
            />
          </div>

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {selectedFiles.length > 0 ? (
              <div className="space-y-2">
                <p className="font-medium text-sm text-gray-700">
                  Selected files ({selectedFiles.length}/10):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                    >
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={selectedFiles.length >= 10}
                >
                  Add More Files
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 text-gray-500 hover:text-gray-700"
              >
                <ImageIcon className="h-8 w-8" />
                <span>Click to add photos or videos</span>
                <span className="text-xs">Max 10 files, 10MB each</span>
              </button>
            )}
          </div>

          {/* Upload Progress */}
          {isSubmitting && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-700">
                    {uploadProgress.message}
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {isCompleted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Check className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium text-green-700">
                  {uploadProgress.message}
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {hasError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm font-medium text-red-700">
                  {uploadProgress.message}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            {onClose && (
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting || (!title.trim() && !description.trim() && selectedFiles.length === 0)}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Post"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}