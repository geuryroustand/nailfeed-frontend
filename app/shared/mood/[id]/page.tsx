"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { useMood, type Mood } from "@/context/mood-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Heart, Bookmark, Eye, Check } from "lucide-react"
import Header from "@/components/header"
import BottomNav from "@/components/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

export default function SharedMoodPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { moods, getMoodById } = useMood()
  const { toast } = useToast()

  const [mood, setMood] = useState<Mood | null>(null)
  const [savedDesigns, setSavedDesigns] = useState<Set<number>>(new Set())
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (params.id) {
      const moodId = Array.isArray(params.id) ? params.id[0] : params.id
      const foundMood = getMoodById(moodId)

      if (foundMood) {
        // Only allow viewing if the mood is public
        if (foundMood.isPublic) {
          setMood(foundMood)
        } else {
          // Redirect to home if mood is private
          router.push("/")
          toast({
            title: "Private mood",
            description: "This mood is private and cannot be viewed.",
            variant: "destructive",
          })
        }
      } else {
        // In a real app, you would fetch the shared mood from the backend
        // For now, we'll just redirect to home
        router.push("/")
        toast({
          title: "Mood not found",
          description: "The mood you're looking for doesn't exist or has been deleted.",
          variant: "destructive",
        })
      }
    }
  }, [params.id, getMoodById, router, toast])

  const handleSaveDesign = (designId: number) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save designs to your collection.",
      })
      return
    }

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

  const handleSaveMood = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save this mood to your collection.",
      })
      return
    }

    // In a real app, this would save the mood to the user's collection
    toast({
      title: "Mood saved",
      description: "This mood has been saved to your collection.",
    })
  }

  if (!mood) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading shared mood...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Mobile Header - visible on mobile only */}
      <div className="md:hidden">
        <Header />
      </div>

      <div className="container max-w-4xl mx-auto px-4 pt-2 pb-16 md:py-8">
        {/* Shared mood banner */}
        <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-1">
              <h2 className="text-lg font-semibold">Shared Mood</h2>
              <p className="text-sm text-gray-600">
                This mood was shared by <span className="font-medium">a NailFeed user</span>
              </p>
            </div>
            {!isAuthenticated ? (
              <Button
                onClick={() => router.push("/auth")}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                Sign up to save
              </Button>
            ) : (
              <Button onClick={handleSaveMood} variant="outline" className="flex items-center">
                <Bookmark className="h-4 w-4 mr-2" />
                Save to my moods
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">{mood.name}</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <h2 className="text-lg font-semibold mb-4">Outfit Photo</h2>
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
                <p className="text-xs text-gray-500 mt-4">Created {new Date(mood.createdAt).toLocaleDateString()}</p>
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
                      <p className="mt-1 text-gray-500">This mood doesn't have any matching nail designs.</p>
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

      {/* Mobile Bottom Nav - visible on mobile only */}
      <div className="md:hidden">
        <BottomNav activeTab="home" />
      </div>

      <Toaster />
    </main>
  )
}
