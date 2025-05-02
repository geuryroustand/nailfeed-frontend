"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import LoginForm from "@/components/auth/login-form"
import SignupForm from "@/components/auth/signup-form"
import AuthSocial from "@/components/auth/auth-social"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import SocialProofBanner from "@/components/auth/social-proof-banner"

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "signup") {
      setActiveTab("signup")
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content - Removed duplicate header */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 md:p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold">Welcome to NailFeed</h1>
                <p className="text-gray-500 mt-2">
                  {activeTab === "login" ? "Sign in to continue to your account" : "Create an account to get started"}
                </p>
              </div>

              <SocialProofBanner />

              <Tabs
                defaultValue="login"
                value={activeTab}
                onValueChange={(value) => setActiveTab(value as "login" | "signup")}
                className="w-full mt-6"
              >
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "login" ? <LoginForm /> : <SignupForm />}
                  </motion.div>
                </AnimatePresence>
              </Tabs>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <AuthSocial />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 text-center text-sm">
              {activeTab === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button onClick={() => setActiveTab("signup")} className="text-pink-500 font-medium hover:underline">
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button onClick={() => setActiveTab("login")} className="text-pink-500 font-medium hover:underline">
                    Log in
                  </button>
                </p>
              )}
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
