export default function Loading() {
  return (
    <div className="bg-cf-warm min-h-screen">
      <div className="content-container py-12 small:py-20">
        <div className="text-center mb-12 animate-pulse">
          <div className="h-10 w-64 bg-grey-10 rounded mx-auto mb-3" />
          <div className="h-5 w-80 bg-grey-10 rounded mx-auto" />
        </div>
        <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4 small:gap-6 max-w-5xl mx-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 animate-pulse min-h-[160px] flex flex-col items-center justify-center gap-3"
            >
              <div className="h-10 w-10 bg-grey-10 rounded-full" />
              <div className="h-5 w-20 bg-grey-10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
