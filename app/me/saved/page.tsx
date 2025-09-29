import Link from "next/link"
import { redirect } from "next/navigation"
import { Bookmark, Compass, Sparkles } from "lucide-react"
import { verifySession } from "@/lib/auth/session"
import { fetchSavedPosts } from "@/lib/services/saved-posts-service"
import SavedPostsGrid from "@/components/saved/saved-posts-grid"
import { formatBackendDate } from "@/lib/date-utils"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SavedPostsPage() {
  const session = await verifySession()

  if (!session) {
    redirect("/auth?callbackUrl=/me/saved")
  }

  try {
    const savedPosts = await fetchSavedPosts()
    const hasSavedPosts = savedPosts.items.length > 0
    const latestSaved = hasSavedPosts ? savedPosts.items[0]?.savedAt : null
    const lastSavedLabel = latestSaved ? formatBackendDate(latestSaved) : null

    return (
      <main className="min-h-screen bg-gradient-to-b from-secondary via-background to-background">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
          <section
            aria-labelledby="saved-posts-heading"
            className="relative overflow-hidden rounded-4xl border border-border bg-card/80 p-8 shadow-[0_25px_80px_-45px_hsl(var(--primary)/0.25)] backdrop-blur"
          >
            <div
              className="absolute inset-y-0 right-0 hidden w-1/2 translate-x-1/3 rounded-full bg-gradient-to-br from-primary/20 via-background/40 to-accent/20 blur-3xl md:block"
              aria-hidden
            />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center">
              <div className="space-y-5">
                <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                  <Bookmark className="h-3.5 w-3.5" aria-hidden /> Saved inspiration
                </p>
                <div className="space-y-4">
                  <h1 id="saved-posts-heading" className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                    Your curated library of looks.
                  </h1>
                  <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                    Revisit designs you loved, keep track of artists that inspire you, and build a mood board that evolves with your style.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 text-sm" aria-label="Saved posts summary">
                  <span className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-muted-foreground shadow-sm backdrop-blur">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                    <span className="font-semibold text-foreground">{savedPosts.total}</span>
                    <span className="text-muted-foreground">saved {savedPosts.total === 1 ? "post" : "posts"}</span>
                  </span>
                  {hasSavedPosts && lastSavedLabel && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-muted-foreground shadow-sm backdrop-blur">
                      <Compass className="h-4 w-4 text-primary" aria-hidden />
                      <span className="text-muted-foreground">Last saved {lastSavedLabel}</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card/90 p-6 text-center shadow-inner backdrop-blur">
                <h2 className="text-lg font-semibold text-foreground">Keep discovering</h2>
                <p className="text-sm text-muted-foreground">
                  Explore new nail art trends, seasonal palettes, and curated collections from artists around the world.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/explore"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95"
                  >
                    Explore feed
                  </Link>
                  <Link
                    href="/collections"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-input bg-background px-5 py-2 text-sm font-semibold text-primary shadow-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:border-primary/20 hover:shadow-md hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95"
                  >
                    View collections
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="saved-gallery-heading" className="mt-12 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h2 id="saved-gallery-heading" className="text-xl font-semibold text-foreground sm:text-2xl">
                Saved looks
              </h2>
              {hasSavedPosts && (
                <p className="text-sm text-muted-foreground">Tap any card to open the post and manage your collections.</p>
              )}
            </div>

            {hasSavedPosts ? (
              <SavedPostsGrid items={savedPosts.items} />
            ) : (
              <div className="relative overflow-hidden rounded-4xl border border-dashed border-border bg-card/70 px-8 py-16 text-center shadow-sm">
                <div
                  className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/10 via-background/60 to-transparent"
                  aria-hidden
                />
                <div className="relative z-10 mx-auto max-w-2xl space-y-5">
                  <h3 className="text-2xl font-semibold text-foreground">You don&apos;t have any saved posts yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Start saving designs you love. They&apos;ll appear here in a beautifully organized grid so you can revisit them anytime.
                  </p>
                  <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      href="/explore"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95"
                    >
                      Browse trending designs
                    </Link>
                    <Link
                      href="/collections"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-input bg-background px-5 py-2 text-sm font-semibold text-primary shadow-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:border-primary/20 hover:shadow-md hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95"
                    >
                      See curated collections
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    )
  } catch (error) {
    console.error("Failed to load saved posts", error)

    return (
      <main className="min-h-screen bg-gradient-to-b from-secondary via-background to-background">
        <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-24 text-center sm:px-6">
          <div
            role="alert"
            className="space-y-4 rounded-3xl border border-destructive/20 bg-destructive/10 p-10 text-destructive shadow-sm"
          >
            <h2 className="text-2xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-destructive/80">We couldn&apos;t load your saved posts. Please refresh the page or try again in a moment.</p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/me/saved"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-destructive px-5 py-2 text-sm font-semibold text-destructive-foreground shadow-md transition-all duration-200 hover:bg-destructive/90 hover:shadow-lg hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive active:scale-95"
              >
                Try again
              </Link>
              <Link
                href="/explore"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-input bg-background px-5 py-2 text-sm font-semibold text-destructive shadow-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:border-destructive/20 hover:shadow-md hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95"
              >
                Go to explore
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }
}
