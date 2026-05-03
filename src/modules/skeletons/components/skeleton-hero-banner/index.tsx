export default function SkeletonHeroBanner() {
  return (
    <div className="animate-pulse rounded-2xl overflow-hidden">
      <div className="h-44 small:h-56 bg-ui-bg-subtle flex flex-col items-center justify-center gap-3 px-6">
        <div className="h-10 w-10 rounded-full bg-white/30" />
        <div className="h-6 w-48 rounded bg-white/30" />
        <div className="h-4 w-64 rounded bg-white/20" />
      </div>
    </div>
  )
}
