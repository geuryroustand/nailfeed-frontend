"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

export default function VerifySuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Get token from URL
  const token = searchParams.get("token")

  useEffect(() => {
    // In a real app, you would validate the token with your backend
    if (!token) {
      toast({
        title: "Invalid verification link",
        description: "The verification link is invalid or has expired.",
        variant: "destructive",
      })

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/auth")
      }, 2000)
    } else {
      // Clear any pending verification
      localStorage.removeItem("pendingVerificationEmail")

      // Show success toast
      toast({
        title: "Email verified!",
        description: "Your account has been successfully verified.",
      })
    }
  }, [token, toast, router])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 border-b bg-white">
        <div className="container max-w-5xl mx-auto">
          <div className="flex items-center">
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
          className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center"
        >
          {token ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
              <p className="text-gray-500 mb-6">Your account has been successfully verified.</p>
              <Button
                onClick={() => router.push("/")}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                Continue to NailFeed
              </Button>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">Invalid Verification Link</h1>
              <p className="text-gray-500 mb-6">
                The verification link is invalid or has expired. Please request a new verification link.
              </p>
              <Button
                onClick={() => router.push("/auth")}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              >
                Back to Login
              </Button>
            </>
          )}
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
