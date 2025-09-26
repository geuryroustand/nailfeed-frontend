"use client"

import { useCallback, useMemo } from "react"
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
import { useCollections } from "@/context/collections-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface PostDetailActionsProps {

  postId: string

  authorId: string

  imageUrl?: string

  designTitle?: string

  onEdit?: () => void

  onDelete?: () => void

  onReport?: () => void

  // Add additional props to handle different image URL sources

  post?: {

    id?: number

    documentId?: string

    imageUrl?: string

    media?: Array<{ url: string }>

    image?: string

    images?: string[]

    likes?: Array<{

      id: number

      documentId: string

      type: string

      user?: {

        id: number

        documentId: string

        username: string

      }

    }>

  }

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

  const { isSaved } = useCollections()

  const { toast } = useToast()

  const router = useRouter()

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

    return null

  }, [post?.documentId, post?.id, postId])

  const isPostSaved = normalizedPostId !== null ? isSaved(normalizedPostId) : false

  const handleCollectionAdded = useCallback((collectionName: string) => {

    toast({

      title: "Saved to collection",

      description: `Added to ${collectionName}`

    })

  }, [toast])

  const collectionPostTitle = post?.imageUrl || post?.image || designTitle



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

        <ReactionSummary

          postId={post?.documentId || postId}

          showViewButton={true}

          className="cursor-pointer"

          likes={post?.likes}

        />

      </div>



      <div className="flex items-center justify-between py-4 border-t border-b">

        <div className="flex items-center space-x-2 flex-1">

          <ReactionButton

            postId={post?.documentId || postId}

            postDocumentId={post?.documentId || postId}

            postAuthorId={authorId}

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

                  className={`flex-1 justify-center gap-2 ${isPostSaved ? "text-pink-500" : ""}`}

                  aria-label={isPostSaved ? "Manage collections" : "Save to collection"}

                >

                  <BookmarkPlus className="h-5 w-5" />

                  <span className="text-sm font-medium hidden md:inline-block">

                    {isPostSaved ? "Manage collections" : "Save"}

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

              <span className="text-sm font-medium hidden md:inline-block">Save</span>

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

                        {isPostSaved ? "Manage collections" : "Add to collection"}

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

