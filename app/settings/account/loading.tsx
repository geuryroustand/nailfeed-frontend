import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-pink-500" />
        <p className="mt-2 text-gray-600">Loading your account settings...</p>
      </div>
    </div>
  )
}
