export const dynamic = "force-static"

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-[70vh] py-12">
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-2xl font-semibold mb-2">Page not found</h2>
        <p className="text-muted-foreground mb-6">Sorry, we couldn't find the page you're looking for.</p>
        <a href="/" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          Go back home
        </a>
      </div>
    </div>
  )
}
