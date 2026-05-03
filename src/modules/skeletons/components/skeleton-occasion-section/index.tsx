export default function SkeletonOccasionSection() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-6 w-6 rounded-full bg-ui-bg-subtle" />
        <div className="h-5 w-36 rounded bg-ui-bg-subtle" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-48">
            <div className="aspect-square rounded-xl bg-ui-bg-subtle" />
            <div className="mt-2 space-y-1.5">
              <div className="h-3 w-3/4 rounded bg-ui-bg-subtle" />
              <div className="h-3 w-1/3 rounded bg-ui-bg-subtle" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
