"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useMood, type Mood } from "@/context/mood-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Plus, Grid, List, Trash2, MoreHorizontal, Eye, Share2, Lock, Globe } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Sidebar from "@/components/sidebar"
import BottomNav from "@/components/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function MoodsPage() {
  const router = useRouter()
  const { moods, deleteMood, getShareLink, updateMood } = useMood()
  const { toast } = useToast()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [moodToDelete, setMoodToDelete] = useState<string | null>(null)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [isLinkCopied, setIsLinkCopied] = useState(false)

  const filteredMoods = moods.filter((mood) => mood.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleDeleteMood = async () => {
    if (!moodToDelete) return

    try {
      await deleteMood(moodToDelete)
      setShowDeleteDialog(false)
      setMoodToDelete(null)
    } catch (error) {
      console.error("Error deleting mood:", error)
      toast({
        title: "Error deleting mood",
        description: "There was an error deleting your mood. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShareMood = async (moodId: string) => {
    setIsGeneratingLink(true)
    setShowShareDialog(true)

    try {
      const link = await getShareLink(moodId)
      setShareLink(link)
    } catch (error) {
      console.error("Error generating share link:", error)
      toast({
        title: "Error generating share link",
        description: "There was an error generating a share link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setIsLinkCopied(true)

      toast({
        title: "Link copied",
        description: "Share link copied to clipboard",
      })

      setTimeout(() => {
        setIsLinkCopied(false)
      }, 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)

      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      })
    }
  }

  const handleToggleVisibility = async (mood: Mood) => {
    try {
      await updateMood(mood.id, { isPublic: !mood.isPublic })
    } catch (error) {
      console.error("Error updating mood visibility:", error)
      toast({
        title: "Error updating visibility",
        description: "There was an error updating the mood visibility. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block md:w-64 lg:w-72 fixed h-screen border-r border-gray-200">
          <Sidebar activeItem="mood" />
        </div>

        {/* Main Content */}
        <div className="w-full md:pl-64 lg:pl-72">
          <div className="container max-w-4xl mx-auto px-4 pt-2 pb-16 md:py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.back()}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Your Moods</h1>
              </div>
              <div className="flex items-center space-x-2">
                <div className="hidden sm:flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${viewMode === "grid" ? "bg-white text-pink-500 shadow-sm" : ""}`}
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${viewMode === "list" ? "bg-white text-pink-500 shadow-sm" : ""}`}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={() => router.push("/mood")}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Mood
                </Button>
              </div>
            </div>

            <div className="mb-6">
              <Input
                placeholder="Search moods..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>

            {moods.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 bg-pink-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-pink-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold mb-2">No moods yet</h2>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Create your first mood by uploading a photo of your outfit or makeup look
                </p>
                <Button
                  onClick={() => router.push("/mood")}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create your first mood
                </Button>
              </div>
            ) : filteredMoods.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No moods found matching "{searchQuery}"</p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              </div>
            ) : (
              <div
                className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" : "space-y-4"}
              >
                {filteredMoods.map((mood) =>
                  viewMode === "grid" ? (
                    <MoodGridItem
                      key={mood.id}
                      mood={mood}
                      onDelete={() => {
                        setMoodToDelete(mood.id)
                        setShowDeleteDialog(true)
                      }}
                      onShare={() => handleShareMood(mood.id)}
                      onToggleVisibility={() => handleToggleVisibility(mood)}
                    />
                  ) : (
                    <MoodListItem
                      key={mood.id}
                      mood={mood}
                      onDelete={() => {
                        setMoodToDelete(mood.id)
                        setShowDeleteDialog(true)
                      }}
                      onShare={() => handleShareMood(mood.id)}
                      onToggleVisibility={() => handleToggleVisibility(mood)}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav - visible on mobile only */}
      <div className="md:hidden">
        <BottomNav activeTab="mood" />
      </div>

      {/* Delete Mood Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Mood</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this mood? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMood}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Mood Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Mood</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {isGeneratingLink ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-gray-500">
                  Share this link with friends to show them your mood and matching nail designs:
                </p>
                <div className="flex items-center space-x-2">
                  <Input value={shareLink} readOnly onClick={(e) => (e.target as HTMLInputElement).select()} />
                  <Button
                    variant={isLinkCopied ? "default" : "outline"}
                    size="icon"
                    onClick={handleCopyLink}
                    className={isLinkCopied ? "bg-green-500 hover:bg-green-600" : ""}
                  >
                    {isLinkCopied ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                        />
                      </svg>
                    )}
                  </Button>
                </div>
                <div className="mt-6 flex justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => {
                      window.open(
                        `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent("Check out my nail mood board on NailFeed!")}`,
                        "_blank",
                      )
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2 text-blue-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => {
                      window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
                        "_blank",
                      )
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                    </svg>
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                    onClick={() => {
                      window.open(
                        `mailto:?subject=${encodeURIComponent("Check out my nail mood board")}&body=${encodeURIComponent(`I created a nail mood board that matches my style. Check it out: ${shareLink}`)}`,
                        "_blank",
                      )
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-2 text-gray-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </main>
  )
}

interface MoodItemProps {
  mood: Mood
  onDelete: () => void
  onShare: () => void
  onToggleVisibility: () => void
}

function MoodGridItem({ mood, onDelete, onShare, onToggleVisibility }: MoodItemProps) {
  const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="h-40 overflow-hidden relative cursor-pointer" onClick={() => router.push(`/mood/${mood.id}`)}>
        <img
          src={mood.image || "/placeholder.svg"}
          alt={mood.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {!mood.isPublic && (
          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs py-1 px-2 rounded-full flex items-center">
            <Lock className="h-3 w-3 mr-1" />
            Private
          </div>
        )}
        {mood.isPublic && (
          <div className="absolute top-2 left-2 bg-blue-500/70 text-white text-xs py-1 px-2 rounded-full flex items-center">
            <Globe className="h-3 w-3 mr-1" />
            Public
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
          <div className="flex flex-wrap gap-1">
            {mood.colors.slice(0, 3).map((color, index) => (
              <div
                key={index}
                className="w-5 h-5 rounded-full border border-white"
                style={{ backgroundColor: color.color }}
              ></div>
            ))}
            {mood.colors.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-gray-800 text-white text-[10px] flex items-center justify-center border border-white">
                +{mood.colors.length - 3}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <Link href={`/mood/${mood.id}`} className="block">
            <h3 className="font-semibold text-lg">{mood.name}</h3>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/mood/${mood.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleVisibility}>
                {mood.isPublic ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Make private
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Make public
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-500">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {mood.designs.length} {mood.designs.length === 1 ? "design" : "designs"}
        </p>
        <p className="text-xs text-gray-400 mt-1">Created {new Date(mood.createdAt).toLocaleDateString()}</p>
      </div>
    </motion.div>
  )
}

function MoodListItem({ mood, onDelete, onShare, onToggleVisibility }: MoodItemProps) {
  const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex"
    >
      <div
        className="w-24 h-24 overflow-hidden relative cursor-pointer flex-shrink-0"
        onClick={() => router.push(`/mood/${mood.id}`)}
      >
        <img src={mood.image || "/placeholder.svg"} alt={mood.name} className="w-full h-full object-cover" />
        {!mood.isPublic && (
          <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[8px] py-0.5 px-1 rounded-full flex items-center">
            <Lock className="h-2 w-2 mr-0.5" />
            <span className="text-[8px]">Private</span>
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <Link href={`/mood/${mood.id}`} className="block">
              <h3 className="font-semibold">{mood.name}</h3>
            </Link>
            <div className="flex items-center space-x-1">
              {mood.isPublic ? (
                <div className="bg-blue-100 text-blue-600 text-xs py-1 px-2 rounded-full flex items-center">
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </div>
              ) : (
                <div className="bg-gray-100 text-gray-600 text-xs py-1 px-2 rounded-full flex items-center">
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center mt-1">
            <div className="flex -space-x-1 mr-2">
              {mood.colors.slice(0, 4).map((color, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full border border-white"
                  style={{ backgroundColor: color.color }}
                ></div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {mood.designs.length} {mood.designs.length === 1 ? "matching design" : "matching designs"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400">Created {new Date(mood.createdAt).toLocaleDateString()}</p>
          <div className="flex space-x-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onShare}>
              <Share2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onToggleVisibility}>
              {mood.isPublic ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
