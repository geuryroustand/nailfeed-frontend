"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function VerifyExpiredPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitting(false)

    // Store email for verification page
    localStorage.setItem("pendingVerificationEmail", email)

    toast({
      title: "Verification email sent",
      description: "Please check your email for the verification link",
    })

    // Redirect to verification page
    router.push("/auth/verify")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 border-b bg-white">
        <div className="container max-w-5xl mx-auto">
          <div className="flex items-center">
            <Link href="/auth" className="mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold mr-2">
              N
            </div>
            <h1 className="text-xl font-bold">NailFeed</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md bg-white rounded-xl shadow-lg p-8"
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Verification Link Expired</h1>
            <p className="text-gray-500 mt-2">
              Your verification link has expired. Please enter your email to receive a new verification link.
            </p>
          </div>

          <form onSubmit={handleResendVerification} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                </>
              ) : (
                "Resend Verification Email"
              )}
            </Button>
          </form>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-4 px-4 border-t bg-white text-center text-sm text-gray-500">
        <div className="container max-w-5xl mx-auto">
          <p>© 2023 NailFeed. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
