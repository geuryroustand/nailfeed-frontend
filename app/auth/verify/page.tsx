"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import VerificationCodeInput from "@/components/auth/verification-code-input"
import Link from "next/link"

export default function VerifyPage() {
  const [email, setEmail] = useState<string>("")
  const [verificationCode, setVerificationCode] = useState<string>("")
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const [isResending, setIsResending] = useState<boolean>(false)
  const [isVerified, setIsVerified] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(0)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Get email from localStorage
    const storedEmail = localStorage.getItem("pendingVerificationEmail")
    if (!storedEmail) {
      router.push("/auth")
      return
    }
    setEmail(storedEmail)
  }, [router])

  useEffect(() => {
    // Countdown timer for resend button
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a valid 6-digit verification code",
        variant: "destructive",
      })
      return
    }

    setIsVerifying(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // For demo purposes, any 6-digit code is valid
    setIsVerifying(false)
    setIsVerified(true)

    toast({
      title: "Email verified!",
      description: "Your account has been successfully verified.",
    })

    // Clear the pending verification email
    localStorage.removeItem("pendingVerificationEmail")

    // Redirect after a short delay to show success state
    setTimeout(() => {
      router.push("/")
    }, 2000)
  }

  const handleResendCode = async () => {
    setIsResending(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsResending(false)
    setCountdown(60) // Set 60 seconds cooldown

    toast({
      title: "Verification code resent",
      description: "Please check your email for the new verification code",
    })
  }

  // Mask email for privacy
  const maskEmail = (email: string) => {
    const [username, domain] = email.split("@")
    const maskedUsername = username.charAt(0) + "•".repeat(username.length - 2) + username.charAt(username.length - 1)
    return `${maskedUsername}@${domain}`
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
            <p className="text-gray-500 mb-6">Your account has been successfully verified.</p>
            <p className="text-gray-500 mb-6">Redirecting you to the app...</p>
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
            </div>
          </motion.div>
        </div>
      </div>
    )
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
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="flex justify-center mb-6">
                <div className="h-16 w-16 rounded-full bg-pink-100 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-pink-500" />
                </div>
              </div>

              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Verify your email</h1>
                <p className="text-gray-500 mt-2">
                  We've sent a verification code to <br />
                  <span className="font-medium">{email ? maskEmail(email) : ""}</span>
                </p>
              </div>

              <div className="mb-6">
                <VerificationCodeInput
                  length={6}
                  onChange={(code) => setVerificationCode(code)}
                  disabled={isVerifying}
                />
              </div>

              <Button
                onClick={handleVerify}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 mb-4"
                disabled={verificationCode.length !== 6 || isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Didn't receive the code?</p>
                <Button
                  variant="link"
                  onClick={handleResendCode}
                  disabled={isResending || countdown > 0}
                  className="text-pink-500 font-medium p-0 h-auto"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Resending...
                    </>
                  ) : countdown > 0 ? (
                    `Resend code in ${countdown}s`
                  ) : (
                    "Resend code"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
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
