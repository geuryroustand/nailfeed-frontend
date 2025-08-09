"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AboutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we have an id_token in the URL (Google OAuth redirect)
    const idToken = searchParams.get("id_token")
    const error = searchParams.get("error")

    if (error) {
      console.error("OAuth error:", error)
      router.push(`/auth?error=${error}`)
      return
    }

    if (idToken) {
      console.log("Found id_token, redirecting to Google callback...")
      // Redirect to the proper callback handler
      router.push(`/auth/callback/google?id_token=${idToken}`)
      return
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">About NailFeed</h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to NailFeed - the ultimate destination for nail art inspiration and community.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
            <p className="text-gray-600">
              To create a vibrant community where nail art enthusiasts can share their creativity, discover new trends,
              and connect with fellow artists from around the world.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Join Our Community</h2>
            <p className="text-gray-600">
              Share your nail art creations, get inspired by others, and be part of a supportive community that
              celebrates creativity and self-expression.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
