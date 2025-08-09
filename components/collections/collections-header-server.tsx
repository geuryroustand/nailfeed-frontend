import { getCollectionsCount } from "@/lib/actions/collections-server-actions"
import CollectionsHeaderClient from "./collections-header-client"

export default async function CollectionsHeaderServer() {
  const count = await getCollectionsCount()

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">
        Your Collections {count > 0 && <span className="text-gray-500">({count})</span>}
      </h1>
      <CollectionsHeaderClient />
    </>
  )
}
