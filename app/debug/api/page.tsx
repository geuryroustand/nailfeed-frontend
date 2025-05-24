"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { apiCache } from "@/lib/api-cache"
import { clearCache } from "@/lib/api-client"
import ApiDiagnostics from "@/components/api-diagnostics"

export default function ApiDebugPage() {
  const [message, setMessage] = useState<string>("")

  const handleClearAllCache = () => {
    // Clear the API client cache
    clearCache()

    // Clear the API cache
    apiCache.clear()

    setMessage("All API caches cleared successfully!")

    // Force reload after a short delay
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">API Debugging Tools</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cache Management</CardTitle>
            <CardDescription>Clear API caches to fetch fresh data from the server</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              The application uses in-memory caching to reduce API calls. If you're seeing stale data or incorrect image
              URLs, clearing the cache can help resolve these issues.
            </p>
            {message && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
                <p className="text-green-700">{message}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleClearAllCache} variant="destructive">
              Clear All API Caches
            </Button>
          </CardFooter>
        </Card>

        <ApiDiagnostics />
      </div>
    </div>
  )
}
