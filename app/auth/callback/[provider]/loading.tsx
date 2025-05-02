export default function CallbackLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 border-4 border-t-pink-500 border-gray-200 rounded-full animate-spin"></div>
        <h1 className="text-2xl font-bold mb-2">Authenticating...</h1>
        <p className="text-gray-500">Please wait while we complete your authentication.</p>
      </div>
    </div>
  )
}
