"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ApiDebug() {
  const [isVisible, setIsVisible] = useState(false)
  const [apiResponse, setApiResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testApi = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
      const token = process.env.NEXT_PUBLIC_API_TOKEN || ""

      console.log("Testing API with token:", token ? "exists" : "not found")

      const response = await fetch(`${apiUrl}/api/posts?populate=*`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      setApiResponse(JSON.stringify(data, null, 2))
    } catch (err) {
      console.error("API test failed:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setIsVisible(true)}>
          Debug API
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[90vw]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">API Debug</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)}>
            Close
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-xs">
              <p>API URL: {process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"}</p>
              <p>Token exists: {process.env.NEXT_PUBLIC_API_TOKEN ? "Yes" : "No"}</p>
            </div>

            <Button onClick={testApi} disabled={isLoading} size="sm" className="w-full">
              {isLoading ? "Testing..." : "Test API Connection"}
            </Button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-800 overflow-auto max-h-40">
                {error}
              </div>
            )}

            {apiResponse && (
              <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-800 overflow-auto max-h-40">
                <pre>{apiResponse}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
