"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { SearchFilters } from "@/components/search/advanced-search"

interface Post {
  id: number
  username: string
  userImage: string
  image: string
  description: string
  // Use backend calculated counts
  likesCount?: number
  commentsCount?: number
  // Legacy fields for backward compatibility
  likes?: number
  comments?: any[]
  timestamp: string
  tags?: string[]
  colors?: string[]
  style?: string
  event?: string
  shape?: string
  location?: {
    latitude: number
    longitude: number
    address: string
  }
}

interface SearchContextType {
  filters: SearchFilters
  setFilters: (filters: SearchFilters) => void
  filteredPosts: Post[]
  isSearching: boolean
  clearSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

// Extended sample post data with metadata for filtering
const samplePosts = [
  {
    id: 1,
    username: "nailartist",
    userImage: "/serene-woman-gaze.png",
    image: "/glitter-french-elegance.png",
    description: "French manicure with a twist! ✨ Added some glitter for that extra sparkle. What do you think?",
    likes: 234,
    comments: [
      { id: 1, username: "nailfan", text: "This is absolutely gorgeous! 😍", likes: 12 },
      { id: 2, username: "glamnails", text: "Love the glitter accent! What brand did you use?", likes: 5 },
    ],
    timestamp: "2h ago",
    tags: ["frenchmanicure", "glitter", "nailart"],
    colors: ["white", "gold"],
    style: "gel",
    event: "wedding",
    shape: "oval",
    location: {
      latitude: 40.7128,
      longitude: -74.006,
      address: "New York, NY",
    },
  },
  {
    id: 2,
    username: "trendynails",
    userImage: "/painted-nails-close-up.png",
    image: "/geometric-harmony.png",
    description: "Geometric vibes today! 📐 These took forever but I'm so happy with how they turned out.",
    likes: 187,
    comments: [{ id: 3, username: "nailpro", text: "The precision is incredible! Great work!", likes: 8 }],
    timestamp: "5h ago",
    tags: ["geometric", "naildesign", "minimalist"],
    colors: ["black", "white", "gold"],
    style: "acrylic",
    event: "formal",
    shape: "square",
    location: {
      latitude: 34.0522,
      longitude: -118.2437,
      address: "Los Angeles, CA",
    },
  },
  {
    id: 3,
    username: "artsynails",
    userImage: "/diverse-user-avatars.png",
    image: "/vibrant-floral-nails.png",
    description: "Spring is in the air! 🌸 Loving these floral designs for the season.",
    likes: 312,
    comments: [],
    timestamp: "1d ago",
    tags: ["floralnails", "springnails", "nailinspo"],
    colors: ["pink", "green", "yellow"],
    style: "gel",
    event: "casual",
    shape: "almond",
    location: {
      latitude: 41.8781,
      longitude: -87.6298,
      address: "Chicago, IL",
    },
  },
  {
    id: 4,
    username: "nailqueen",
    userImage: "/vibrant-artist-portrait.png",
    image: "/marble-gold-nails.png",
    description: "Marble and gold leaf combination for a luxury look ✨",
    likes: 423,
    comments: [],
    timestamp: "2d ago",
    tags: ["marblenails", "goldleaf", "luxurynails"],
    colors: ["white", "gold", "black"],
    style: "acrylic",
    event: "party",
    shape: "coffin",
    location: {
      latitude: 29.7604,
      longitude: -95.3698,
      address: "Houston, TX",
    },
  },
  {
    id: 5,
    username: "nailartistry",
    userImage: "/diverse-profiles.png",
    image: "/blue-ombre-nails.png",
    description: "Ocean-inspired ombre nails 🌊 Perfect for summer!",
    likes: 287,
    comments: [],
    timestamp: "3d ago",
    tags: ["ombrenails", "bluenails", "summernails"],
    colors: ["blue", "white"],
    style: "dip-powder",
    event: "casual",
    shape: "round",
    location: {
      latitude: 33.4484,
      longitude: -112.074,
      address: "Phoenix, AZ",
    },
  },
]

export function SearchProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    colors: [],
    styles: [],
    events: [],
    shapes: [],
    location: {
      enabled: false,
      distance: 25,
    },
  })
  const [filteredPosts, setFilteredPosts] = useState<Post[]>(samplePosts)
  const [isSearching, setIsSearching] = useState(false)

  // Filter posts whenever filters change
  useEffect(() => {
    if (
      !filters.query &&
      filters.colors.length === 0 &&
      filters.styles.length === 0 &&
      filters.events.length === 0 &&
      filters.shapes.length === 0 &&
      !filters.location?.enabled
    ) {
      setFilteredPosts(samplePosts)
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    // Apply filters
    const filtered = samplePosts.filter((post) => {
      // Text search
      if (
        filters.query &&
        !post.description.toLowerCase().includes(filters.query.toLowerCase()) &&
        !post.tags?.some((tag) => tag.toLowerCase().includes(filters.query.toLowerCase()))
      ) {
        return false
      }

      // Color filter
      if (filters.colors.length > 0 && !post.colors?.some((color) => filters.colors.includes(color))) {
        return false
      }

      // Style filter
      if (filters.styles.length > 0 && post.style && !filters.styles.includes(post.style)) {
        return false
      }

      // Event filter
      if (filters.events.length > 0 && post.event && !filters.events.includes(post.event)) {
        return false
      }

      // Shape filter
      if (filters.shapes.length > 0 && post.shape && !filters.shapes.includes(post.shape)) {
        return false
      }

      // Location filter
      if (filters.location?.enabled && filters.location.coordinates && post.location) {
        // Calculate distance (simplified for demo)
        const distance = calculateDistance(
          filters.location.coordinates.latitude,
          filters.location.coordinates.longitude,
          post.location.latitude,
          post.location.longitude,
        )

        if (distance > filters.location.distance) {
          return false
        }
      }

      return true
    })

    setFilteredPosts(filtered)
  }, [filters])

  const clearSearch = () => {
    setFilters({
      query: "",
      colors: [],
      styles: [],
      events: [],
      shapes: [],
      location: {
        enabled: false,
        distance: 25,
      },
    })
    setIsSearching(false)
  }

  // Simple distance calculation using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8 // Earth's radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    return distance
  }

  return (
    <SearchContext.Provider
      value={{
        filters,
        setFilters,
        filteredPosts,
        isSearching,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider")
  }
  return context
}
