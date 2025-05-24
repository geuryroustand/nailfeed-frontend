"use client"

import { useEffect, useState } from "react"

export default function DebugImageUrl() {
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch a single post with the exact URL structure we need
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nailfeed-backend-production.up.railway.app"
        const response = await fetch(
          `${apiUrl}/api/posts?populate[mediaItems][populate][file][fields][0]=formats&populate[user][fields][0]=username&limit=1`,
        )

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data = await response.json()

        if (data.data && data.data.length > 0) {
          const post = data.data[0]

          // Extract the image URL information
          const imageInfo = {
            postId: post.id,
            hasMediaItems: !!post.mediaItems && Array.isArray(post.mediaItems),
            mediaItemsCount: post.mediaItems ? post.mediaItems.length : 0,
            firstMediaItem: post.mediaItems && post.mediaItems.length > 0 ? post.mediaItems[0] : null,
            fileInfo: null,
            formats: null,
            mediumUrl: null,
            constructedUrl: null,
          }

          // If we have media items, extract more details
          if (imageInfo.firstMediaItem) {
            const mediaItem = post.mediaItems[0]
            imageInfo.fileInfo = mediaItem.file || null

            if (mediaItem.file && mediaItem.file.formats) {
              imageInfo.formats = Object.keys(mediaItem.file.formats)

              // Get the medium format URL
              const mediumFormat = mediaItem.file.formats.medium
              if (mediumFormat) {
                imageInfo.mediumUrl = mediumFormat.url

                // Construct the full URL
                imageInfo.constructedUrl = `${apiUrl}${mediumFormat.url}`
              }
            }
          }

          setDebugInfo(imageInfo)
        }
      } catch (error) {
        console.error("Error fetching debug data:", error)
        setDebugInfo({ error: String(error) })
      }
    }

    fetchData()
  }, [])

  if (!debugInfo) {
    return <div className="p-4 bg-gray-100 rounded">Loading debug information...</div>
  }

  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold mb-2">Image URL Debug</h3>

      {debugInfo.error ? (
        <div className="text-red-500">Error: {debugInfo.error}</div>
      ) : (
        <div className="space-y-2 text-sm">
          <p>Post ID: {debugInfo.postId}</p>
          <p>Has Media Items: {debugInfo.hasMediaItems ? "Yes" : "No"}</p>
          <p>Media Items Count: {debugInfo.mediaItemsCount}</p>

          {debugInfo.firstMediaItem && (
            <>
              <p>First Media Item ID: {debugInfo.firstMediaItem.id}</p>
              <p>Has File Info: {debugInfo.fileInfo ? "Yes" : "No"}</p>

              {debugInfo.formats && <p>Available Formats: {debugInfo.formats.join(", ")}</p>}

              {debugInfo.mediumUrl && (
                <>
                  <p>Medium URL (relative): {debugInfo.mediumUrl}</p>
                  <p>Constructed URL (full): {debugInfo.constructedUrl}</p>

                  <div className="mt-4">
                    <p className="font-bold">Test Image:</p>
                    <img
                      src={debugInfo.constructedUrl || "/placeholder.svg"}
                      alt="Test"
                      className="mt-2 max-w-full h-auto border border-gray-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = "/abstract-pastel-swirls.png"
                        target.title = "Image failed to load"
                      }}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
