"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createSuggestion } from "@/app/actions/suggestion-actions"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

interface CreateSuggestionModalProps {
  children: React.ReactNode
  onSuggestionCreated?: (suggestion: any) => void
}

export default function CreateSuggestionModal({ children, onSuggestionCreated }: CreateSuggestionModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const { user, isLoading } = useAuth()

  const handleSubmit = async (formData: FormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit suggestions.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const result = await createSuggestion(formData)

      if (result.success) {
        setIsOpen(false)
        toast({
          title: "Success!",
          description: "Your suggestion has been submitted for review.",
        })
        // Reset form
        const form = document.getElementById("suggestion-form") as HTMLFormElement
        form?.reset()

        if (onSuggestionCreated && result.data) {
          onSuggestionCreated(result.data)
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create suggestion",
          variant: "destructive",
        })
      }
    })
  }

  if (!user && !isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded">
                <Lightbulb className="h-4 w-4 text-white" />
              </div>
              Login Required
            </DialogTitle>
            <DialogDescription>Please log in to submit feature suggestions and vote on ideas.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-4">
            <Button
              onClick={() => setIsOpen(false)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            Suggest a Feature
          </DialogTitle>
          <DialogDescription>
            Share your idea for improving NailFeed. Our team reviews all suggestions!
          </DialogDescription>
        </DialogHeader>

        <form id="suggestion-form" action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" name="title" placeholder="e.g., Add dark mode support" required maxLength={100} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe your feature idea in detail..."
              required
              maxLength={500}
              rows={4}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {isPending ? "Submitting..." : "Submit Suggestion"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
