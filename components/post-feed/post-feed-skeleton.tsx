export default function PostFeedSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse" />
      ))}
    </div>
  )
}
