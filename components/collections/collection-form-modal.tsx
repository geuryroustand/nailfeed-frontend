"use client"

import type React from "react"

import { useState } from "react"
import type { Collection } from "@/types/collection"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface CollectionFormModalProps {
  mode: "create" | "edit"
  collection?: Collection
  onSubmit: (
    name: string,
    description: string,
    isPrivate: boolean,
    coverImageFile?: File | null,
  ) => void
  onCancel: () => void
}

export default function CollectionFormModal({ mode, collection, onSubmit, onCancel }: CollectionFormModalProps) {
  const [name, setName] = useState(collection?.name || "")
  const [description, setDescription] = useState(collection?.description || "")
  const [isPrivate, setIsPrivate] = useState(collection?.isPrivate ?? true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'creating' | 'completed'>('idle')
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit(name.trim(), description.trim(), isPrivate, coverImageFile)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create new collection" : "Edit collection"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="cover">Cover image (optional)</Label>
            {coverPreview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreview} alt="Cover preview" className="w-full h-32 object-cover rounded-md" />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => { setCoverImageFile(null); setCoverPreview(null); }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <Input
                id="cover"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null

                  // Validate file
                  if (file) {
                    const maxSize = 10 * 1024 * 1024 // 10MB
                    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

                    if (file.size > maxSize) {
                      alert('File exceeds 10MB limit. Please choose a smaller image.')
                      e.target.value = '' // Clear the input
                      return
                    }

                    if (!allowedTypes.includes(file.type)) {
                      alert('File type not supported. Please use JPG, PNG, GIF, or WebP.')
                      e.target.value = '' // Clear the input
                      return
                    }
                  }

                  setCoverImageFile(file)
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (ev) => setCoverPreview(ev.target?.result as string)
                    reader.readAsDataURL(file)
                  } else {
                    setCoverPreview(null)
                  }
                }}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Collection name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="flex flex-col">
              <Label htmlFor="private" className="cursor-pointer font-medium text-gray-900">
                {isPrivate ? "Private Collection" : "Public Collection"}
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                {isPrivate
                  ? "Only you can see this collection"
                  : "Anyone can discover and view this collection"
                }
              </p>
            </div>
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              className="data-[state=checked]:bg-pink-500 data-[state=unchecked]:bg-gray-400"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className={isSubmitting ? "bg-gradient-to-r from-pink-400 to-purple-400" : "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"}
            >
              {isSubmitting ? (
                uploadState === 'uploading' ? "Uploading..." :
                uploadState === 'creating' ? "Creating..." :
                "Saving..."
              ) : (
                mode === "create" ? "Create Collection" : "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
