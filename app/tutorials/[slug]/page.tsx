import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Clock, Heart, MessageCircle, Bookmark, Eye, ChevronLeft } from "lucide-react"
import { getTutorialBySlug } from "@/lib/tutorials"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import TutorialStep from "@/components/tutorials/tutorial-step"
import { formatDuration, getLevelBadgeVariant, getTechniqueLabel, getLevelLabel } from "@/lib/tutorial-helpers"

interface TutorialDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TutorialDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const response = await getTutorialBySlug(slug)

  if (!response) {
    return {
      title: "Tutorial Not Found",
    }
  }

  const tutorial = response.data

  return {
    title: tutorial.title,
    description: tutorial.description,
  }
}

export default async function TutorialDetailPage({ params }: TutorialDetailPageProps) {
  const { slug } = await params
  const response = await getTutorialBySlug(slug)

  if (!response) {
    notFound()
  }

  const tutorial = response.data

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/tutorials"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          Back to Tutorials
        </Link>

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant={getLevelBadgeVariant(tutorial.level)}>{getLevelLabel(tutorial.level)}</Badge>
            <Badge variant="outline">{getTechniqueLabel(tutorial.technique)}</Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {formatDuration(tutorial.duration)}
            </Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-balance">{tutorial.title}</h1>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <Link
              href={`/profile/${tutorial.user.username}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-lg font-semibold">
                  {(tutorial.user.displayName || tutorial.user.username).charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{tutorial.user.displayName || tutorial.user.username}</span>
                  {tutorial.user.isVerified && (
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified">
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">@{tutorial.user.username}</span>
              </div>
            </Link>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1" aria-label={`${tutorial.likesCount} likes`}>
                <Heart className="w-4 h-4" aria-hidden="true" />
                {tutorial.likesCount}
              </span>
              <span className="flex items-center gap-1" aria-label={`${tutorial.commentsCount} comments`}>
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                {tutorial.commentsCount}
              </span>
              <span className="flex items-center gap-1" aria-label={`${tutorial.viewsCount} views`}>
                <Eye className="w-4 h-4" aria-hidden="true" />
                {tutorial.viewsCount}
              </span>
            </div>
          </div>
        </header>

        {/* Media Section */}
        {(tutorial.videoUrl || tutorial.thumbnail) && (
          <section className="mb-8">
            {tutorial.videoUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  controls
                  className="w-full h-full"
                  poster={tutorial.thumbnail?.url}
                  aria-label={`Video tutorial: ${tutorial.title}`}
                >
                  <source src={tutorial.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : tutorial.thumbnail ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={tutorial.thumbnail.url || "/placeholder.svg"}
                  alt={tutorial.thumbnail.alternativeText || tutorial.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 896px"
                />
              </div>
            ) : null}
          </section>
        )}

        {/* Actions */}
        <div className="flex gap-3 mb-8">
          <Button variant="default" size="lg" className="flex-1">
            <Heart className="w-5 h-5 mr-2" aria-hidden="true" />
            Like
          </Button>
          <Button variant="outline" size="lg" className="flex-1 bg-transparent">
            <Bookmark className="w-5 h-5 mr-2" aria-hidden="true" />
            Save to Look Book
          </Button>
        </div>

        {/* Description */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>About This Tutorial</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{tutorial.description}</p>
          </CardContent>
        </Card>

        {/* Materials */}
        {tutorial.materials.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Materials Needed</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2" role="list">
                {tutorial.materials.map((material) => (
                  <li key={material.id} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      <strong>{material.name}</strong>
                      {material.brand && <span className="text-muted-foreground"> - {material.brand}</span>}
                      {material.optional && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Optional
                        </Badge>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Steps */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Step-by-Step Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {tutorial.steps.map((step, index) => (
                <div key={step.id}>
                  <TutorialStep step={step} />
                  {index < tutorial.steps.length - 1 && <Separator className="mt-8" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comments Section Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Comments ({tutorial.commentsCount})</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">Comments section coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
