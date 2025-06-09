import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

const FabricTryOnComponent = dynamic(() => import("@/components/virtual-try-on/fabric-try-on-component"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 flex items-center justify-center bg-gray-100 rounded-md border-2 border-dashed">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      <p className="ml-2 text-gray-600">Loading Virtual Try-On Canvas...</p>
    </div>
  ),
})

export default function VirtualTryOnPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-6">Virtual Try-On</h1>
      <FabricTryOnComponent />
    </div>
  )
}
