"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { updateUserProfile, uploadProfileImage, uploadCoverImage } from "@/app/actions/user-actions"
import type { UserProfileResponse } from "@/lib/services/user-service"
import ImageUploadWithCrop from "@/components/image-cropper/image-upload-with-crop"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Camera, User, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface EditProfileModalProps {
  user: UserProfileResponse
  onClose: () => void
}

export default function EditProfileModal({ user, onClose }: EditProfileModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileImageBlob, setProfileImageBlob] = useState<Blob | null>(null)
  const [coverImageBlob, setCoverImageBlob] = useState<Blob | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("info") // Default to info tab

  // Form state - initialize with actual values from user data, not placeholders
  const [displayName, setDisplayName] = useState(user.displayName || "")
  const [bio, setBio] = useState(user.bio || "")
  const [location, setLocation] = useState(user.location || "")
  const [website, setWebsite] = useState(user.website || "")

  const { toast } = useToast()
  const router = useRouter()

  // Clean up blobs when component unmounts
  useEffect(() => {
    return () => {
      if (profileImageBlob) {
        URL.revokeObjectURL(URL.createObjectURL(profileImageBlob))
      }
      if (coverImageBlob) {
        URL.revokeObjectURL(URL.createObjectURL(coverImageBlob))
      }
    }
  }, [profileImageBlob, coverImageBlob])

  // Get the API base URL - use same as other services
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:1337"

  // Debug: Log user data to understand structure
  console.log('[EditProfileModal] User data received:', {
    hasUser: !!user,
    profileImage: user.profileImage,
    coverImage: user.coverImage,
    username: user.username
  })

  // Construct absolute URLs for profile and cover images
  const getFullImageUrl = (relativeUrl: string | undefined) => {
    if (!relativeUrl) return undefined
    // If the URL already starts with http, it's already absolute
    if (relativeUrl.startsWith("http")) return relativeUrl
    // Otherwise, prepend the API base URL
    return `${apiBaseUrl}${relativeUrl}`
  }

  const profileImageUrl = getFullImageUrl(user.profileImage?.url)
  const coverImageUrl = getFullImageUrl(user.coverImage?.url)

  console.log('[EditProfileModal] Image URLs constructed:', {
    profileImageUrl,
    coverImageUrl,
    apiBaseUrl
  })

  // Function to compress image before upload
  const compressImage = async (blob: Blob, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Could not create blob from canvas"))
            }
          },
          "image/jpeg",
          quality,
        )
      }

      img.onerror = () => {
        reject(new Error("Failed to load image"))
      }

      img.src = URL.createObjectURL(blob)
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setUploadError(null)

    try {
      // Get the current form values directly from state and ensure they're properly trimmed
      const profileData = {
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
      }

      // Log the data we're sending with clear formatting
      console.log("Sending profile data:", JSON.stringify(profileData, null, 2))

      // Verify we have actual data to send
      if (!profileData.displayName && !profileData.bio && !profileData.location && !profileData.website) {
        console.warn("Warning: Attempting to submit form with all empty fields")
      }

      // Log form state right before submission
      console.log("Form state before submission:", {
        displayName: displayName,
        bio: bio,
        location: location,
        website: website,
      })

      // Update profile information
      const result = await updateUserProfile(profileData)

      if (!result.success) {
        throw new Error(result.error || "Failed to update profile")
      }

      // If no images were changed, show success and close
      if (!profileImageBlob && !coverImageBlob) {
        toast({
          title: "Success",
          description: "Your profile has been updated",
        })

        // Use Next.js router to refresh the data
        router.refresh()
        onClose()
        return
      }

      // Process one image at a time to avoid overwhelming the server
      let hasImageUploadError = false

      // Upload profile image if changed
      if (profileImageBlob) {
        try {
          // Compress the image before upload - use smaller size for profile images
          const compressedBlob = await compressImage(profileImageBlob, 500, 500, 0.7)
          console.log(`Original size: ${profileImageBlob.size}, Compressed size: ${compressedBlob.size}`)

          const profileImageFormData = new FormData()

          // Convert Blob to File with a name
          const profileImageFile = new File([compressedBlob], "profile-image.jpg", {
            type: "image/jpeg",
          })

          profileImageFormData.append("profileImage", profileImageFile)

          const profileImageResult = await uploadProfileImage(profileImageFormData)

          if (!profileImageResult.success) {
            hasImageUploadError = true
            console.error("Profile image upload failed:", profileImageResult.error)
            setUploadError(profileImageResult.error || "Failed to upload profile image")
            toast({
              title: "Profile Image Upload Failed",
              description: profileImageResult.error || "Failed to upload profile image",
              variant: "destructive",
            })
          }
        } catch (error) {
          hasImageUploadError = true
          const errorMessage = error instanceof Error ? error.message : "Unknown error during profile image upload"
          console.error("Error processing profile image:", errorMessage)
          setUploadError(errorMessage)
          toast({
            title: "Profile Image Processing Failed",
            description: errorMessage,
            variant: "destructive",
          })
        }
      }

      // Only proceed with cover image if profile image was successful or not attempted
      if (coverImageBlob && !hasImageUploadError) {
        try {
          // Compress the image before upload - use lower quality for cover images
          const compressedBlob = await compressImage(coverImageBlob, 1000, 400, 0.6)
          console.log(`Original size: ${coverImageBlob.size}, Compressed size: ${compressedBlob.size}`)

          const coverImageFormData = new FormData()

          // Convert Blob to File with a name
          const coverImageFile = new File([compressedBlob], "cover-image.jpg", {
            type: "image/jpeg",
          })

          coverImageFormData.append("coverImage", coverImageFile)

          const coverImageResult = await uploadCoverImage(coverImageFormData)

          if (!coverImageResult.success) {
            hasImageUploadError = true
            console.error("Cover image upload failed:", coverImageResult.error)
            setUploadError(coverImageResult.error || "Failed to upload cover image")
            toast({
              title: "Cover Image Upload Failed",
              description: coverImageResult.error || "Failed to upload cover image",
              variant: "destructive",
            })
          }
        } catch (error) {
          hasImageUploadError = true
          const errorMessage = error instanceof Error ? error.message : "Unknown error during cover image upload"
          console.error("Error processing cover image:", errorMessage)
          setUploadError(errorMessage)
          toast({
            title: "Cover Image Processing Failed",
            description: errorMessage,
            variant: "destructive",
          })
        }
      }

      if (!hasImageUploadError) {
        toast({
          title: "Success",
          description: "Your profile has been updated",
        })
        // Use Next.js router to refresh the data
        router.refresh()
        onClose()
      } else {
        // Keep the modal open if there were image upload errors
        toast({
          title: "Partial Update",
          description:
            "Profile information was updated but there were issues with image uploads. You can try again with smaller images or continue with just the profile updates.",
          variant: "warning",
        })
        // Switch to the images tab to show the error
        setActiveTab("images")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile"
      setUploadError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProfileImageChange = (blob: Blob) => {
    setProfileImageBlob(blob)
    setUploadError(null) // Clear previous errors when selecting a new image
  }

  const handleCoverImageChange = (blob: Blob) => {
    setCoverImageBlob(blob)
    setUploadError(null) // Clear previous errors when selecting a new image
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your profile information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Personal Info</span>
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span>Profile Images</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-base font-medium">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  name="displayName"
                  value={displayName}
                  onChange={(e) => {
                    const newValue = e.target.value
                    console.log(`Setting displayName to: "${newValue}"`)
                    setDisplayName(newValue)
                  }}
                  placeholder="Your display name"
                />
                <p className="text-xs text-muted-foreground">This is how your name will appear to others</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-base font-medium">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={bio}
                  onChange={(e) => {
                    const newValue = e.target.value
                    console.log(`Setting bio to: "${newValue}"`)
                    setBio(newValue)
                  }}
                  className="resize-none"
                  rows={3}
                  placeholder="Tell others about yourself"
                />
                <p className="text-xs text-muted-foreground">Share your nail art style and interests</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-base font-medium">
                  Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={location}
                  onChange={(e) => {
                    const newValue = e.target.value
                    console.log(`Setting location to: "${newValue}"`)
                    setLocation(newValue)
                  }}
                  placeholder="Your location (optional)"
                />
                <p className="text-xs text-muted-foreground">Where you're based (optional)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-base font-medium">
                  Website
                </Label>
                <Input
                  id="website"
                  name="website"
                  value={website}
                  onChange={(e) => {
                    const newValue = e.target.value
                    console.log(`Setting website to: "${newValue}"`)
                    setWebsite(newValue)
                  }}
                  placeholder="https://yourwebsite.com"
                />
                <p className="text-xs text-muted-foreground">Your personal or business website (optional)</p>
              </div>
            </TabsContent>

            <TabsContent value="images" className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profileImage" className="text-base font-medium">
                    Profile Image
                  </Label>
                  <p className="text-xs text-muted-foreground">This is your main profile picture</p>
                  <ImageUploadWithCrop
                    currentImageUrl={profileImageUrl}
                    onImageChange={handleProfileImageChange}
                    aspect={1}
                    cropShape="round"
                    type="profile"
                    className="mt-4"
                  />
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="coverImage" className="text-base font-medium">
                    Cover Image
                  </Label>
                  <p className="text-xs text-muted-foreground">This image appears at the top of your profile</p>
                  <ImageUploadWithCrop
                    currentImageUrl={coverImageUrl}
                    onImageChange={handleCoverImageChange}
                    aspect={3}
                    type="cover"
                  />
                </div>

                {/* Image upload tips */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-blue-700 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Tips for successful uploads:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Keep images under 2MB for best results</li>
                        <li>Use JPG or PNG formats</li>
                        <li>Profile image should be square (1:1 ratio)</li>
                        <li>Cover image works best with a 3:1 ratio</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {uploadError && (
            <div className="p-3 text-sm bg-red-50 border border-red-200 rounded-md text-red-600">
              <p className="font-medium">Error:</p>
              <p>{uploadError}</p>
            </div>
          )}

          <DialogFooter className="pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
