export default function Loading() {
  return (
    <div className="bg-cf-warm min-h-screen">
      <div className="content-container py-12 small:py-20">
        <div className="text-center mb-12 animate-pulse">
          <div className="h-10 w-72 bg-grey-10 rounded mx-auto mb-3" />
          <div className="h-5 w-96 bg-grey-10 rounded mx-auto" />
        </div>
        <div className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-8 animate-pulse min-h-[180px]"
            >
              <div className="h-6 w-3/4 bg-grey-10 rounded mx-auto mb-3" />
              <div className="h-4 w-1/2 bg-grey-10 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
