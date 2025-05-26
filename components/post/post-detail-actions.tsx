"use client"

import type { FC } from "react"
import { ButtonGroup, Flex, IconButton, Tooltip, useDisclosure } from "@chakra-ui/react"
import { AiOutlineShareAlt, AiOutlineHeart, AiFillHeart, AiOutlineEdit, AiOutlineDelete } from "react-icons/ai"
import { BsThreeDots } from "react-icons/bs"
import type { Post } from "@/interfaces"
import { useSession } from "next-auth/react"
import DeleteConfirmationModal from "../delete-confirmation-modal"
import { useRouter } from "next/router"
import TryOnButton from "../try-on-button"

interface Props {
  post: Post
  likePost: (postId: string) => Promise<void>
  unlikePost: (postId: string) => Promise<void>
  isLiked: boolean
  onDelete: (postId: string) => Promise<void>
}

const PostDetailActions: FC<Props> = ({ post, likePost, unlikePost, isLiked, onDelete }) => {
  const { data: session } = useSession()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const router = useRouter()

  const isOwnPost = session?.user?.email === post.userEmail

  return (
    <Flex justify="space-between" align="center" mt={4}>
      <ButtonGroup spacing="4">
        <Tooltip label={isLiked ? "Unlike" : "Like"} placement="top">
          <IconButton
            aria-label={isLiked ? "Unlike" : "Like"}
            icon={isLiked ? <AiFillHeart /> : <AiOutlineHeart />}
            colorScheme="red"
            onClick={() => {
              if (isLiked) {
                unlikePost(post._id!)
              } else {
                likePost(post._id!)
              }
            }}
          />
        </Tooltip>
        <Tooltip label="Share" placement="top">
          <IconButton aria-label="Share" icon={<AiOutlineShareAlt />} />
        </Tooltip>
        <TryOnButton
          designImageUrl={
            post.media?.[0]?.url || post.imageUrl || "/placeholder.svg?height=400&width=400&text=Nail+Design"
          }
          designTitle={post.title || post.caption || "Nail Design"}
          variant="outline"
          size="sm"
        />
      </ButtonGroup>

      {isOwnPost ? (
        <ButtonGroup spacing="2">
          <Tooltip label="Edit" placement="top">
            <IconButton
              aria-label="Edit"
              icon={<AiOutlineEdit />}
              onClick={() => router.push(`/posts/edit/${post._id}`)}
            />
          </Tooltip>
          <Tooltip label="Delete" placement="top">
            <IconButton aria-label="Delete" icon={<AiOutlineDelete />} onClick={onOpen} />
          </Tooltip>
          <DeleteConfirmationModal isOpen={isOpen} onClose={onClose} onDelete={() => onDelete(post._id!)} />
        </ButtonGroup>
      ) : (
        <Tooltip label="More" placement="top">
          <IconButton aria-label="More" icon={<BsThreeDots />} />
        </Tooltip>
      )}
    </Flex>
  )
}

export default PostDetailActions
