import { Suspense } from "react"
import type { Metadata } from "next"
import { listTutorials } from "@/lib/tutorials"
import TutorialFilters from "@/components/tutorials/tutorial-filters"
import TutorialGrid from "@/components/tutorials/tutorial-grid"
import TutorialGridSkeleton from "@/components/tutorials/tutorial-grid-skeleton"
import type { TutorialFilters as TutorialFiltersType } from "@/types/tutorial"

export const metadata: Metadata = {
  title: "Tutorials",
  description: "Learn step-by-step nail art techniques—from beginner to pro.",
}

interface TutorialsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function TutorialsContent({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const filters: TutorialFiltersType = {
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    level: typeof searchParams.level === "string" ? (searchParams.level as any) : undefined,
    technique: typeof searchParams.technique === "string" ? (searchParams.technique as any) : undefined,
    duration: typeof searchParams.duration === "string" ? (searchParams.duration as any) : undefined,
  }

  const page = typeof searchParams.page === "string" ? Number.parseInt(searchParams.page, 10) : 1
  const response = await listTutorials(filters, page, 12)

  return <TutorialGrid tutorials={response.data} />
}

export default async function TutorialsPage({ searchParams }: TutorialsPageProps) {
  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-balance">Tutorials</h1>
          <p className="text-lg text-muted-foreground text-pretty">
            Learn step-by-step nail art techniques—from beginner to pro.
          </p>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4">
              <TutorialFilters />
            </div>
          </aside>

          {/* Tutorials Grid */}
          <div className="lg:col-span-3">
            <Suspense fallback={<TutorialGridSkeleton count={12} />}>
              <TutorialsContent searchParams={params} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
