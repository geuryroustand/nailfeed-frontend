"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { contentFlagsService, type ReportReason } from "@/lib/services/content-flags-service"
import { Flag, AlertTriangle, Loader2 } from "lucide-react"

interface ReportContentModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  contentType: "post" | "comment"
  contentId: string // documentId of the content
  contentTitle?: string // For display purposes
  contentAuthor?: string // For display purposes
}

// Simplified report reasons for better UX
const REPORT_REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "spam", label: "Spam or repetitive content" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "offensive", label: "Offensive language" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "misinformation", label: "False information" },
  { value: "adult_content", label: "Adult/NSFW content" },
  { value: "copyright", label: "Copyright violation" },
  { value: "other", label: "Something else" }
]

export function ReportContentModal({
  isOpen,
  onOpenChange,
  contentType,
  contentId,
  contentTitle,
  contentAuthor
}: ReportContentModalProps) {
  const [reason, setReason] = useState<ReportReason | "">("")
  const [description, setDescription] = useState("")
  const [reporterEmail, setReporterEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reason) {
      toast({
        title: "Please select a reason",
        description: "You must select a reason for reporting this content.",
        variant: "destructive",
      })
      return
    }

    // For anonymous users, email is required
    if (!isAuthenticated && !reporterEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please provide your email address to submit the report.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      let result

      if (contentType === "post") {
        result = await contentFlagsService.reportPost(
          contentId,
          reason,
          description.trim() || undefined,
          !isAuthenticated ? reporterEmail.trim() : undefined
        )
      } else {
        result = await contentFlagsService.reportComment(
          contentId,
          reason,
          description.trim() || undefined,
          !isAuthenticated ? reporterEmail.trim() : undefined
        )
      }

      if (result.success) {
        toast({
          title: "Report submitted",
          description: `Thank you for reporting this ${contentType}. Our moderation team will review it.`,
        })

        // Reset form and close modal
        setReason("")
        setDescription("")
        setReporterEmail("")
        onOpenChange(false)
      } else {
        toast({
          title: "Failed to submit report",
          description: result.error || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting report:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      // Reset form when closing
      setReason("")
      setDescription("")
      setReporterEmail("")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Flag className="h-4 w-4 text-red-500" />
            Report {contentType}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            Help us keep the community safe by reporting inappropriate content.
            {contentTitle && (
              <div className="mt-3 p-2.5 bg-gray-50 rounded-md border">
                <p className="text-xs font-medium text-gray-900 mb-1">
                  {contentType === "post" ? "Post" : "Comment"}
                  {contentAuthor && (
                    <span className="text-gray-600 font-normal"> by {contentAuthor}</span>
                  )}
                </p>
                {contentTitle && (
                  <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                    "{contentTitle}"
                  </p>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">What's the issue? *</Label>
            <RadioGroup value={reason} onValueChange={(value: ReportReason) => setReason(value)} className="space-y-2">
              {REPORT_REASONS.map((reasonOption) => (
                <div key={reasonOption.value} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50">
                  <RadioGroupItem
                    value={reasonOption.value}
                    id={reasonOption.value}
                    className="flex-shrink-0"
                  />
                  <Label
                    htmlFor={reasonOption.value}
                    className="text-sm font-normal cursor-pointer flex-1 leading-tight"
                  >
                    {reasonOption.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {!isAuthenticated && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Your email address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                disabled={isSubmitting}
                required={!isAuthenticated}
                className="text-sm"
              />
              <p className="text-xs text-gray-500">
                Required for anonymous reports. Won't be shared or used for spam.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">More details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Tell us more about the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[60px] text-sm resize-none"
              maxLength={300}
              disabled={isSubmitting}
            />
            <div className="text-right text-xs text-gray-400">
              {description.length}/300
            </div>
          </div>

          {reason && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-md">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                False reports may result in account restrictions. Only report content that violates our guidelines.
              </p>
            </div>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="w-full sm:w-auto text-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!reason || isSubmitting || (!isAuthenticated && !reporterEmail.trim())}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
