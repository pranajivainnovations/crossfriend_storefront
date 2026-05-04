import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"

export default function Loading() {
  return (
    <div className="content-container py-6">
      <div className="animate-pulse mb-8">
        <div className="h-4 w-48 bg-grey-10 rounded mb-4" />
        <div className="h-8 w-64 bg-grey-10 rounded" />
      </div>
      <SkeletonProductGrid />
    </div>
  )
}
