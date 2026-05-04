export default function Loading() {
  return (
    <div className="content-container py-6 animate-pulse">
      <div className="flex flex-col small:flex-row gap-6">
        <div className="h-8 w-32 bg-grey-10 rounded" />
        <div className="flex-1">
          <div className="h-4 w-48 bg-grey-10 rounded mb-4" />
          <div className="h-8 w-64 bg-grey-10 rounded mb-8" />
          <div className="grid grid-cols-2 small:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-grey-10 rounded-2xl h-64" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
