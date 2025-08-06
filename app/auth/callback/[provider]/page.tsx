"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { SocialAuthService } from '@/lib/social-auth-service'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface CallbackPageProps {
  params: {
    provider: string
  }
}

export default function CallbackPage({ params }: CallbackPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUserData } = useAuth()
  const { toast } = useToast()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const accessToken = searchParams.get('access_token')
        const error = searchParams.get('error')
        
        console.log('Callback received:', {
          provider: params.provider,
          hasAccessToken: !!accessToken,
          error,
          allParams: Object.fromEntries(searchParams.entries())
        })

        if (error) {
          throw new Error(decodeURIComponent(error))
        }

        if (!accessToken) {
          throw new Error('No access token received from OAuth provider')
        }

        setStatus('loading')
        
        // Handle the OAuth callback
        const result = await SocialAuthService.handleCallback(params.provider, accessToken)
        
        if (result.success && result.user && result.jwt) {
          console.log('Social auth successful:', {
            provider: params.provider,
            userId: result.user.id,
            username: result.user.username
          })
          
          // Update auth context
          setUserData(result.user)
          
          setStatus('success')
          
          toast({
            title: "Login successful!",
            description: `Welcome back! You've been logged in with ${params.provider}.`,
          })
          
          // Redirect to home page after a short delay
          setTimeout(() => {
            router.push('/')
          }, 1500)
          
        } else {
          throw new Error(result.error || 'Authentication failed')
        }
        
      } catch (error) {
        console.error('OAuth callback error:', error)
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Authentication failed')
        
        toast({
          title: "Authentication failed",
          description: error instanceof Error ? error.message : 'Something went wrong during authentication',
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

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            <h2 className="text-xl font-semibold">Completing authentication...</h2>
            <p className="text-gray-600">Please wait while we log you in with {params.provider}.</p>
          </div>
        )
      
      case 'success':
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-600">Authentication successful!</h2>
            <p className="text-gray-600">Redirecting you to the app...</p>
          </div>
        )
      
      case 'error':
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-600">Authentication failed</h2>
            <p className="text-gray-600 text-center max-w-md">{errorMessage}</p>
            <p className="text-sm text-gray-500">Redirecting back to login...</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {getStatusContent()}
      </div>
    </div>
  )
}
