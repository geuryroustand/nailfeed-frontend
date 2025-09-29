import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { Bookmark, Heart, MessageCircle } from "lucide-react"
import { formatBackendDate } from "@/lib/date-utils"
import type { SavedPostItem } from "@/lib/services/saved-posts-service"

interface SavedPostsGridProps {
  items: SavedPostItem[]
}

export default function SavedPostsGrid({ items }: SavedPostsGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Saved posts grid">
      {items.map(item => (
        <SavedPostCard key={item.id ?? item.post.id} item={item} />
      ))}
    </div>
  )
}

interface SavedPostCardProps {
  item: SavedPostItem
}

function SavedPostCard({ item }: SavedPostCardProps) {
  const post = item.post
  const postId = post.documentId ? "/post/" + post.documentId : "/post/" + post.id
  const coverImage = typeof post.image === "string" && post.image.length > 0 ? post.image : "/intricate-nail-art.png"
  const avatar = typeof post.userImage === "string" && post.userImage.length > 0 ? post.userImage : "/diverse-user-avatars.png"
  const savedLabel = formatBackendDate(item.savedAt)
  const description = post.description && post.description.trim() ? post.description.trim() : ""
  const title = post.title && post.title.trim() ? post.title.trim() : "Saved design"
  const tags = Array.isArray(post.tags) ? post.tags.slice(0, 3) : []
  const ariaLabel = title ? "Open saved post titled " + title : "Open saved post"
  const usernameLabel = post.username || (post.user && post.user.username) || "Creator"

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/20 focus-within:ring-2 focus-within:ring-ring focus-within:outline-none"
      role="listitem"
    >
      <div className="relative h-64 w-full overflow-hidden">
        <Image
          src={coverImage}
          alt={title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/75 via-gray-900/25 to-transparent" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-5 pb-5 text-white">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/30 bg-white/20">
              <Image src={avatar} alt={usernameLabel + " profile image"} fill sizes="40px" className="object-cover" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold leading-none text-white">{usernameLabel}</p>
              <p className="text-xs text-white/80">Saved {savedLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-xs font-medium">
            <Stat icon={<Heart className="h-3.5 w-3.5" aria-hidden />} label={formatCount(post.likesCount ?? post.likes ?? 0)} />
            <Stat
              icon={<MessageCircle className="h-3.5 w-3.5" aria-hidden />} label={formatCount(post.commentsCount ?? (Array.isArray(post.comments) ? post.comments.length : 0))}
            />
            <Stat icon={<Bookmark className="h-3.5 w-3.5" aria-hidden />} label={formatCount(post.savesCount ?? 0)} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 py-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground line-clamp-2">{title}</h3>
          {description && <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>}
        </div>
        {tags.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Post tags">
            {tags.map(tag => (
              <li key={tag} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                #{tag}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href={postId} className="absolute inset-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label={ariaLabel} />
    </article>
  )
}

interface StatProps {
  icon: ReactNode
  label: string
}

function Stat({ icon, label }: StatProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-white">
      {icon}
      <span className="font-semibold">{label}</span>
    </span>
  )
}

function formatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "0"
  }

  if (value >= 1000000) {
    const formatted = (value / 1000000).toFixed(1)
    return formatted.endsWith(".0") ? formatted.slice(0, -2) + "M" : formatted + "M"
  }

  if (value >= 1000) {
    const formatted = (value / 1000).toFixed(1)
    return formatted.endsWith(".0") ? formatted.slice(0, -2) + "K" : formatted + "K"
  }

  return String(value)
}
