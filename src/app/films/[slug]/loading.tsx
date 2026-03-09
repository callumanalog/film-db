export default function FilmDetailLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-5 w-32 animate-pulse rounded bg-muted" />

      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
        <div className="h-32 w-32 shrink-0 animate-pulse rounded-2xl bg-muted" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          <div className="h-10 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="flex gap-2">
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
            <div className="h-6 w-12 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="h-16 max-w-2xl animate-pulse rounded-lg bg-muted" />
        </div>
      </div>

      <div className="mb-10 h-px bg-border" />

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded bg-muted" />
            <div className="h-6 w-36 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      ))}
    </div>
  );
}
