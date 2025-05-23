"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { normalizeImageUrl, forceApiBaseUrl, getCurrentApiBaseUrl } from "@/lib/image-utils"

export function ImageUrlFixer() {
  const [apiBaseUrl, setApiBaseUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [normalizedUrl, setNormalizedUrl] = useState("")
  const [imageLoaded, setImageLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setApiBaseUrl(getCurrentApiBaseUrl())
  }, [])

  const handleUpdateApiBaseUrl = () => {
    if (apiBaseUrl) {
      forceApiBaseUrl(apiBaseUrl)
      setApiBaseUrl(getCurrentApiBaseUrl())
      alert(`API base URL updated to: ${apiBaseUrl}`)
    }
  }

  const handleNormalizeUrl = () => {
    try {
      const normalized = normalizeImageUrl(imageUrl)
      setNormalizedUrl(normalized)
      setError(null)
      setImageLoaded(false)
    } catch (err) {
      setError(`Error normalizing URL: ${err.message}`)
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
    setError(null)
  }

  const handleImageError = () => {
    setImageLoaded(false)
    setError("Failed to load image with this URL")
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold mb-4">Image URL Fixer</h2>

      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">API Base URL</h3>
        <div className="flex gap-2">
          <Input
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
            placeholder="Enter API base URL"
            className="flex-1"
          />
          <Button onClick={handleUpdateApiBaseUrl}>Update</Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Current: {getCurrentApiBaseUrl()}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2">Test Image URL</h3>
        <div className="flex gap-2 mb-2">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image path (e.g., /uploads/medium_image.jpg)"
            className="flex-1"
          />
          <Button onClick={handleNormalizeUrl}>Test</Button>
        </div>

        {normalizedUrl && (
          <div className="mt-2">
            <p className="text-sm mb-2 break-all">Full URL: {normalizedUrl}</p>
            <div className="border p-2 rounded-md">
              <img
                src={normalizedUrl || "/placeholder.svg"}
                alt="Preview"
                className="max-h-40 mx-auto"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {imageLoaded && <p className="text-green-500 text-sm mt-2">Image loaded successfully!</p>}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-md font-semibold mb-2">Quick Fix</h3>
        <p className="text-sm mb-2">Try this URL for your specific image:</p>
        <code className="block p-2 bg-gray-100 rounded text-sm break-all">
          https://nailfeed-backend-production.up.railway.app/uploads/medium_0_e_Bay_Photoroom_2_c886184935.jpg
        </code>
        <div className="mt-2">
          <img
            src="https://nailfeed-backend-production.up.railway.app/uploads/medium_0_e_Bay_Photoroom_2_c886184935.jpg"
            alt="Direct URL test"
            className="max-h-40 mx-auto border p-1 rounded"
            onError={() => setError("Even the direct URL failed to load")}
          />
        </div>
      </div>
    </div>
  )
}
