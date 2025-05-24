"use server"

import { revalidateTag, unstable_cache } from "next/cache"
import type { Metadata } from "next"

// Cache tags for targeted revalidation
const CACHE_TAGS = {
  EXPLORE_CATEGORIES: "explore-categories",
  TRENDING_TAGS: "trending-tags",
  EXPLORE_METADATA: "explore-metadata",
  EXPLORE_ANALYTICS: "explore-analytics",
} as const

/**
 * Get explore page metadata with caching
 */
export const getExploreMetadata = unstable_cache(
  async (): Promise<Metadata> => {
    try {
      // You could fetch dynamic data here for metadata
      return {
        title: "Explore Nail Art Designs | Discover Trending Styles",
        description:
          "Discover the latest nail art trends, designs, and inspiration. Browse thousands of creative nail designs from talented artists worldwide.",
        keywords: ["nail art", "nail designs", "manicure", "nail trends", "nail inspiration"],
        openGraph: {
          title: "Explore Nail Art Designs",
          description: "Discover trending nail art designs and get inspired",
          type: "website",
          images: [
            {
              url: "/og-explore.png",
              width: 1200,
              height: 630,
              alt: "Explore Nail Art Designs",
            },
          ],
        },
        twitter: {
          card: "summary_large_image",
          title: "Explore Nail Art Designs",
          description: "Discover trending nail art designs and get inspired",
          images: ["/og-explore.png"],
        },
      }
    } catch (error) {
      console.error("Error generating explore metadata:", error)
      return {
        title: "Explore",
        description: "Discover nail art designs",
      }
    }
  },
  ["explore-metadata"],
  {
    tags: [CACHE_TAGS.EXPLORE_METADATA],
    revalidate: 3600, // 1 hour
  },
)

/**
 * Get explore categories with post counts
 */
export const getExploreCategories = unstable_cache(
  async () => {
    try {
      // In a real app, this would fetch from your API
      const categories = [
        { id: "all", name: "All", count: 1250 },
        { id: "trending", name: "Trending", count: 89 },
        { id: "french", name: "French Manicure", count: 234 },
        { id: "gel", name: "Gel Nails", count: 456 },
        { id: "acrylic", name: "Acrylic", count: 321 },
        { id: "abstract", name: "Abstract", count: 178 },
        { id: "minimalist", name: "Minimalist", count: 267 },
        { id: "floral", name: "Floral", count: 345 },
        { id: "geometric", name: "Geometric", count: 198 },
        { id: "glitter", name: "Glitter", count: 289 },
        { id: "ombre", name: "Ombre", count: 156 },
        { id: "seasonal", name: "Seasonal", count: 123 },
      ]

      return categories
    } catch (error) {
      console.error("Error fetching explore categories:", error)
      return [
        { id: "all", name: "All" },
        { id: "trending", name: "Trending" },
        { id: "french", name: "French Manicure" },
        { id: "gel", name: "Gel Nails" },
      ]
    }
  },
  ["explore-categories"],
  {
    tags: [CACHE_TAGS.EXPLORE_CATEGORIES],
    revalidate: 1800, // 30 minutes
  },
)

/**
 * Get trending tags with images and post counts
 */
export const getTrendingTags = unstable_cache(
  async () => {
    try {
      // In a real app, this would fetch from your API
      const trendingTags = [
        {
          id: 1,
          name: "frenchtwist",
          posts: "24.5K",
          image: "/glitter-french-elegance.png",
        },
        {
          id: 2,
          name: "geometricnails",
          posts: "18.2K",
          image: "/geometric-harmony.png",
        },
        {
          id: 3,
          name: "floralnailart",
          posts: "32.1K",
          image: "/vibrant-floral-nails.png",
        },
        {
          id: 4,
          name: "abstractdesign",
          posts: "15.7K",
          image: "/abstract-pastel-swirls.png",
        },
      ]

      return trendingTags
    } catch (error) {
      console.error("Error fetching trending tags:", error)
      return []
    }
  },
  ["trending-tags"],
  {
    tags: [CACHE_TAGS.TRENDING_TAGS],
    revalidate: 900, // 15 minutes
  },
)

/**
 * Track explore page views for analytics
 */
export async function trackExploreView(data: {
  query?: string
  category?: string
  page?: number
}) {
  try {
    // In a real app, this would send to your analytics service
    console.log("Explore view tracked:", data)

    // You could also update trending calculations here
    // await updateTrendingCalculations(data)

    return { success: true }
  } catch (error) {
    console.error("Error tracking explore view:", error)
    // Don't throw - analytics failures shouldn't break the page
    return { success: false, error: "Failed to track view" }
  }
}

/**
 * Revalidate explore cache
 */
export async function revalidateExploreCache() {
  try {
    revalidateTag(CACHE_TAGS.EXPLORE_CATEGORIES)
    revalidateTag(CACHE_TAGS.TRENDING_TAGS)
    revalidateTag(CACHE_TAGS.EXPLORE_METADATA)

    return { success: true }
  } catch (error) {
    console.error("Error revalidating explore cache:", error)
    return { success: false, error: "Failed to revalidate cache" }
  }
}

/**
 * Prefetch explore data for better performance
 */
export async function prefetchExploreData() {
  try {
    // Prefetch commonly accessed data
    await Promise.all([getExploreCategories(), getTrendingTags(), getExploreMetadata()])

    return { success: true }
  } catch (error) {
    console.error("Error prefetching explore data:", error)
    return { success: false, error: "Failed to prefetch data" }
  }
}
