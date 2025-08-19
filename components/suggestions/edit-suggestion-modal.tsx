"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateSuggestion, type Suggestion } from "@/app/actions/suggestion-actions"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface EditSuggestionModalProps {
  isOpen: boolean
  onClose: () => void
  suggestion: {
    documentId: string
    title: string
    description: string
  }
  onSuggestionUpdated?: (updatedSuggestion: Suggestion) => void
}

export function EditSuggestionModal({ isOpen, onClose, suggestion, onSuggestionUpdated }: EditSuggestionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      const title = formData.get("title") as string
      const description = formData.get("description") as string

      const optimisticUpdate = {
        ...suggestion,
        title,
        description,
        updatedAt: new Date().toISOString(),
      } as Suggestion

      const result = await updateSuggestion(suggestion.documentId, formData)

      if (result.success) {
        toast.success("Suggestion updated successfully!")
        onClose()
        onSuggestionUpdated?.(result.data || optimisticUpdate)
      } else {
        toast.error(result.error || "Failed to update suggestion")
      }
    } catch (error) {
      console.error("Error updating suggestion:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Suggestion</DialogTitle>
          <DialogDescription>
            Update your suggestion details. Make sure to provide clear and helpful information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={suggestion.title}
              placeholder="Enter suggestion title"
              required
              maxLength={100}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={suggestion.description}
              placeholder="Describe your suggestion in detail"
              required
              maxLength={500}
              rows={4}
              className="w-full resize-none"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Suggestion"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
