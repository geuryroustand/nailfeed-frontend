"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { normalizeImageUrl, extractMediaUrl } from "@/lib/image-utils"

export function ImageDebug() {
  const [imageUrl, setImageUrl] = useState("")
  const [normalizedUrl, setNormalizedUrl] = useState("")
  const [imageLoaded, setImageLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jsonData, setJsonData] = useState("")
  const [extractedUrl, setExtractedUrl] = useState("")

  const handleNormalizeUrl = () => {
    try {
      const normalized = normalizeImageUrl(imageUrl)
      setNormalizedUrl(normalized)
      setError(null)
    } catch (err) {
      setError(`Error normalizing URL: ${err.message}`)
    }
  }

  const handleExtractUrl = () => {
    try {
      const data = JSON.parse(jsonData)
      const url = extractMediaUrl(data)
      setExtractedUrl(url || "No URL could be extracted")
      setError(null)
    } catch (err) {
      setError(`Error parsing JSON or extracting URL: ${err.message}`)
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <h2 className="text-lg font-bold mb-4">Image URL Debugger</h2>

      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2">Normalize URL</h3>
        <div className="flex gap-2 mb-2">
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Enter image URL"
            className="flex-1"
          />
          <Button onClick={handleNormalizeUrl}>Normalize</Button>
        </div>
        {normalizedUrl && (
          <div className="mt-2">
            <p className="text-sm mb-2">Normalized URL: {normalizedUrl}</p>
            <div className="border p-2 rounded-md">
              <img
                src={normalizedUrl || "/placeholder.svg"}
                alt="Preview"
                className="max-h-40 mx-auto"
                onLoad={() => setImageLoaded(true)}
                onError={() => setError("Failed to load image")}
              />
              {imageLoaded && <p className="text-green-500 text-sm mt-2">Image loaded successfully!</p>}
            </div>
          </div>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-md font-semibold mb-2">Extract URL from JSON</h3>
        <textarea
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          placeholder="Paste JSON media item data"
          className="w-full h-32 p-2 border rounded-md mb-2"
        />
        <Button onClick={handleExtractUrl} className="w-full">
          Extract URL
        </Button>
        {extractedUrl && (
          <div className="mt-2">
            <p className="text-sm mb-2">Extracted URL: {extractedUrl}</p>
            <div className="border p-2 rounded-md">
              <img
                src={extractedUrl || "/placeholder.svg"}
                alt="Preview"
                className="max-h-40 mx-auto"
                onError={() => setError("Failed to load extracted image")}
              />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  )
}
