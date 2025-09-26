"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Reply, Trash2, Flag, AlertTriangle, Pencil, Check, X, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Comment } from "@/lib/services/comments-service"
import { ReportContentModal } from "@/components/report-content-modal"
import Image from "next/image"

interface CommentItemProps {
  comment: Comment
  onReply: (comment: Comment) => void
  onDelete: (commentDocumentId: string) => void
  onReport?: (commentDocumentId: string, reason: string) => void
  onEdit: (commentDocumentId: string, newContent: string) => void
}

const getNameInitials = (name: string): string => {
  if (!name || name === "Anonymous") {
    return "AN"
  }

  // For names with spaces (first and last name)
  if (name.includes(" ")) {
    const nameParts = name.split(" ")
    const initials = (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
    return initials
  }

  // For single names or usernames
  if (name.length >= 2) {
    const initials = name.substring(0, 2).toUpperCase()
    return initials
  }

  // For very short names
  return name.toUpperCase()
}

export function CommentItem({ comment, onReply, onDelete, onReport, onEdit }: CommentItemProps) {
  const { user } = useAuth()
  const [showReportModal, setShowReportModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(comment.content)
  const [isExpanded, setIsExpanded] = useState(true)
  const [showImageModal, setShowImageModal] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)
  const [avatarError, setAvatarError] = useState(false)

  const isAuthor =
    user &&
    comment.author &&
    (String(user.id) === String(comment.author.id) ||
      user.username === comment.author.name ||
      user.email === comment.author.email)

  const formattedDate = comment.createdAt
    ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
    : "recently"

  // Count replies recursively
  const countReplies = (comment: Comment): number => {
    if (!comment.children || !Array.isArray(comment.children) || comment.children.length === 0) {
      return 0
    }

    return comment.children.reduce((count, child) => {
      return count + 1 + countReplies(child)
    }, 0)
  }

  const replyCount = countReplies(comment)

  // Focus the input when entering edit mode
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [isEditing])

  const getImageUrl = (url: string): string => {
    if (!url) return ""
    if (url.startsWith("http://") || url.startsWith("https://")) return url
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
    const baseUrl = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl
    return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`
  }

  const avatarUrl = !avatarError ? comment.author?.avatar : undefined


  const handleEdit = () => {
    setIsEditing(true)
    setEditedContent(comment.content)
  }

  const handleSaveEdit = () => {
    if (editedContent.trim()) {
      onEdit(comment.documentId, editedContent)
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedContent(comment.content)
  }

  const handleConfirmDelete = () => {
    onDelete(comment.documentId)
    setShowDeleteDialog(false)
  }

  const toggleReplies = () => {
    setIsExpanded(!isExpanded)
  }

  // Skip rendering if comment is blocked
  if (comment.blocked) {
    return (
      <div className="mb-4 last:mb-0 pl-4 py-2 text-sm text-gray-500 italic">
        This comment has been blocked by a moderator.
      </div>
    )
  }

  return (
    <div className="mb-4 last:mb-0">
      <div className="flex gap-2">
        <div className="relative h-8 w-8 flex-shrink-0 rounded-full bg-pink-100 text-pink-800 text-[10px] font-bold flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${comment.author?.name || "Anonymous"} profile picture`}
              fill
              className="object-cover"
              sizes="32px"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <span>{getNameInitials(comment.author?.name || "Anonymous")}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-gray-50 rounded-lg p-2 mb-1">
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{comment.author?.name || "Anonymous"}</span>
                <span className="text-xs text-gray-500">{formattedDate}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onReply(comment)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </DropdownMenuItem>

                  {isAuthor && (
                    <>
                      <DropdownMenuItem onClick={handleEdit}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-500">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Report option - always visible for everyone */}
                  <DropdownMenuItem onClick={() => setShowReportModal(true)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {isEditing ? (
              <div className="flex flex-col gap-2">
                <Input
                  ref={editInputRef}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="text-sm"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 px-2 text-xs">
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="h-7 px-2 text-xs bg-pink-500 hover:bg-pink-600"
                    disabled={!editedContent.trim() || editedContent === comment.content}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {comment.content && <p className="text-sm break-words">{comment.content}</p>}

                {comment.attachment && (
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="mt-2 block max-w-xs"
                    aria-label="View comment attachment"
                  >
                    <div className="relative w-full max-w-[160px] h-[160px] overflow-hidden rounded-lg border border-gray-200">
                      <Image
                        src={getImageUrl(comment.attachment.formats?.small?.url || comment.attachment.url)}
                        alt="Comment attachment"
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReply(comment)}
              className="h-6 text-xs text-gray-500 hover:text-pink-500"
            >
              Reply
            </Button>

            {/* Show toggle button only if there are replies */}
            {comment.children && comment.children.length > 0 && isExpanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleReplies}
                className="h-6 text-xs text-gray-500 hover:text-pink-500 flex items-center"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                {isExpanded ? "Hide" : "Show"} {replyCount} {replyCount === 1 ? "reply" : "replies"}
              </Button>
            )}
          </div>

          {/* Nested replies */}
          {comment.children && comment.children.length > 0 && isExpanded && (
            <div className="ml-4 mt-2 space-y-3 border-l-2 border-gray-100 pl-3">
              {comment.children.map((reply) => (
                <CommentItem
                  key={reply.documentId || reply.id}
                  comment={reply}
                  onReply={onReply}
                  onDelete={onDelete}
                  onReport={onReport}
                  onEdit={onEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {comment.attachment && (
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
            <DialogHeader className="sr-only">
              <DialogTitle>Comment Image</DialogTitle>
              <DialogDescription>Full size view of the comment attachment</DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center">
              <div className="relative w-full h-[80vh] max-h-[80vh]">
                <Image
                  src={getImageUrl(comment.attachment.formats?.large?.url || comment.attachment.url)}
                  alt="Comment attachment - full size"
                  fill
                  className="object-contain rounded-lg"
                  sizes="100vw"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Report Comment Modal */}
      <ReportContentModal
        isOpen={showReportModal}
        onOpenChange={setShowReportModal}
        contentType="comment"
        contentId={comment.documentId}
        contentTitle={comment.content || ""}
        contentAuthor={comment.author?.name}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
