"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ImageUrlDebugger() {
  const [imageUrl, setImageUrl] = useState("")
  const [testUrl, setTestUrl] = useState("")
  const [imageLoaded, setImageLoaded] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testImage = () => {
    if (!testUrl) return

    setImageUrl(testUrl)
    setImageLoaded(null)
    setError(null)

    const img = new Image()
    img.onload = () => {
      setImageLoaded(true)
      setError(null)
    }
    img.onerror = () => {
      setImageLoaded(false)
      setError("Failed to load image")
    }
    img.src = testUrl
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Image URL Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image-url">Test Image URL</Label>
            <div className="flex space-x-2">
              <Input
                id="image-url"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="Enter image URL to test"
              />
              <Button onClick={testImage}>Test</Button>
            </div>
          </div>

          {imageUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Status:{" "}
                {imageLoaded === null
                  ? "Testing..."
                  : imageLoaded
                    ? "✅ Image loaded successfully"
                    : "❌ Failed to load image"}
              </p>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="border rounded-md p-2 bg-gray-50">
                <p className="text-xs text-gray-500 mb-2">Image Preview:</p>
                <div className="aspect-square max-w-[200px] bg-gray-100 flex items-center justify-center">
                  {imageLoaded !== false ? (
                    <img
                      src={imageUrl || "/placeholder.svg"}
                      alt="Test image"
                      className="max-w-full max-h-full object-contain"
                      onError={() => {
                        setImageLoaded(false)
                        setError("Failed to load image in preview")
                      }}
                    />
                  ) : (
                    <p className="text-sm text-gray-500">Image failed to load</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
