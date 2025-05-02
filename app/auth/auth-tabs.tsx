"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams } from "next/navigation"
import LoginForm from "@/components/auth/login-form"
import SignupForm from "@/components/auth/signup-form"
import AuthSocial from "@/components/auth/auth-social"

export default function AuthTabs() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")
  const searchParams = useSearchParams()

  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "signup") {
      setActiveTab("signup")
    }
  }, [searchParams])

  return (
    <>
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

      <div className="mt-6 text-center text-sm">
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
    </>
  )
}
