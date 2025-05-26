"use client"

import type React from "react"
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Image,
  Text,
  Box,
} from "@chakra-ui/react"
import type { Post } from "@/types"
import TryOnButton from "../shared/try-on-button"

interface PostDetailModalProps {
  isOpen: boolean
  onClose: () => void
  post: Post | null
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ isOpen, onClose, post }) => {
  if (!post) {
    return null
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{post.title || post.caption || "Nail Design"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Image
            src={
              post.media?.[0]?.url ||
              post.imageUrl ||
              post.image ||
              "/placeholder.svg?height=400&width=400&text=Nail+Design"
            }
            alt={post.title || post.caption || "Nail Design"}
            width="100%"
            borderRadius="md"
            mb={4}
          />
          <Text mb={2}>{post.caption}</Text>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Text fontWeight="bold">Uploaded by: {post.userId}</Text>
            <TryOnButton
              designImageUrl={
                post.media?.[0]?.url ||
                post.imageUrl ||
                post.image ||
                "/placeholder.svg?height=400&width=400&text=Nail+Design"
              }
              designTitle={post.title || post.caption || "Nail Design"}
              variant="secondary"
              size="sm"
            />
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default PostDetailModal
