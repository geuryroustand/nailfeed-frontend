"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, BookmarkPlus, MoreHorizontal, Flag, Trash, Edit, Download } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePostOwnership } from "@/hooks/use-post-ownership"
import { TryOnButton } from "@/components/try-on/try-on-button"
import { ShareButton } from "@/components/share-button"
import { ReactionButton } from "@/components/reaction-button"
import { ReactionSummary } from "@/components/reaction-summary"
import { useAuth } from "@/hooks/use-auth"
import AddToCollectionDialog from "@/components/collections/add-to-collection-dialog"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import SavePostButton from "@/components/save-post-button"
import type { Post } from "@/lib/post-data"
import type { ReactionType } from "@/lib/services/reaction-service"

interface PostDetailActionsProps {
  postId?: string | number
  authorId?: string | number
  imageUrl?: string
  designTitle?: string
  onEdit?: () => void
  onDelete?: () => void
  onReport?: () => void
  // Add additional props to handle different image URL sources
  post?: Post
}



export function PostDetailActions({
  postId,
  authorId,
  imageUrl,
  designTitle = "Nail Design",
  onEdit,
  onDelete,
  onReport,
  post,
}: PostDetailActionsProps) {
  const { isOwner } = usePostOwnership(authorId)

  const { isAuthenticated } = useAuth()


  const { toast } = useToast()

  const router = useRouter()

  // Local state for userSaved to handle updates (same as in post.tsx)
  const [postUserSaved, setPostUserSaved] = useState(post?.userSaved || false);

  // Update userSaved state when post changes
  useEffect(() => {
    setPostUserSaved(post?.userSaved || false);
  }, [post?.userSaved]);

  const normalizedPostId = useMemo(() => {
    if (typeof post?.documentId === "string" && post.documentId.length > 0) {
      return post.documentId
    }

    if (typeof post?.id === "string" && post.id.length > 0) {
      return post.id
    }

    if (typeof postId === "string" && postId.length > 0) {
      return postId
    }

    if (typeof post?.id === "number" && Number.isFinite(post.id)) {
      return post.id.toString()
    }

    if (typeof postId === "number" && Number.isFinite(postId)) {
      return postId.toString()
    }

    return null
  }, [post?.documentId, post?.id, postId])

  const reactionSummaryPostId = useMemo(() => {
    if (normalizedPostId) {
      return normalizedPostId
    }

    if (typeof postId === "number" && Number.isFinite(postId)) {
      return postId
    }

    if (typeof postId === "string" && postId.length > 0) {
      return postId
    }

    if (typeof post?.id === "number" && Number.isFinite(post.id)) {
      return post.id
    }

    return null
  }, [normalizedPostId, postId, post?.id])

  const totalReactions = useMemo(() => {
    if (typeof post?.likes === "number") {
      return post.likes
    }

    if (typeof post?.likesCount === "number") {
      return post.likesCount
    }

    if (post?.reactions && post.reactions.length > 0) {
      return post.reactions.reduce((sum, reaction) => sum + (reaction.count || 0), 0)
    }

    if (Array.isArray(post?.likesList)) {
      return post.likesList.length
    }

    return 0
  }, [post?.likes, post?.likesCount, post?.reactions, post?.likesList])

  const reactionButtonDocumentId = useMemo(() => {
    if (normalizedPostId) {
      return normalizedPostId
    }

    if (typeof postId === "string" && postId.length > 0) {
      return postId
    }

    if (typeof postId === "number" && Number.isFinite(postId)) {
      return postId.toString()
    }

    if (typeof post?.id === "string" && post.id.length > 0) {
      return post.id
    }

    if (typeof post?.id === "number" && Number.isFinite(post.id)) {
      return post.id.toString()
    }

    return ""
  }, [normalizedPostId, postId, post?.id])

  const reactionButtonPostId = useMemo(() => {
    if (normalizedPostId) {
      return normalizedPostId
    }

    if (typeof postId !== "undefined" && postId !== null) {
      return postId
    }

    if (typeof post?.id !== "undefined" && post?.id !== null) {
      return post.id
    }

    return ""
  }, [normalizedPostId, postId, post?.id])

  const reactionButtonAuthorId = useMemo(() => {
    if (typeof authorId === "string" && authorId.length > 0) {
      return authorId
    }

    if (typeof authorId === "number" && Number.isFinite(authorId)) {
      return authorId.toString()
    }

    if (typeof post?.user?.documentId === "string" && post.user.documentId.length > 0) {
      return post.user.documentId
    }

    if (typeof post?.user?.id === "string" && post.user.id.length > 0) {
      return post.user.id
    }

    if (typeof post?.user?.id === "number" && Number.isFinite(post.user.id)) {
      return post.user.id.toString()
    }

    if (typeof post?.userId === "string" && post.userId.length > 0) {
      return post.userId
    }

    if (typeof post?.userId === "number" && Number.isFinite(post.userId)) {
      return post.userId.toString()
    }

    return undefined
  }, [authorId, post?.user?.documentId, post?.user?.id, post?.userId])

  const reactionButtonReactions = useMemo(() => {
    if (!Array.isArray(post?.reactions)) {
      return []
    }

    const validTypes: ReactionType[] = ["like", "love", "haha", "wow", "sad", "angry"]

    return post.reactions
      .map((reaction) => {
        const reactionType = typeof reaction.type === "string" ? (reaction.type.toLowerCase() as ReactionType) : undefined

        if (!reactionType || !validTypes.includes(reactionType)) {
          return null
        }

        return {
          type: reactionType,
          emoji: reaction.emoji,
          count: reaction.count,
        }
      })
      .filter((reaction): reaction is { type: ReactionType; emoji: string; count: number } => reaction !== null)
  }, [post?.reactions])

  const normalizedUserReaction = useMemo<ReactionType | null>(() => {
    if (!post?.userReaction) {
      return null
    }

    const rawValue = typeof post.userReaction === "string" ? post.userReaction : (post.userReaction as { type?: string })?.type

    if (!rawValue || typeof rawValue !== "string") {
      return null
    }

    const value = rawValue.toLowerCase() as ReactionType
    const validTypes: ReactionType[] = ["like", "love", "haha", "wow", "sad", "angry"]

    return validTypes.includes(value) ? value : null
  }, [post?.userReaction])


  const handleCollectionAdded = useCallback((collectionName: string) => {

    toast({

      title: "Saved to collection",

      description: `Added to ${collectionName}`

    })

  }, [toast])

  const collectionPostTitle = post?.imageUrl || post?.image || designTitle

  // Handle save state change from SavePostButton
  const handleSaveStateChange = useCallback((postId: number, isSaved: boolean) => {
    setPostUserSaved(isSaved);
  }, []);

  const handleDownload = () => {

    const finalImageUrl = getValidImageUrl()

    if (finalImageUrl && !finalImageUrl.includes("placeholder.svg")) {

      const link = document.createElement("a")

      link.href = finalImageUrl

      link.download = `nail-design-${postId}.jpg`

      document.body.appendChild(link)

      link.click()

      document.body.removeChild(link)

    }

  }



  // Function to extract valid image URL from various possible sources

  const getValidImageUrl = (): string => {

    // Debug logging

    console.log("PostDetailActions - Extracting image URL from:", {

      imageUrl,

      post,

      postImageUrl: post?.imageUrl,

      postMedia: post?.media,

      postImage: post?.image,

      postImages: post?.images,

    })



    // Try different sources in order of preference

    const possibleUrls = [imageUrl, post?.imageUrl, post?.media?.[0]?.url, post?.image, post?.images?.[0]].filter(

      Boolean,

    ) // Remove falsy values



    console.log("PostDetailActions - Possible URLs found:", possibleUrls)



    // Return the first valid URL or fallback

    const validUrl = possibleUrls[0] || "/placeholder.svg?height=400&width=400&text=Nail+Design"

    console.log("PostDetailActions - Selected image URL:", validUrl)



    return validUrl

  }



  const finalImageUrl = getValidImageUrl()



  return (

    <div className="px-4 sm:px-6 pb-4 sm:pb-6">

      <div className="mb-4">
        {reactionSummaryPostId ? (
          <ReactionSummary
            postId={reactionSummaryPostId}
            showViewButton={true}
            className="cursor-pointer"
            reactions={post?.reactions}
            totalCount={totalReactions}
          />
        ) : null}
      </div>



      <div className="flex items-center justify-between py-4 border-t border-b">

        <div className="flex items-center space-x-2 flex-1">

          <ReactionButton
            postId={reactionButtonPostId}
            postDocumentId={reactionButtonDocumentId}
            postAuthorId={reactionButtonAuthorId}
            reactions={reactionButtonReactions}
            likesCount={totalReactions}
            userReaction={normalizedUserReaction}
            onReactionChange={(type) => {
              console.log("[v0] Reaction changed to:", type)
            }}
            showCount={false}
            className="flex-1 justify-center"
          />



          <Button variant="ghost" size="icon" aria-label="Comment" className="flex-1 justify-center">

            <MessageCircle className="h-5 w-5 mr-2" />

            <span className="text-sm font-medium hidden md:inline-block">Comment</span>

          </Button>

          <SavePostButton
            postId={typeof post?.id === 'number' ? post.id : parseInt((post?.id || postId)?.toString() || '0')}
            postDocumentId={post?.documentId || (typeof postId === 'string' ? postId : undefined)}
            userSaved={postUserSaved}
            onSaveStateChange={handleSaveStateChange}
            variant="ghost"
            size="default"
            className="flex-1 justify-center py-2 h-auto"
            showLabel={true}
          />

          <div className="flex-1 flex justify-center">

            <ShareButton url={`/post/${postId}`} title={designTitle} />

          </div>

        </div>



        <div className="flex items-center space-x-2 ml-4">

          <TryOnButton designImageUrl={finalImageUrl} designTitle={designTitle} variant="outline" size="sm" />



          {isAuthenticated && normalizedPostId !== null ? (

            <AddToCollectionDialog

              postId={normalizedPostId}

              postTitle={collectionPostTitle}

              onCollectionAdded={handleCollectionAdded}

              trigger={

                <Button

                  variant="ghost"

                  className={`flex-1 justify-center gap-2 ${postUserSaved ? "text-pink-500" : ""}`}

                  aria-label={postUserSaved ? "Manage collections" : "Save to collection"}

                >

                  <BookmarkPlus className="h-5 w-5" />

                  <span className="text-sm font-medium hidden md:inline-block">

                    {postUserSaved ? "Manage Collections" : "Save Collection"}

                  </span>

                </Button>

              }

            />

          ) : (

            <Button

              variant="ghost"

              className="flex-1 justify-center gap-2"

              aria-label="Save to collection"

              onClick={() => router.push("/auth")}

            >

              <BookmarkPlus className="h-5 w-5" />

              <span className="text-sm font-medium hidden md:inline-block">Save Collection</span>

            </Button>

          )}



          <DropdownMenu>

            <DropdownMenuTrigger asChild>

              <Button variant="ghost" size="icon" aria-label="More options">

                <MoreHorizontal className="h-5 w-5" />

              </Button>

            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">

              {isAuthenticated && normalizedPostId !== null && (

                <>

                  <AddToCollectionDialog

                    postId={normalizedPostId}

                    postTitle={collectionPostTitle}

                    onCollectionAdded={handleCollectionAdded}

                    trigger={

                      <DropdownMenuItem

                        className="flex items-center"

                        onSelect={(event) => event.preventDefault()}

                      >

                        <BookmarkPlus className="h-4 w-4 mr-2" />

                        {postUserSaved ? "Manage Collections" : "Add to Collection"}

                      </DropdownMenuItem>

                    }

                  />

                  <DropdownMenuSeparator />

                </>

              )}

              {finalImageUrl && !finalImageUrl.includes("placeholder.svg") && (

                <DropdownMenuItem onClick={handleDownload}>

                  <Download className="h-4 w-4 mr-2" />

                  Download

                </DropdownMenuItem>

              )}



              {isOwner && (

                <>

                  {onEdit && (

                    <DropdownMenuItem onClick={onEdit}>

                      <Edit className="h-4 w-4 mr-2" />

                      Edit

                    </DropdownMenuItem>

                  )}



                  {onDelete && (

                    <DropdownMenuItem onClick={onDelete} className="text-red-500">

                      <Trash className="h-4 w-4 mr-2" />

                      Delete

                    </DropdownMenuItem>

                  )}



                  <DropdownMenuSeparator />

                </>

              )}



              {!isOwner && onReport && (

                <DropdownMenuItem onClick={onReport}>

                  <Flag className="h-4 w-4 mr-2" />

                  Report

                </DropdownMenuItem>

              )}

            </DropdownMenuContent>

          </DropdownMenu>

        </div>

      </div>

    </div>

  )

}



// Add default export

export default PostDetailActions

