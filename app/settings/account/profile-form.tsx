"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { updateProfile, type ActionResponse } from "./actions"
import type { UserProfile } from "@/lib/profile-service"
import type { User as UserType } from "@/lib/auth-service"

interface ProfileFormProps {
  profile: UserProfile
  user: UserType
}

export function ProfileForm({ profile, user }: ProfileFormProps) {
  const { toast } = useToast()
  const [username, setUsername] = useState(user.username || "")
  const [displayName, setDisplayName] = useState(profile.displayName || "")
  const [bio, setBio] = useState(profile.bio || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formState, setFormState] = useState<ActionResponse>({
    success: false,
    message: "",
  })

  // Show toast when form submission completes
  useEffect(() => {
    if (formState.message) {
      toast({
        title: formState.success ? "Success" : "Error",
        description: formState.message,
        variant: formState.success ? "default" : "destructive",
      })
    }
  }, [formState, toast])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)

      // Log what we're sending
      console.log("Submitting form data:", {
        username: formData.get("username"),
        displayName: formData.get("displayName"),
        bio: formData.get("bio"),
      })

      const result = await updateProfile(formData)
      console.log("Server action response:", result)

      setFormState(result)

      if (result.success) {
        // Optionally refresh the page to show updated data
        // window.location.reload()
      }
    } catch (error) {
      console.error("Form submission error:", error)
      setFormState({
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <Input
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
          />
          {formState.fieldErrors?.username && (
            <p className="text-xs text-red-500">{formState.fieldErrors.username[0]}</p>
          )}
          <p className="text-xs text-gray-500">This will be your unique identifier on NailFeed</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="displayName" className="text-sm font-medium">
            Display Name
          </label>
          <Input
            id="displayName"
            name="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your Name"
          />
          {formState.fieldErrors?.displayName && (
            <p className="text-xs text-red-500">{formState.fieldErrors.displayName[0]}</p>
          )}
          <p className="text-xs text-gray-500">This is how your name will appear to other users</p>
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          {formState.fieldErrors?.bio && <p className="text-xs text-red-500">{formState.fieldErrors.bio[0]}</p>}
          <p className="text-xs text-gray-500">Share a little about yourself, your nail art style, or your interests</p>
        </div>

        <Button
          type="submit"
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            "Update Profile"
          )}
        </Button>
      </form>
    </motion.div>
  )
}
