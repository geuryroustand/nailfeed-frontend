"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Home } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PostError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Post page error:", error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
         <p className="text-gray-600 mb-6">
          We couldn&apos;t load this post. Please try again or return to the home page.
        </p>
       
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
          <Link href="/" passHref>
            <Button className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Return home
            </Button>
          </Link>
        </div>
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-6 p-4 bg-gray-100 rounded-md text-left">
            <p className="text-sm font-mono text-gray-800 break-words">{error.message}</p>
            {error.digest && <p className="text-xs font-mono text-gray-500 mt-2">Error ID: {error.digest}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
