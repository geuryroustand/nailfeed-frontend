import CollectionsSkeleton from "@/components/collections/collections-skeleton"

export default function CollectionsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Collections</h1>
      <CollectionsSkeleton />
    </div>
  )
}
