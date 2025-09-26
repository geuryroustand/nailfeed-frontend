import type { Collection } from "@/context/collections-context"
import { getUserCollectionsAction, getCollectionAction } from "@/lib/actions/collections-actions"

// Function to get all collections - now uses real API
export async function getCollections(): Promise<Collection[]> {
  try {
    return await getUserCollectionsAction()
  } catch (error) {
    console.error('Failed to fetch collections:', error)
    return []
  }
}

// Function to get a collection by ID - now uses real API
export async function getCollectionById(id: string): Promise<Collection | null> {
  try {
    return await getCollectionAction(id)
  } catch (error) {
    console.error('Failed to fetch collection:', error)
    return null
  }
}

// Function to search collections
export async function searchCollections(query: string): Promise<Collection[]> {
  try {
    const collections = await getUserCollectionsAction()

    if (!query) return collections

    const lowercaseQuery = query.toLowerCase()
    return collections.filter(
      (collection) =>
        collection.name.toLowerCase().includes(lowercaseQuery) ||
        (collection.description && collection.description.toLowerCase().includes(lowercaseQuery)),
    )
  } catch (error) {
    console.error('Failed to search collections:', error)
    return []
  }
}
