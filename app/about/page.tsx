import { Suspense } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About - NailFeed",
  description: "Learn more about NailFeed, the premier platform for nail art enthusiasts.",
}

export default function AboutPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">About NailFeed</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The premier social platform for nail art enthusiasts, creators, and beauty lovers worldwide.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                NailFeed was created to bring together nail art enthusiasts from around the world. We believe that nail
                art is a form of self-expression and creativity that deserves to be celebrated and shared. Our platform
                provides a space for artists to showcase their work, learn from each other, and connect with a community
                that shares their passion.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">What We Offer</h2>
              <ul className="text-gray-600 space-y-3">
                <li className="flex items-start">
                  <span className="text-pink-500 mr-2">•</span>
                  Share your nail art creations with the world
                </li>
                <li className="flex items-start">
                  <span className="text-pink-500 mr-2">•</span>
                  Discover trending designs and techniques
                </li>
                <li className="flex items-start">
                  <span className="text-pink-500 mr-2">•</span>
                  Connect with fellow nail art enthusiasts
                </li>
                <li className="flex items-start">
                  <span className="text-pink-500 mr-2">•</span>
                  Learn from tutorials and tips
                </li>
                <li className="flex items-start">
                  <span className="text-pink-500 mr-2">•</span>
                  Build your personal nail art portfolio
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Join Our Community</h2>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-pink-500 mb-2">10K+</div>
                <div className="text-gray-600">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-500 mb-2">50K+</div>
                <div className="text-gray-600">Nail Art Posts</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-500 mb-2">100K+</div>
                <div className="text-gray-600">Likes & Reactions</div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Get Started?</h2>
            <p className="text-gray-600 mb-6">
              Join thousands of nail art enthusiasts and start sharing your creativity today.
            </p>
            <a
              href="/auth"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all duration-200"
            >
              Join NailFeed
            </a>
          </div>
        </div>
      </div>
    </Suspense>
  )
}
