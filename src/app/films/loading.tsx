export default function FilmsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="mt-3 h-5 w-64 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="mb-6 h-10 max-w-md animate-pulse rounded-xl bg-muted" />

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="w-full shrink-0 space-y-6 lg:w-56">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="mb-3 h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded-lg bg-muted" />
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-border/50">
                <div className="h-28 sm:h-32 animate-pulse bg-muted" />
                <div className="space-y-1.5 p-2">
                  <div className="h-2.5 w-11 animate-pulse rounded bg-muted" />
                  <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
