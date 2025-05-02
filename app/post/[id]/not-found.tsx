import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"

export default function PostNotFound() {
  return (
    <div className="container max-w-md mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
        <p className="text-gray-600 mb-6">The post you're looking for doesn't exist or may have been removed.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/explore">
              <Search className="mr-2 h-4 w-4" />
              Explore Posts
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
