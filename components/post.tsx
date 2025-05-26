"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardMedia, IconButton, Typography, Box } from "@mui/material"
import { MoreVert } from "@mui/icons-material"
import { useRouter } from "next/router"
import { useSession } from "next-auth/react"
import type { Post as PostType } from "@/types"
import PostDetailActions from "./PostDetailActions"
import EditPostModal from "./EditPostModal"
import DeleteConfirmationModal from "./DeleteConfirmationModal"

interface PostProps {
  post: PostType
}

const Post: React.FC<PostProps> = ({ post }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  console.log("Post component - Post data:", {
    post,
    postId: post?.id,
    imageUrl: post?.imageUrl,
    image: post?.image,
    media: post?.media,
    images: post?.images,
  })

  const handleCardClick = () => {
    router.push(`/posts/${post.id}`)
  }

  return (
    <Card sx={{ maxWidth: 345, margin: "16px" }}>
      <CardHeader
        action={
          session?.user?.id === post.author?.id || session?.user?.id === post.userId ? (
            <IconButton aria-label="settings">
              <MoreVert />
            </IconButton>
          ) : null
        }
        title={post.title || post.caption || "Nail Design"}
        subheader={post.author?.name || "Unknown Author"}
      />
      <CardMedia
        component="img"
        height="194"
        image={post.imageUrl || post.image || post.media?.[0]?.url || "/placeholder-image.png"}
        alt={post.title || post.caption || "Nail Design"}
        onClick={handleCardClick}
        style={{ cursor: "pointer" }}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {post.caption || "No caption provided."}
        </Typography>
      </CardContent>
      <Box sx={{ display: "flex", alignItems: "center", pl: 1, pb: 1 }}>
        <PostDetailActions
          postId={post.id}
          authorId={post.author?.id || post.userId || ""}
          imageUrl={post.imageUrl || post.image || post.media?.[0]?.url}
          designTitle={post.title || post.caption || "Nail Design"}
          post={post} // Make sure to pass the entire post object
          onEdit={() => setIsEditModalOpen(true)}
          onDelete={() => setIsDeleteModalOpen(true)}
        />
      </Box>
      <EditPostModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} post={post} />
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        postId={post.id}
      />
    </Card>
  )
}

export default Post
