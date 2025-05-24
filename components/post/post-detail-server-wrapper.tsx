import { PostDetailClient } from "./post-detail-client"
import { getPost } from "@/lib/data"
import { notFound } from "next/navigation"

interface PostDetailServerWrapperProps {
  slug: string
}

export async function PostDetailServerWrapper({ slug }: PostDetailServerWrapperProps) {
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return <PostDetailClient title={post.title} content={post.content} date={post.date} slug={post.slug} />
}
