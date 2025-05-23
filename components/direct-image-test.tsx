"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function DirectImageTest() {
  const [imageUrl, setImageUrl] = useState("")
  const [testUrl, setTestUrl] = useState("")
  const [error, setError] = useState(false)

  const handleTest = () => {
    setTestUrl(imageUrl)
    setError(false)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Direct Image URL Test</h3>
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter image URL to test"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleTest} size="sm">
          Test
        </Button>
      </div>
      {testUrl && (
        <div className="space-y-2">
          <div className="aspect-video relative rounded overflow-hidden bg-gray-100">
            <Image
              src={testUrl || "/placeholder.svg"}
              alt="Test image"
              fill
              className="object-cover"
              onError={() => setError(true)}
            />
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <p className="text-red-500">Failed to load image</p>
              </div>
            )}
          </div>
          <p className="text-xs break-all">{testUrl}</p>
        </div>
      )}
    </div>
  )
}
