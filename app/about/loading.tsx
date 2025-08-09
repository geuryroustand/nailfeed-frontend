export default function AboutLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="h-10 bg-gray-200 rounded-lg animate-pulse mb-4 max-w-md mx-auto"></div>
          <div className="h-6 bg-gray-200 rounded-lg animate-pulse max-w-2xl mx-auto"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="h-8 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="h-8 bg-gray-200 rounded-lg animate-pulse mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <div className="h-8 bg-gray-200 rounded-lg animate-pulse mb-6 max-w-sm mx-auto"></div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="h-10 bg-gray-200 rounded-lg animate-pulse mb-2 max-w-20 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse max-w-24 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <div className="h-8 bg-gray-200 rounded-lg animate-pulse mb-4 max-w-sm mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-6 max-w-md mx-auto"></div>
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse max-w-40 mx-auto"></div>
        </div>
      </div>
    </div>
  )
}
