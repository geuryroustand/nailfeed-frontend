import ImageUrlDebugger from "@/components/explore/image-url-debugger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DebugImagesPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">Image Debugging</h1>

      <ImageUrlDebugger />

      <Card>
        <CardHeader>
          <CardTitle>API Response Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Use this page to debug image loading issues.</p>
        </CardContent>
      </Card>
    </div>
  )
}
