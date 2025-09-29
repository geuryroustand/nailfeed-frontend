export default function SavedPostsLoading() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <section className="animate-pulse rounded-4xl border border-rose-100/60 bg-white/70 p-8">
          <div className="h-6 w-32 rounded-full bg-rose-100/80" />
          <div className="mt-6 h-10 w-3/4 rounded-full bg-rose-100/60" />
          <div className="mt-4 h-4 w-2/3 rounded-full bg-rose-100/40" />
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="h-10 rounded-full bg-rose-100/30" />
            <div className="h-10 rounded-full bg-rose-100/30" />
            <div className="h-10 rounded-full bg-rose-100/30" />
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div className="h-8 w-40 rounded-full bg-rose-100/60" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex h-full flex-col overflow-hidden rounded-3xl border border-rose-100/60 bg-white"
              >
                <div className="h-64 w-full bg-rose-100/40" />
                <div className="flex flex-1 flex-col gap-3 px-5 py-6">
                  <div className="h-5 w-3/4 rounded-full bg-rose-100/50" />
                  <div className="h-4 w-full rounded-full bg-rose-100/40" />
                  <div className="h-4 w-2/3 rounded-full bg-rose-100/30" />
                  <div className="mt-4 h-8 w-40 rounded-full bg-rose-100/40" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
