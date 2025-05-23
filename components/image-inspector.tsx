"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SafePostImage } from "./safe-post-image"

export function ImageInspector() {
  const [imageUrl, setImageUrl] = useState("")
  const [testUrl, setTestUrl] = useState("")
  const [showInspector, setShowInspector] = useState(false)

  const handleTest = () => {
    setTestUrl(imageUrl)
  }

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>Image Inspector</span>
          <Button variant="outline" size="sm" onClick={() => setShowInspector(!showInspector)}>
            {showInspector ? "Hide" : "Show"}
          </Button>
        </CardTitle>
      </CardHeader>

      {showInspector && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter image URL from Related Posts"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleTest}>Test</Button>
            </div>

            {testUrl && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">SafePostImage Component:</h3>
                  <SafePostImage src={testUrl} alt="Test image" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Regular Next.js Image:</h3>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={testUrl || "/placeholder.svg"}
                      alt="Test image"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Regular img error:", testUrl)
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <h3 className="text-sm font-medium">URL Details:</h3>
                  <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-x-auto">{testUrl}</pre>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
