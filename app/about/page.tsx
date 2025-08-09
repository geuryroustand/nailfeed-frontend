"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AboutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const idToken = searchParams.get("id_token")

    if (idToken) {
      // Redirect to our Google auth handler
      window.location.href = `/api/auth/social/google?id_token=${idToken}`
      return
    }
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About NailFeed</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The ultimate destination for nail art enthusiasts to share, discover, and get inspired by stunning nail
            designs from around the world.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              We believe that nail art is a form of self-expression that deserves to be celebrated. NailFeed provides a
              platform where artists, enthusiasts, and beginners can come together to share their creativity, learn new
              techniques, and inspire each other.
            </p>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Join Our Community</h2>
            <p className="text-gray-600 leading-relaxed">
              Whether you're a professional nail artist or someone who loves experimenting with colors and designs,
              you'll find your place in our vibrant community. Share your work, get feedback, and discover trends that
              will take your nail game to the next level.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">What Makes Us Special</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-pink-600 text-xl">🎨</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Creative Expression</h3>
              <p className="text-gray-600 text-sm">
                Showcase your unique style and artistic vision through stunning nail art photography.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 text-xl">👥</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Supportive Community</h3>
              <p className="text-gray-600 text-sm">
                Connect with like-minded individuals who share your passion for nail art and beauty.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-xl">📚</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Learn & Grow</h3>
              <p className="text-gray-600 text-sm">
                Discover new techniques, trends, and tips from experienced artists in the community.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
