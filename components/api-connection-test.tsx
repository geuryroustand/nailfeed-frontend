"use client"

import { useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ApiConnectionTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const testConnection = async () => {
    setIsLoading(true)
    try {
      console.log("Testing API connection...")
      const connected = await apiClient.testConnection()
      setResult({
        success: connected,
        message: connected ? "Successfully connected to API" : "Failed to connect to API",
      })
    } catch (error) {
      console.error("Error testing connection:", error)
      setResult({
        success: false,
        message: `Error: ${error.message || "Unknown error"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testLikeEndpoint = async () => {
    setIsLoading(true)
    try {
      console.log("Testing /api/likes endpoint...")
      const response = await apiClient.get("/api/likes")
      console.log("Response:", response)
      setResult({
        success: true,
        message: `Successfully connected to /api/likes. Status: ${response.status}`,
      })
    } catch (error) {
      console.error("Error testing /api/likes:", error)
      setResult({
        success: false,
        message: `Error: ${error.message || "Unknown error"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>API Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button onClick={testConnection} disabled={isLoading}>
            {isLoading ? "Testing..." : "Test API Connection"}
          </Button>
          <Button onClick={testLikeEndpoint} disabled={isLoading} variant="outline">
            {isLoading ? "Testing..." : "Test Likes Endpoint"}
          </Button>
        </div>
        {result && (
          <div
            className={`p-3 rounded-md ${result.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {result.message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
