"use client"

import { Input } from "@/components/ui/input"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useMood, type Mood } from "@/context/mood-context"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, Trash2, Share2, Lock, Globe, Heart, Bookmark, Eye, Check } from "lucide-react"
import Sidebar from "@/components/sidebar"
import BottomNav from "@/components/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

export default function MoodDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { getMoodById, deleteMood, getShareLink, updateMood } = useMood()
  const { toast } = useToast()

  const [mood, setMood] = useState<Mood | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareLink, setShareLink] = useState("")
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [isLinkCopied, setIsLinkCopied] = useState(false)
  const [savedDesigns, setSavedDesigns] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (params.id) {
      const moodId = Array.isArray(params.id) ? params.id[0] : params.id
      const foundMood = getMoodById(moodId)

      if (foundMood) {
        setMood(foundMood)
      } else {
        // Mood not found, redirect to moods page
        router.push("/moods")
      }
    }
  }, [params.id, getMoodById, router])

  const handleDeleteMood = async () => {
    if (!mood) return

    try {
      await deleteMood(mood.id)
      router.push("/moods")
    } catch (error) {
      console.error("Error deleting mood:", error)
      toast({
        title: "Error deleting mood",
        description: "There was an error deleting your mood. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShareMood = async () => {
    if (!mood) return

    setIsGeneratingLink(true)
    setShowShareDialog(true)

    try {
      const link = await getShareLink(mood.id)
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

  const handleToggleVisibility = async () => {
    if (!mood) return

    try {
      const updatedMood = await updateMood(mood.id, { isPublic: !mood.isPublic })
      setMood(updatedMood)
    } catch (error) {
      console.error("Error updating mood visibility:", error)
      toast({
        title: "Error updating visibility",
        description: "There was an error updating the mood visibility. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveDesign = (designId: number) => {
    const newSavedDesigns = new Set(savedDesigns)

    if (savedDesigns.has(designId)) {
      newSavedDesigns.delete(designId)
      toast({
        title: "Design removed",
        description: "The design has been removed from your saved items.",
      })
    } else {
      newSavedDesigns.add(designId)
      toast({
        title: "Design saved",
        description: "The design has been saved to your collection.",
      })
    }

    setSavedDesigns(newSavedDesigns)
  }

  const handleViewDesign = (designId: number) => {
    // In a real app, this would navigate to the design detail page
    router.push(`/post/${designId}`)
  }

  if (!mood) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading mood...</p>
        </div>
      </div>
    )
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
                <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.push("/moods")}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">{mood.name}</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleToggleVisibility}>
                  {mood.isPublic ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Make Private
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Make Public
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShareMood}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    <h2 className="text-lg font-semibold mb-4">Your Photo</h2>
                    <img
                      src={mood.image || "/placeholder.svg"}
                      alt={mood.name}
                      className="w-full aspect-square object-cover rounded-lg mb-4"
                    />
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Extracted Colors</h3>
                      <span className="text-xs text-gray-500">{mood.colors.length} colors</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {mood.colors.map((color, index) => (
                        <div key={index} className="flex items-center">
                          <div className="w-8 h-8 rounded-full mr-2" style={{ backgroundColor: color.color }}></div>
                          <div>
                            <div className="text-xs font-medium">{(color as any).name || color.color}</div>
                            <div className="text-xs text-gray-500">{color.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-4">
                      <div
                        className={`mr-2 px-2 py-1 rounded-full text-xs ${
                          mood.isPublic ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {mood.isPublic ? (
                          <>
                            <Globe className="h-3 w-3 inline-block mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 inline-block mr-1" />
                            Private
                          </>
                        )}
                      </div>
                      <span>Created {new Date(mood.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="md:w-2/3">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold">Matching Nail Designs</h2>
                      <span className="text-sm text-gray-500">
                        {mood.designs.length} {mood.designs.length === 1 ? "design" : "designs"} found
                      </span>
                    </div>
                    {mood.designs.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="text-gray-400 mb-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 mx-auto mb-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900">No matching designs found</h3>
                          <p className="mt-1 text-gray-500">
                            Try uploading a different photo with more distinct colors.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {mood.designs.map((design) => (
                          <motion.div
                            key={design.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-gray-50 rounded-lg overflow-hidden"
                          >
                            <div className="relative aspect-square">
                              <img
                                src={design.image || "/placeholder.svg"}
                                alt="Nail design"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
                                <div className="flex gap-2">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="rounded-full bg-white/80 backdrop-blur-sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleSaveDesign(design.id)
                                    }}
                                  >
                                    {savedDesigns.has(design.id) ? (
                                      <>
                                        <Check className="mr-1 h-4 w-4" /> Saved
                                      </>
                                    ) : (
                                      <>
                                        <Bookmark className="mr-1 h-4 w-4" /> Save
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="rounded-full bg-white/80 backdrop-blur-sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleViewDesign(design.id)
                                    }}
                                  >
                                    <Eye className="mr-1 h-4 w-4" /> View
                                  </Button>
                                </div>
                              </div>
                            </div>
                            <div className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">@{design.username}</div>
                                <div className="flex items-center text-xs text-gray-500">
                                  <Heart className="h-3 w-3 mr-1" /> {design.likes}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {design.colors.map((color) => (
                                  <div key={color} className="text-xs px-2 py-0.5 bg-gray-200 rounded-full">
                                    {color}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
          <p>Are you sure you want to delete "{mood.name}"? This action cannot be undone.</p>
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
            <DialogTitle>Share "{mood.name}"</DialogTitle>
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
                        `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(`Check out my "${mood.name}" nail mood board on NailFeed!`)}`,
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
                        `mailto:?subject=${encodeURIComponent(`Check out my "${mood.name}" nail mood board`)}&body=${encodeURIComponent(`I created a nail mood board that matches my style. Check it out: ${shareLink}`)}`,
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
