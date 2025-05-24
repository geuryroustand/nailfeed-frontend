import { getCollections } from "@/lib/actions/collections-server-actions"
import CollectionsGridClient from "./collections-grid-client"
import EmptyCollectionsState from "./empty-collections-state"

export default async function CollectionsGridServer() {
  const collections = await getCollections()

  if (collections.length === 0) {
    return <EmptyCollectionsState />
  }

  return <CollectionsGridClient initialCollections={collections} />
}
