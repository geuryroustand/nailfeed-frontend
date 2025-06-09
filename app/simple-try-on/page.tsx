import SimpleNailTryOn from "@/components/simple-nail-try-on"

export default function SimpleTryOnPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Simple Nail Try-On</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload a photo of your hand and a nail design to see how it would look. Our simple detection algorithm will
            automatically place the design on your nails.
          </p>
        </div>
        <SimpleNailTryOn />
      </div>
    </div>
  )
}
