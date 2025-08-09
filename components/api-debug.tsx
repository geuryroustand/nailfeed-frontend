"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type EnvStatus = {
  tokenExists: boolean
  apiUrl: string
}

export default function ApiDebug() {
  const [isVisible, setIsVisible] = useState(false)
  const [apiResponse, setApiResponse] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null)

  useEffect(() => {
    const loadEnv = async () => {
      try {
        const res = await fetch("/api/env/status", { cache: "no-store" })
        const data = (await res.json()) as EnvStatus
        setEnvStatus(data)
      } catch {
        setEnvStatus({ tokenExists: false, apiUrl: "" })
      }
    }
    loadEnv()
  }, [])

  const testApi = async () => {
    setIsLoading(true)
    setError(null)
    setApiResponse(null)

    try {
      // Use server proxy so secrets are never exposed client-side
      const response = await fetch("/api/auth-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: "/api/posts?populate=*",
          method: "GET",
        }),
      })

      const text = await response.text()
      if (!response.ok) {
        throw new Error(`API error (${response.status}): ${text}`)
      }

      try {
        const json = JSON.parse(text)
        setApiResponse(JSON.stringify(json, null, 2))
      } catch {
        setApiResponse(text)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setIsVisible(true)} aria-label="Open API Debug">
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
          <Button variant="ghost" size="sm" onClick={() => setIsVisible(false)} aria-label="Close API Debug">
            Close
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-xs">
              <p>API URL: {envStatus?.apiUrl || "Not set"}</p>
              <p>Token exists: {envStatus?.tokenExists ? "Yes" : "No"}</p>
            </div>

            <Button
              onClick={testApi}
              disabled={isLoading}
              size="sm"
              className="w-full"
              aria-label="Test API Connection"
            >
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
