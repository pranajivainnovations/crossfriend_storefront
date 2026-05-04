export default function Loading() {
  return (
    <div className="content-container py-6 animate-pulse">
      <div className="flex flex-col small:flex-row gap-8">
        {/* Image skeleton */}
        <div className="w-full small:w-1/2 bg-grey-10 rounded-2xl h-[400px]" />
        {/* Details skeleton */}
        <div className="flex-1 space-y-4">
          <div className="h-4 w-32 bg-grey-10 rounded" />
          <div className="h-8 w-3/4 bg-grey-10 rounded" />
          <div className="h-6 w-24 bg-grey-10 rounded" />
          <div className="h-4 w-full bg-grey-10 rounded" />
          <div className="h-4 w-5/6 bg-grey-10 rounded" />
          <div className="h-12 w-40 bg-grey-10 rounded-full mt-6" />
        </div>
      </div>
    </div>
  )
}
