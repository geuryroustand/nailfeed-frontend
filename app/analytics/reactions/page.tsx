export const dynamic = "force-dynamic"

import ReactionAnalytics from "@/components/reaction-analytics"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reaction Analytics | Nail Art Social",
  description: "Detailed analytics about reactions across the platform",
}

export default function ReactionAnalyticsPage() {
  return (
    <div className="container max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Reaction Analytics</h1>
      <ReactionAnalytics />
    </div>
  )
}
