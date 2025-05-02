"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MediaUploadService } from "@/lib/services/media-upload-service"

export function MediaUploadTest() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      // Get token from localStorage or sessionStorage
      const token = localStorage.getItem("jwt") || sessionStorage.getItem("jwt") || ""

      // Test the upload
      const uploadResult = await MediaUploadService.uploadFiles([file], token)
      setResult(uploadResult)
      console.log("Upload successful:", uploadResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      console.error("Upload failed:", err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Media Upload Test</h2>

      <div className="mb-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-gray-50 file:text-gray-700
            hover:file:bg-gray-100"
        />
      </div>

      <Button onClick={handleUpload} disabled={!file || uploading} className="mb-4">
        {uploading ? "Uploading..." : "Test Upload"}
      </Button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 mb-4">
          <p className="font-medium">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-600">
          <p className="font-medium">Upload Successful:</p>
          <pre className="text-xs mt-2 overflow-auto max-h-40">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
