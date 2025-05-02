import { Suspense } from "react"
import ProfileCreationForm from "@/components/profile/profile-creation-form"
import { Toaster } from "@/components/ui/toaster"

export default function ProfileCreationPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Complete Your Profile</h1>
          <p className="text-gray-500 mt-2">Tell the nail art community about yourself and your expertise</p>
        </div>

        <Suspense fallback={<div className="flex justify-center p-12">Loading...</div>}>
          <ProfileCreationForm />
        </Suspense>
      </div>
      <Toaster />
    </main>
  )
}
