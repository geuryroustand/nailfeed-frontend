"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import config from "@/lib/config"
import { Alert, AlertCircle, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ApiResponseViewer() {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchApiResponse = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const apiUrl = config.api.getFullApiUrl("/api/posts?pagination[pageSize]=1")

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.api.getApiToken()}`,
        },
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      setResponse(data)
    } catch (error) {
      console.error("Error fetching API response:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isVisible) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsVisible(true)} className="mb-4">
        View API Response
      </Button>
    )
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>API Response Viewer</CardTitle>
        <CardDescription>View the raw API response to understand its structure</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={fetchApiResponse} disabled={isLoading} className="mb-4">
          {isLoading ? "Loading..." : "Fetch API Response"}
        </Button>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {response && (
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
            <pre className="text-xs">{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => setIsVisible(false)}>
          Close
        </Button>
      </CardFooter>
    </Card>
  )
}
