"use client"

import { useEffect, useState } from "react"
import { checkApiConnection } from "@/lib/api-connection-checker"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

export default function ApiStatusIndicator() {
  const [status, setStatus] = useState<{
    isConnected: boolean
    latency: number | null
    error: string | null
    lastChecked: Date
  }>({
    isConnected: false,
    latency: null,
    error: null,
    lastChecked: new Date(),
  })
  const [isChecking, setIsChecking] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      const result = await checkApiConnection()
      setStatus({
        ...result,
        lastChecked: new Date(),
      })
    } catch (error) {
      setStatus({
        isConnected: false,
        latency: null,
        error: error instanceof Error ? error.message : String(error),
        lastChecked: new Date(),
      })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    // Only run in development environment
    if (process.env.NODE_ENV === "production") {
      setIsVisible(false)
      return
    }

    checkConnection()

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white rounded-md shadow-md p-2 flex items-center space-x-2">
        {isChecking ? (
          <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
        ) : status.isConnected ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}

        <span className="text-xs font-medium">
          API:{" "}
          {isChecking ? (
            "Checking..."
          ) : status.isConnected ? (
            <span className="text-green-600">Online</span>
          ) : (
            <span className="text-red-600">Offline</span>
          )}
        </span>

        {status.latency !== null && status.isConnected && (
          <span className="text-xs text-gray-500 ml-1">({status.latency}ms)</span>
        )}

        <button
          onClick={checkConnection}
          disabled={isChecking}
          className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          <RefreshCw className="h-3 w-3" />
        </button>
      </div>

      {status.error && (
        <div className="mt-1 bg-white rounded-md shadow-md p-2">
          <p className="text-xs text-red-500 max-w-[200px] break-words">{status.error}</p>
        </div>
      )}
    </div>
  )
}
