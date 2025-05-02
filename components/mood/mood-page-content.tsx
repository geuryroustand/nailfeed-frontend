"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useMood, type MoodColor, type MoodDesign } from "@/context/mood-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Upload, Camera, Loader2, Save, Bookmark, Eye, X, Check, Heart } from "lucide-react"
import Sidebar from "@/components/sidebar"
import BottomNav from "@/components/bottom-nav"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import CameraCapture from "./camera-capture"

export default function MoodPageContent() {
  const router = useRouter()
  const { extractColorsFromImage, getRecommendedDesigns, setCurrentMood, currentMood, saveMood } = useMood()
  const { toast } = useToast()

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedColors, setExtractedColors] = useState<MoodColor[]>([])
  const [recommendedDesigns, setRecommendedDesigns] = useState<MoodDesign[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [moodName, setMoodName] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [activeTab, setActiveTab] = useState<"upload" | "results">("upload")
  const [savedDesigns, setSavedDesigns] = useState<Set<number>>(new Set())
  const [showCamera, setShowCamera] = useState(false)

  // Reset state when navigating to this page
  useEffect(() => {
    setCurrentMood(null)
    setUploadedImage(null)
    setExtractedColors([])
    setRecommendedDesigns([])
    setActiveTab("upload")
    setSavedDesigns(new Set())
  }, [setCurrentMood])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)

      const reader = new FileReader()
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string
        setUploadedImage(imageUrl)
        setIsUploading(false)
        processImage(imageUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCameraCapture = () => {
    // Open the camera interface
    setShowCamera(true)
  }

  const handleCapturedImage = (imageData: string) => {
    setShowCamera(false)
    setIsUploading(true)

    // Use the captured image
    setUploadedImage(imageData)
    setIsUploading(false)
    processImage(imageData)
  }

  const handleCancelCamera = () => {
    setShowCamera(false)
  }

  const processImage = async (imageUrl: string) => {
    setIsExtracting(true)

    try {
      // Extract colors from the image
      const colors = await extractColorsFromImage(imageUrl)
      setExtractedColors(colors)

      // Get recommended designs based on the extracted colors
      const designs = await getRecommendedDesigns(colors)
      setRecommendedDesigns(designs)

      // Set current mood in context
      setCurrentMood({
        id: "",
        name: "",
        image: imageUrl,
        colors,
        createdAt: new Date().toISOString(),
        designs,
        isPublic: true,
      })

      // Switch to results tab
      setActiveTab("results")
    } catch (error) {
      console.error("Error processing image:", error)
      toast({
        title: "Error processing image",
        description: "There was an error extracting colors from your image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSaveMood = async () => {
    if (!moodName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your mood.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await saveMood(moodName.trim(), isPublic)
      setShowSaveDialog(false)

      toast({
        title: "Mood saved!",
        description: "Your mood has been saved successfully.",
      })

      // Redirect to moods page
      router.push("/moods")
    } catch (error) {
      console.error("Error saving mood:", error)
      toast({
        title: "Error saving mood",
        description: "There was an error saving your mood. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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

  return (
    <main className="min-h-screen bg-gray-50">
      {showCamera && <CameraCapture onCapture={handleCapturedImage} onCancel={handleCancelCamera} />}

      <div className="flex">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block md:w-64 lg:w-72 fixed h-screen border-r border-gray-200">
          <Sidebar activeItem="mood" />
        </div>

        {/* Main Content */}
        <div className="w-full md:pl-64 lg:pl-72">
          <div className="container max-w-4xl mx-auto px-4 pt-2 pb-16 md:py-8">
            <div className="flex items-center mb-6">
              <Button variant="ghost" size="sm" className="mr-4" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">Share Your Mood</h1>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "upload" | "results")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="upload">Upload Photo</TabsTrigger>
                <TabsTrigger value="results" disabled={!uploadedImage}>
                  Matching Designs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Upload your outfit or makeup photo</h2>
                    <p className="text-gray-500 mb-6">
                      We'll analyze your photo and recommend nail designs that match your style and colors.
                    </p>

                    {uploadedImage ? (
                      <div className="relative mb-6">
                        <img
                          src={uploadedImage || "/placeholder.svg"}
                          alt="Uploaded outfit"
                          className="w-full max-h-[400px] object-contain rounded-lg"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm"
                          onClick={() => setUploadedImage(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 mb-6">
                        <div className="mb-4 text-gray-400">
                          <Upload className="h-12 w-12 mx-auto mb-2" />
                          <p className="text-center">Drag and drop your photo here, or click to browse</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Button
                            onClick={() => document.getElementById("photo-upload")?.click()}
                            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="mr-2 h-4 w-4" /> Upload Photo
                              </>
                            )}
                          </Button>
                          <Button variant="outline" onClick={handleCameraCapture} disabled={isUploading}>
                            <Camera className="mr-2 h-4 w-4" /> Take Photo
                          </Button>
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isUploading}
                          />
                        </div>
                      </div>
                    )}

                    {uploadedImage && (
                      <div className="flex justify-end">
                        <Button
                          onClick={() => setActiveTab("results")}
                          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                          disabled={isExtracting}
                        >
                          {isExtracting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                            </>
                          ) : (
                            "View Matching Designs"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">How it works</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3">
                          <Upload className="h-6 w-6 text-pink-500" />
                        </div>
                        <h3 className="font-medium mb-1">Upload Photo</h3>
                        <p className="text-sm text-gray-500">Upload a photo of your outfit or makeup look</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-purple-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v11a2 2 0 01-2 2h-1"
                            />
                          </svg>
                        </div>
                        <h3 className="font-medium mb-1">Color Analysis</h3>
                        <p className="text-sm text-gray-500">We extract the dominant colors from your photo</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-pink-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <h3 className="font-medium mb-1">Get Recommendations</h3>
                        <p className="text-sm text-gray-500">Discover nail designs that match your style</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="results" className="space-y-6">
                {extractedColors.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-1/3">
                          <h2 className="text-lg font-semibold mb-4">Your Photo</h2>
                          <img
                            src={uploadedImage || "/placeholder.svg"}
                            alt="Uploaded outfit"
                            className="w-full aspect-square object-cover rounded-lg mb-4"
                          />
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium">Extracted Colors</h3>
                            <span className="text-xs text-gray-500">{extractedColors.length} colors</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {extractedColors.map((color, index) => (
                              <div key={index} className="flex items-center">
                                <div
                                  className="w-8 h-8 rounded-full mr-2"
                                  style={{ backgroundColor: color.color }}
                                ></div>
                                <div>
                                  <div className="text-xs font-medium">{(color as any).name || color.color}</div>
                                  <div className="text-xs text-gray-500">{color.percentage}%</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => setShowSaveDialog(true)}
                              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                            >
                              <Save className="mr-2 h-4 w-4" /> Save Mood
                            </Button>
                            <Button variant="outline" onClick={() => setActiveTab("upload")} className="flex-1">
                              <Upload className="mr-2 h-4 w-4" /> New Photo
                            </Button>
                          </div>
                        </div>
                        <div className="md:w-2/3">
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold">Matching Nail Designs</h2>
                            <span className="text-sm text-gray-500">
                              {recommendedDesigns.length} {recommendedDesigns.length === 1 ? "design" : "designs"} found
                            </span>
                          </div>
                          {recommendedDesigns.length === 0 ? (
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
                              {recommendedDesigns.map((design) => (
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
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav - visible on mobile only */}
      <div className="md:hidden">
        <BottomNav activeTab="mood" />
      </div>

      {/* Save Mood Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Your Mood</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="mood-name">Mood Name</Label>
              <Input
                id="mood-name"
                placeholder="e.g., Birthday Look, Summer Outfit"
                value={moodName}
                onChange={(e) => setMoodName(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is-public" className="cursor-pointer">
                Make this mood public
              </Label>
              <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
            <p className="text-xs text-gray-500">
              {isPublic
                ? "Public moods can be shared with anyone using a link."
                : "Private moods are only visible to you."}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveMood}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              disabled={isLoading || !moodName.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Mood"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </main>
  )
}
