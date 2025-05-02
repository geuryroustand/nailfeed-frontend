import type { Collection } from "@/types/collection"

// Sample initial collections - in a real app, this would come from a database
const initialCollections: Collection[] = [
  {
    id: "1",
    name: "For my birthday",
    description: "Nail designs I'm considering for my birthday celebration",
    coverImage: "/vibrant-abstract-nails.png",
    isPrivate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    postIds: [1, 3],
    shares: [],
  },
  {
    id: "2",
    name: "Christmas ideas",
    description: "Festive nail art for the holiday season",
    coverImage: "/glitter-french-elegance.png",
    isPrivate: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    postIds: [2, 5],
    shares: [],
  },
  {
    id: "3",
    name: "Summer",
    description: "Bright and colorful designs for summer",
    coverImage: "/vibrant-floral-nails.png",
    isPrivate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    postIds: [4, 6],
    shares: [],
  },
]

// Function to get all collections
export async function getCollections(): Promise<Collection[]> {
  // In a real app, this would fetch from a database
  return initialCollections
}

// Function to get a collection by ID
export async function getCollectionById(id: string): Promise<Collection | null> {
  // In a real app, this would fetch from a database
  const collection = initialCollections.find((c) => c.id === id)
  return collection || null
}

// Function to search collections
export async function searchCollections(query: string): Promise<Collection[]> {
  // In a real app, this would search in a database
  if (!query) return initialCollections

  const lowercaseQuery = query.toLowerCase()
  return initialCollections.filter(
    (collection) =>
      collection.name.toLowerCase().includes(lowercaseQuery) ||
      (collection.description && collection.description.toLowerCase().includes(lowercaseQuery)),
  )
}
