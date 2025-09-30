import Link from "next/link"
import Image from "next/image"
import { Clock, Heart, Bookmark, Eye } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Tutorial } from "@/types/tutorial"
import { formatDuration, getLevelBadgeVariant, getTechniqueLabel, getLevelLabel } from "@/lib/tutorial-helpers"

interface TutorialCardProps {
  tutorial: Tutorial
}

export default function TutorialCard({ tutorial }: TutorialCardProps) {
  return (
    <article className="group">
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <Link href={`/tutorials/${tutorial.slug}`} className="block">
          <div className="relative aspect-[3/2] overflow-hidden bg-gray-100">
            <Image
              src={tutorial.thumbnail?.url || "/placeholder.svg?height=400&width=600"}
              alt={tutorial.thumbnail?.alternativeText || tutorial.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute top-3 right-3 flex gap-2">
              <Badge variant={getLevelBadgeVariant(tutorial.level)} className="shadow-sm">
                {getLevelLabel(tutorial.level)}
              </Badge>
            </div>
          </div>
        </Link>

        <CardContent className="p-4">
          <Link href={`/tutorials/${tutorial.slug}`}>
            <h3 className="text-lg font-semibold leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {tutorial.title}
            </h3>
          </Link>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link href={`/profile/${tutorial.user.username}`} className="hover:text-foreground transition-colors">
              {tutorial.user.displayName || tutorial.user.username}
            </Link>
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

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="outline" className="text-xs">
              {getTechniqueLabel(tutorial.technique)}
            </Badge>
            <Badge variant="outline" className="text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {formatDuration(tutorial.duration)}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1" aria-label={`${tutorial.likesCount} likes`}>
              <Heart className="w-4 h-4" aria-hidden="true" />
              {tutorial.likesCount}
            </span>
            <span className="flex items-center gap-1" aria-label={`${tutorial.viewsCount} views`}>
              <Eye className="w-4 h-4" aria-hidden="true" />
              {tutorial.viewsCount}
            </span>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
            aria-label={`Save ${tutorial.title} to Look Book`}
          >
            <Bookmark className="w-4 h-4 mr-2" aria-hidden="true" />
            Save to Look Book
          </Button>
        </CardFooter>
      </Card>
    </article>
  )
}
