import { Suspense } from "react"
import { redirect } from "next/navigation"
import { handleSocialAuthCallback } from "@/app/auth/actions"

interface CallbackPageProps {
  params: { provider: string }
  searchParams: { access_token?: string; error?: string }
}

async function CallbackContent({ params, searchParams }: CallbackPageProps) {
  const { provider } = params
  const { access_token, error } = searchParams

  // Handle error from OAuth provider
  if (error) {
    console.error(`OAuth error from ${provider}:`, error)
    redirect(`/auth?error=${encodeURIComponent(`Authentication failed: ${error}`)}`)
  }

  // Handle missing access token
  if (!access_token) {
    console.error(`No access token received from ${provider}`)
    redirect(`/auth?error=${encodeURIComponent("No access token received")}`)
  }

  try {
    // Process the authentication callback
    const result = await handleSocialAuthCallback(provider, access_token)
    
    if (result.success) {
      // Redirect to home page on success
      redirect("/")
    } else {
      // Redirect to auth page with error
      redirect(`/auth?error=${encodeURIComponent(result.error || "Authentication failed")}`)
    }
  } catch (error) {
    console.error(`Callback processing error for ${provider}:`, error)
    redirect(`/auth?error=${encodeURIComponent("Authentication processing failed")}`)
  }
}

export default function CallbackPage({ params, searchParams }: CallbackPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Processing authentication...</p>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <CallbackContent params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
