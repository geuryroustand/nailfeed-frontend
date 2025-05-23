"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { normalizeImageUrl, extractMediaUrl, debugImageUrl } from "@/lib/image-utils"
import { SafeImage } from "./safe-image"
import { checkApiConnection } from "@/lib/api-connection-checker"

export function ImageTroubleshooter() {
  const [imageUrl, setImageUrl] = useState("")
  const [normalizedUrl, setNormalizedUrl] = useState("")
  const [apiStatus, setApiStatus] = useState<{
    isConnected: boolean
    latency: number | null
    error: string | null
  } | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [imageObject, setImageObject] = useState<any>(null)
  const [jsonInput, setJsonInput] = useState("")
  const [jsonError, setJsonError] = useState<string | null>(null)

  const handleNormalizeUrl = () => {
    if (!imageUrl) return

    const normalized = normalizeImageUrl(imageUrl)
    setNormalizedUrl(normalized)
    debugImageUrl(imageUrl)
  }

  const handleCheckApi = async () => {
    setIsChecking(true)
    try {
      const result = await checkApiConnection()
      setApiStatus({
        isConnected: result.isConnected,
        latency: result.latency,
        error: result.error,
      })
    } catch (error) {
      setApiStatus({
        isConnected: false,
        latency: null,
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleParseJson = () => {
    if (!jsonInput) return

    try {
      const parsed = JSON.parse(jsonInput)
      setImageObject(parsed)
      setJsonError(null)

      // Try to extract URL
      const extractedUrl = extractMediaUrl(parsed)
      if (extractedUrl) {
        setNormalizedUrl(extractedUrl)
      }
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : String(error))
      setImageObject(null)
    }
  }

  return (
    <div className="space-y-6 p-4 bg-white rounded-lg shadow">
      <div>
        <h2 className="text-lg font-semibold mb-2">Image URL Troubleshooter</h2>
        <p className="text-sm text-gray-500 mb-4">Use this tool to diagnose and fix image loading issues</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <div className="flex gap-2">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL to test"
              className="flex-1"
            />
            <Button onClick={handleNormalizeUrl}>Normalize</Button>
          </div>
        </div>

        {normalizedUrl && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium mb-2">Normalized URL:</p>
            <p className="text-sm break-all mb-4">{normalizedUrl}</p>

            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Preview:</p>
              <div className="border border-gray-200 rounded-lg p-2 bg-white">
                <SafeImage src={normalizedUrl} alt="Preview" className="max-h-40 mx-auto object-contain" />
              </div>
            </div>
          </div>
        )}

        <div>
          <Button onClick={handleCheckApi} disabled={isChecking} className="w-full">
            {isChecking ? "Checking API..." : "Check API Connection"}
          </Button>

          {apiStatus && (
            <div className={`mt-2 p-3 rounded-lg ${apiStatus.isConnected ? "bg-green-50" : "bg-red-50"}`}>
              <p className={`text-sm font-medium ${apiStatus.isConnected ? "text-green-700" : "text-red-700"}`}>
                API is {apiStatus.isConnected ? "online" : "offline"}
                {apiStatus.latency && ` (${apiStatus.latency}ms)`}
              </p>
              {apiStatus.error && <p className="text-sm text-red-600 mt-1">{apiStatus.error}</p>}
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-1">Parse Media Object JSON</label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste JSON media object to extract URL"
            className="w-full h-32 p-2 border rounded-md text-sm font-mono"
          />
          <div className="flex justify-end mt-2">
            <Button onClick={handleParseJson}>Parse JSON</Button>
          </div>

          {jsonError && <p className="text-sm text-red-600 mt-2">{jsonError}</p>}

          {imageObject && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Extracted URL:</p>
              <p className="text-sm break-all mb-4">{extractMediaUrl(imageObject) || "No URL found"}</p>

              {extractMediaUrl(imageObject) && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <div className="border border-gray-200 rounded-lg p-2 bg-white">
                    <SafeImage
                      src={extractMediaUrl(imageObject)!}
                      alt="Preview"
                      className="max-h-40 mx-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
