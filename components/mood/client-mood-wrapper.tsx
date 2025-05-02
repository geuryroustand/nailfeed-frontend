"use client"

import { Suspense } from "react"
import MoodPageContent from "@/components/mood/mood-page-content"

export default function ClientMoodWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading mood page...</div>}>
      <MoodPageContent />
    </Suspense>
  )
}
