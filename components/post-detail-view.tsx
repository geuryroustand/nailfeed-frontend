"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { useAuth } from "../contexts/AuthContext"
import { MaterialIcons, AntDesign, Feather } from "@expo/vector-icons"
import ImageViewer from "react-native-image-zoom-viewer"

interface Post {
  id: string
  userId: string
  author?: {
    id?: string
    username?: string
    profilePicture?: string
  }
  title?: string
  caption?: string
  imageUrl?: string
  image?: string
  media?: [{ url: string }]
  images?: string[]
  likes?: string[]
  comments?: string[]
  createdAt?: string
}

interface PostDetailViewProps {
  post: Post
  onLike: (postId: string) => void
  onComment: (postId: string) => void
  onDeletePost: (postId: string) => void
  onEditPost: (postId: string, updatedPost: Partial<Post>) => void
}

const PostDetailActions = ({
  postId,
  authorId,
  imageUrl,
  designTitle,
  post,
  onEdit,
  onDelete,
}: {
  postId: string
  authorId: string
  imageUrl: string
  designTitle: string
  post: Post
  onEdit: () => void
  onDelete: () => void
}) => {
  const { currentUser } = useAuth()
  const navigation = useNavigation()

  const isOwnPost = currentUser?.uid === authorId

  return (
    <View style={styles.actionsContainer}>
      <TouchableOpacity onPress={() => navigation.navigate("CommentScreen", { postId })}>
        <AntDesign name="message1" size={24} color="black" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("ShareScreen", { imageUrl, designTitle })}>
        <Feather name="send" size={24} color="black" />
      </TouchableOpacity>
      {isOwnPost && (
        <View style={styles.editDeleteContainer}>
          <TouchableOpacity onPress={onEdit}>
            <MaterialIcons name="edit" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete}>
            <MaterialIcons name="delete" size={24} color="black" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const PostDetailView: React.FC<PostDetailViewProps> = ({ post, onLike, onComment, onDeletePost, onEditPost }) => {
  const { currentUser } = useAuth()
  const navigation = useNavigation()
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  console.log("PostDetailView - Post data:", {
    post,
    postId: post?.id,
    imageUrl: post?.imageUrl,
    image: post?.image,
    media: post?.media,
    images: post?.images,
  })

  const handleLike = () => {
    if (post.id) {
      onLike(post.id)
    }
  }

  const handleComment = () => {
    if (post.id) {
      onComment(post.id)
    }
  }

  const handleDelete = () => {
    if (post.id) {
      onDeletePost(post.id)
      setIsDeleteModalOpen(false)
      navigation.goBack()
    }
  }

  const handleEdit = (updatedPost: Partial<Post>) => {
    if (post.id) {
      onEditPost(post.id, updatedPost)
      setIsEditModalOpen(false)
    }
  }

  const imageUrl =
    post.imageUrl ||
    post.image ||
    post.media?.[0]?.url ||
    (post.images && post.images.length > 0 ? post.images[0] : null)
  const images = post.images ? post.images.map((uri) => ({ url: uri })) : [{ url: imageUrl }]

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => setIsImageViewerVisible(true)}>
        {imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} />}
      </TouchableOpacity>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.profileContainer}
          onPress={() => {
            if (post.author?.id) {
              navigation.navigate("UserProfile", { userId: post.author.id })
            } else if (post.userId) {
              navigation.navigate("UserProfile", { userId: post.userId })
            }
          }}
        >
          {post.author?.profilePicture ? (
            <Image source={{ uri: post.author.profilePicture }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <MaterialIcons name="person" size={24} color="black" />
            </View>
          )}
          <Text style={styles.username}>{post.author?.username || "Unknown User"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.details}>
        <Text style={styles.title}>{post.title || post.caption || "Nail Design"}</Text>
        <Text style={styles.caption}>{post.caption}</Text>
      </View>

      <PostDetailActions
        postId={post.id}
        authorId={post.author?.id || post.userId || ""}
        imageUrl={post.imageUrl || post.image || post.media?.[0]?.url}
        designTitle={post.title || post.caption || "Nail Design"}
        post={post} // Pass the entire post object
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={() => setIsDeleteModalOpen(true)}
      />

      <Modal visible={isImageViewerVisible} transparent={true} onRequestClose={() => setIsImageViewerVisible(false)}>
        <ImageViewer imageUrls={images} enableSwipeDown={true} onSwipeDown={() => setIsImageViewerVisible(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal visible={isEditModalOpen} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Edit Post</Text>
            {/* Add your edit form here */}
            <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={isDeleteModalOpen} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Are you sure you want to delete this post?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setIsDeleteModalOpen(false)} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
  },
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ddd",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  username: {
    fontWeight: "bold",
    fontSize: 16,
  },
  image: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  details: {
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  caption: {
    fontSize: 16,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  editDeleteContainer: {
    flexDirection: "row",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "gray",
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  deleteButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: "white",
  },
})

export default PostDetailView
