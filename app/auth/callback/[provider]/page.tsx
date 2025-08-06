"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { SocialAuthService, type SocialProvider } from "@/lib/social-auth-service"
import { Loader2 } from 'lucide-react'

interface CallbackPageProps {
  params: {
    provider: SocialProvider
  }
}

export default function CallbackPage({ params }: CallbackPageProps) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUserData } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get access token from URL parameters
        const accessToken = searchParams.get('access_token')
        const error = searchParams.get('error')

        if (error) {
          throw new Error(decodeURIComponent(error))
        }

        if (!accessToken) {
          throw new Error('No access token received from authentication provider')
        }

        // Handle the callback with Strapi
        const result = await SocialAuthService.handleCallback(params.provider, accessToken)

        if (result.success && result.user && result.jwt) {
          // Update auth context
          setUserData(result.user, result.jwt)

          setStatus('success')
          
          toast({
            title: "Login successful!",
            description: `Welcome back to NailFeed via ${params.provider}`,
          })

          // Redirect to home page after a short delay
          setTimeout(() => {
            router.push('/')
          }, 1500)
        } else {
          throw new Error(result.error || 'Authentication failed')
        }
      } catch (error) {
        console.error(`${params.provider} callback error:`, error)
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed')
        
        toast({
          title: "Authentication failed",
          description: error instanceof Error ? error.message : 'Please try again',
          variant: "destructive",
        })

        // Redirect to auth page after showing error
        setTimeout(() => {
          router.push('/auth')
        }, 3000)
      }
    }

    handleCallback()
  }, [params.provider, searchParams, router, setUserData, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-pink-500" />
            <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
            <p className="text-gray-600">Please wait while we finish setting up your account.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Sign in successful!</h2>
            <p className="text-gray-600">Redirecting you to your feed...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Authentication failed</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <p className="text-sm text-gray-500">Redirecting you back to sign in...</p>
          </div>
        )}
      </div>
    </div>
  )
}
