"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GridIcon, Heart, MessageCircle, Palette, Award, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Post, Collection } from "@/lib/profile-data"
import { likePost, addComment, addToCollection } from "@/lib/profile-actions"
import Link from "next/link"
import { getPosts } from "@/lib/post-data"

interface ProfileGalleryClientProps {
  username?: string
  posts?: (Post & { formattedDate?: string })[]
  collections?: Collection[]
}

export function ProfileGalleryClient({ username, posts: initialPosts, collections = [] }: ProfileGalleryClientProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [activeTab, setActiveTab] = useState("featured")
  const [viewMode, setViewMode] = useState<"grid" | "masonry" | "list">("masonry")
  const [comment, setComment] = useState("")
  const { toast } = useToast()
  const [posts, setPosts] = useState<(Post & { formattedDate?: string })[]>(initialPosts || [])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!initialPosts) {
      const fetchPosts = async () => {
        setIsLoading(true)
        try {
          // Use the existing getPosts function instead of getUserPosts
          const response = await getPosts(10, 0)
          // Filter posts by username if provided
          const userPosts = username ? response.posts.filter((post) => post.username === username) : response.posts

          setPosts(userPosts as Post[])
        } catch (error) {
          console.error("Error fetching posts:", error)
          toast({
            title: "Error",
            description: "Failed to load posts",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }

      fetchPosts()
    }
  }, [username, toast, initialPosts])

  const getPostsForTab = () => {
    switch (activeTab) {
      case "featured":
        return posts.filter((post) => (post as any).featured)
      case "collections":
        return []
      case "all":
      default:
        return posts
    }
  }

  const handleLike = async (post: Post) => {
    try {
      const result = await likePost(post.id)
      if (result.success) {
        toast({
          title: "Post liked!",
          description: `This post now has ${result.newLikeCount} likes.`,
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to like post",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const handleComment = async (post: Post) => {
    if (!comment.trim()) return

    try {
      const result = await addComment(post.id, comment)
      if (result.success) {
        setComment("")
        toast({
          title: "Comment added!",
          description: "Your comment has been added successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to add comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  const handleAddToCollection = async (post: Post, collectionId: number) => {
    try {
      const result = await addToCollection(post.id, collectionId)
      if (result.success) {
        toast({
          title: "Added to collection",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to add to collection",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="bg-gray-100 p-1 rounded-lg h-10 w-64 animate-pulse"></div>
          <div className="bg-gray-100 p-1 rounded-lg h-8 w-24 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 py-6">
        <Tabs defaultValue="featured" className="w-full" onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList className="bg-gray-100 p-1 rounded-lg">
              <TabsTrigger
                value="featured"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-pink-500 data-[state=active]:shadow-sm"
              >
                <Award className="h-4 w-4 mr-2" />
                Featured
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-pink-500 data-[state=active]:shadow-sm"
              >
                <GridIcon className="h-4 w-4 mr-2" />
                All Work
              </TabsTrigger>
              <TabsTrigger
                value="collections"
                className="rounded-md data-[state=active]:bg-white data-[state=active]:text-pink-500 data-[state=active]:shadow-sm"
              >
                <Palette className="h-4 w-4 mr-2" />
                Collections
              </TabsTrigger>
            </TabsList>

            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${viewMode === "grid" ? "bg-white text-pink-500 shadow-sm" : ""}`}
                onClick={() => setViewMode("grid")}
              >
                <GridIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${viewMode === "masonry" ? "bg-white text-pink-500 shadow-sm" : ""}`}
                onClick={() => setViewMode("masonry")}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${viewMode === "list" ? "bg-white text-pink-500 shadow-sm" : ""}`}
                onClick={() => setViewMode("list")}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </Button>
            </div>
          </div>

          <TabsContent value="featured" className="mt-0">
            {viewMode === "masonry" && (
              <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {getPostsForTab().map((post, index) => (
                  <MasonryItem key={post.id} post={post} index={index} onClick={() => setSelectedPost(post)} />
                ))}
              </div>
            )}

            {viewMode === "grid" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {getPostsForTab().map((post, index) => (
                  <GridItem key={post.id} post={post} index={index} onClick={() => setSelectedPost(post)} />
                ))}
              </div>
            )}

            {viewMode === "list" && (
              <div className="space-y-4">
                {getPostsForTab().map((post, index) => (
                  <ListItem key={post.id} post={post} index={index} onClick={() => setSelectedPost(post)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            {viewMode === "masonry" && (
              <div className="columns-2 md:columns-3 gap-4 space-y-4">
                {getPostsForTab().map((post, index) => (
                  <MasonryItem key={post.id} post={post} index={index} onClick={() => setSelectedPost(post)} />
                ))}
              </div>
            )}

            {viewMode === "grid" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {getPostsForTab().map((post, index) => (
                  <GridItem key={post.id} post={post} index={index} onClick={() => setSelectedPost(post)} />
                ))}
              </div>
            )}

            {viewMode === "list" && (
              <div className="space-y-4">
                {getPostsForTab().map((post, index) => (
                  <ListItem key={post.id} post={post} index={index} onClick={() => setSelectedPost(post)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="collections" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {collections?.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="h-40 overflow-hidden">
                    <img
                      src={collection.cover || "/placeholder.svg"}
                      alt={collection.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{collection.name}</h3>
                    <p className="text-sm text-gray-500">{collection.count} designs</p>
                    <Button variant="outline" size="sm" className="mt-2 w-full">
                      View Collection
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={() => handleLike(selectedPost)}
          onComment={() => handleComment(selectedPost)}
          onAddToCollection={(collectionId) => handleAddToCollection(selectedPost, collectionId)}
          collections={collections}
          comment={comment}
          setComment={setComment}
        />
      )}
    </>
  )
}

interface PostItemProps {
  post: Post
  index: number
  onClick: () => void
}

function MasonryItem({ post, index, onClick }: PostItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="mb-4 break-inside-avoid"
      onClick={onClick}
    >
      <Link href={`/post/${post.id}`}>
        <div className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
          <div className="relative">
            <img
              src={post.image || "/placeholder.svg"}
              alt={post.title}
              className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
              <div className="p-3 w-full">
                <div className="flex justify-between items-center text-white">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">{post.likes}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">{post.comments}</span>
                  </div>
                </div>
              </div>
            </div>
            {post.featured && <Badge className="absolute top-2 right-2 bg-pink-500">Featured</Badge>}
          </div>
          <div className="p-2">
            <h3 className="font-medium text-sm">{post.title}</h3>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function GridItem({ post, index, onClick }: PostItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <Link href={`/post/${post.id}`}>
        <div className="relative aspect-square">
          <img
            src={post.image || "/placeholder.svg"}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
            <div className="p-3 w-full">
              <h3 className="font-medium text-white">{post.title}</h3>
              <div className="flex justify-between items-center text-white mt-1">
                <div className="flex items-center space-x-1">
                  <Heart className="h-3 w-3" />
                  <span className="text-xs">{post.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="h-3 w-3" />
                  <span className="text-xs">{post.comments}</span>
                </div>
              </div>
            </div>
          </div>
          {post.featured && <Badge className="absolute top-2 right-2 bg-pink-500">Featured</Badge>}
        </div>
      </Link>
    </motion.div>
  )
}

function ListItem({ post, index, onClick }: PostItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex bg-gray-50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <Link href={`/post/${post.id}`} className="flex w-full">
        <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
          <img src={post.image || "/placeholder.svg"} alt={post.title} className="w-full h-full object-cover" />
        </div>
        <div className="p-3 flex flex-col justify-between flex-1">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="font-medium">{post.title}</h3>
              {post.featured && <Badge className="bg-pink-500 ml-2">Featured</Badge>}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Created {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "2 weeks ago"}
            </p>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4 text-pink-500" />
                <span className="text-xs">{post.likes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <span className="text-xs">{post.comments}</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              View
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

interface PostDetailModalProps {
  post: Post
  onClose: () => void
  onLike: () => void
  onComment: () => void
  onAddToCollection: (collectionId: number) => void
  collections: Collection[]
  comment: string
  setComment: (comment: string) => void
}

function PostDetailModal({
  post,
  onClose,
  onLike,
  onComment,
  onAddToCollection,
  collections,
  comment,
  setComment,
}: PostDetailModalProps) {
  const [showCollections, setShowCollections] = useState(false)

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="p-0 max-w-5xl w-[95vw] md:w-[90vw] h-[90vh] md:h-[80vh] flex flex-col md:flex-row overflow-hidden rounded-xl">
        {/* Left side - Image */}
        <div className="relative w-full md:w-3/5 h-1/2 md:h-full bg-black flex items-center justify-center">
          <img
            src={post.image || "/placeholder.svg"}
            alt={post.title}
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Right side - Details */}
        <div className="w-full md:w-2/5 h-1/2 md:h-full flex flex-col bg-white">
          {/* Header */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src="/serene-woman-gaze.png" alt="nailartist" />
                  <AvatarFallback>NA</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{post.title}</h3>
                  <p className="text-sm text-gray-500">by nailartist</p>
                </div>
              </div>
              {post.featured && <Badge className="bg-pink-500">Featured</Badge>}
            </div>
          </div>

          {/* Description */}
          <div className="p-4 border-b">
            <h4 className="font-medium text-sm mb-2">About this design</h4>
            <p className="text-sm text-gray-700">
              This {post.title} design was created using gel polish and hand-painted details. Perfect for special
              occasions or when you want to make a statement!
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge variant="outline" className="text-xs bg-gray-50">
                #nailart
              </Badge>
              <Badge variant="outline" className="text-xs bg-gray-50">
                #{post.title.toLowerCase().replace(/\s+/g, "")}
              </Badge>
              <Badge variant="outline" className="text-xs bg-gray-50">
                #handpainted
              </Badge>
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 border-b">
            <div className="flex justify-between">
              <div>
                <div className="flex items-center">
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-pink-500" onClick={onLike}>
                    <Heart className="h-5 w-5 mr-1.5" />
                    <span className="font-medium">{post.likes} likes</span>
                  </Button>
                </div>
                <div className="flex items-center mt-1">
                  <MessageCircle className="h-5 w-5 text-blue-500 mr-1.5" />
                  <span className="font-medium">{post.comments} comments</span>
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                <span>Posted {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "2 weeks ago"}</span>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="flex-1 overflow-y-auto p-4">
            <h4 className="font-medium text-sm mb-3">Comments</h4>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={`/diverse-profiles.png`} alt={`commenter ${i}`} />
                    <AvatarFallback>U{i}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-sm font-medium">user{i + 1}</p>
                      <p className="text-sm">This design is absolutely stunning! I love the colors and details.</p>
                    </div>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <button className="mr-3">Like</button>
                      <button className="mr-3">Reply</button>
                      <span>3d ago</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <div className="mt-4 flex items-start space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/serene-woman-gaze.png" alt="You" />
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex flex-col">
                <textarea
                  className="w-full p-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500"
                  placeholder="Add a comment..."
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
                <div className="flex justify-between mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setShowCollections(!showCollections)}
                  >
                    Save to collection
                  </Button>
                  <Button
                    size="sm"
                    className="bg-pink-500 hover:bg-pink-600 text-white"
                    onClick={onComment}
                    disabled={!comment.trim()}
                  >
                    Post
                  </Button>
                </div>

                {/* Collections dropdown */}
                {showCollections && (
                  <div className="mt-2 bg-white border rounded-lg shadow-md p-2">
                    <p className="text-xs font-medium mb-2">Save to:</p>
                    {collections?.map((collection) => (
                      <button
                        key={collection.id}
                        className="block w-full text-left p-2 text-sm hover:bg-gray-50 rounded"
                        onClick={() => {
                          onAddToCollection(collection.id)
                          setShowCollections(false)
                        }}
                      >
                        {collection.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { PostDetailModal }
