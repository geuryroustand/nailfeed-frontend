"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

export function ReactionDebugMonitor() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [isVisible, setIsVisible] = useState(true)

  // Test API connection on mount
  useEffect(() => {
    const testConnection = async () => {
      const result = await apiClient.testConnection()
      setIsConnected(result)
    }
    testConnection()
  }, [])

  // Capture console logs
  useEffect(() => {
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    // Only capture reaction-related logs
    const shouldCaptureLog = (args: any[]) => {
      const logString = args.join(" ")
      return (
        logString.includes("Reaction") ||
        logString.includes("reaction") ||
        logString.includes("API Client") ||
        logString.includes("/api/likes")
      )
    }

    console.log = (...args) => {
      originalLog(...args)
      if (shouldCaptureLog(args)) {
        setLogs((prev) => [
          ...prev,
          `LOG: ${args.map((a) => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ")}`,
        ])
      }
    }

    console.error = (...args) => {
      originalError(...args)
      if (shouldCaptureLog(args)) {
        setLogs((prev) => [
          ...prev,
          `ERROR: ${args.map((a) => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ")}`,
        ])
      }
    }

    console.warn = (...args) => {
      originalWarn(...args)
      if (shouldCaptureLog(args)) {
        setLogs((prev) => [
          ...prev,
          `WARN: ${args.map((a) => (typeof a === "object" ? JSON.stringify(a) : a)).join(" ")}`,
        ])
      }
    }

    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  if (!isVisible) {
    return (
      <button
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg z-50"
        onClick={() => setIsVisible(true)}
      >
        Show Debug
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
      <div className="flex justify-between items-center p-2 bg-gray-100 border-b">
        <h3 className="font-medium">Reaction Debug Monitor</h3>
        <div className="flex items-center space-x-2">
          <span
            className={`inline-block w-3 h-3 rounded-full ${
              isConnected === null ? "bg-gray-400" : isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
          <span className="text-sm">
            {isConnected === null ? "Checking..." : isConnected ? "Connected" : "Disconnected"}
          </span>
          <button className="text-gray-500 hover:text-gray-700" onClick={() => setIsVisible(false)}>
            ✕
          </button>
        </div>
      </div>
      <div className="p-2 bg-gray-50 border-b flex justify-between">
        <button
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
          onClick={() => apiClient.testConnection().then(setIsConnected)}
        >
          Test Connection
        </button>
        <button className="text-xs bg-gray-500 text-white px-2 py-1 rounded" onClick={() => setLogs([])}>
          Clear Logs
        </button>
      </div>
      <div className="overflow-y-auto max-h-[60vh] p-2 bg-gray-900 text-gray-100">
        {logs.length === 0 ? (
          <p className="text-gray-400 text-sm p-2">No logs yet. Try reacting to a post.</p>
        ) : (
          logs.map((log, i) => {
            const isError = log.startsWith("ERROR")
            const isWarn = log.startsWith("WARN")
            return (
              <div
                key={i}
                className={`text-xs font-mono mb-1 p-1 ${
                  isError ? "text-red-400" : isWarn ? "text-yellow-400" : "text-green-400"
                }`}
              >
                {log}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
