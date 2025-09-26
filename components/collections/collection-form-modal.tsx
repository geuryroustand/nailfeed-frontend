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

          <div className="flex items-center justify-between">
            <Label htmlFor="private" className="cursor-pointer">
              Private collection
            </Label>
            <Switch id="private" checked={isPrivate} onCheckedChange={setIsPrivate} />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
