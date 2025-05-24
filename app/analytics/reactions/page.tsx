import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reaction Analytics | Nail Art Social",
  description: "Detailed analytics about reactions across the platform",
}

// Force dynamic rendering since this page uses client-side data fetching
export const dynamic = "force-dynamic"

// Client component wrapper for the analytics
function ReactionAnalyticsClient() {
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Reaction Analytics</h1>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Analytics Dashboard</h2>
          <p className="text-gray-600 mb-4">View detailed analytics about reactions across the platform.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="font-medium text-pink-800">Total Reactions</h3>
              <p className="text-2xl font-bold text-pink-600">12,345</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800">Most Popular</h3>
              <p className="text-2xl font-bold text-blue-600">❤️ Hearts</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800">Growth</h3>
              <p className="text-2xl font-bold text-green-600">+15%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Trending Reactions</h3>
          <div className="space-y-2">
            {["❤️", "😍", "🔥", "💅", "✨"].map((emoji, index) => (
              <div key={emoji} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-xl">{emoji}</span>
                <span className="font-medium">{Math.floor(Math.random() * 1000) + 100} reactions</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReactionAnalyticsPage() {
  return <ReactionAnalyticsClient />
}
