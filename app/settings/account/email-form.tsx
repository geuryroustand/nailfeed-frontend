"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { updateEmail, type ActionResponse } from "./actions"
import type { User } from "@/lib/auth-service"
import { useRouter } from "next/navigation"

interface EmailFormProps {
  user: User
}

export function EmailForm({ user }: EmailFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [newEmail, setNewEmail] = useState("")
  const [emailPassword, setEmailPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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

      // Clear form on success
      if (formState.success) {
        setNewEmail("")
        setEmailPassword("")
      }
    }
  }, [formState, toast])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      const result = await updateEmail(formData)
      setFormState(result)

      if (result.success) {
        // Use router.refresh() instead of a full page reload
        router.refresh()
      }
    } catch (error) {
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
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium mb-1">Current Email</h3>
        <p className="text-sm">{user.email}</p>
        <div className="flex items-center mt-2">
          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
          <span className="text-xs text-green-600">Verified</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="newEmail" className="text-sm font-medium">
            New Email Address
          </label>
          <Input
            id="newEmail"
            name="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new.email@example.com"
          />
          {formState.fieldErrors?.newEmail && (
            <p className="text-xs text-red-500">{formState.fieldErrors.newEmail[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="emailPassword" className="text-sm font-medium">
            Current Password
          </label>
          <div className="relative">
            <Input
              id="emailPassword"
              name="emailPassword"
              type={showPassword ? "text" : "password"}
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {formState.fieldErrors?.password && (
            <p className="text-xs text-red-500">{formState.fieldErrors.password[0]}</p>
          )}
          <p className="text-xs text-gray-500">For security, please enter your current password to change your email</p>
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
            "Update Email"
          )}
        </Button>

        <p className="text-xs text-gray-500 mt-4">
          Note: You'll need to verify your new email address before the change takes effect.
        </p>
      </form>
    </motion.div>
  )
}
