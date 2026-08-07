import SkeletonOrderSummary from "@modules/skeletons/components/skeleton-order-summary"

/**
 * Without this, /checkout renders nothing at all while the server resolves the cart — the customer
 * sees a blank white page for the whole request, which reads as "my cart disappeared" rather than
 * "this is loading". The cart page already had a skeleton; checkout was the gap.
 */
export default function Loading() {
  return (
    <div className="grid grid-cols-1 small:grid-cols-[1fr_416px] content-container gap-x-40 py-12">
      <div className="flex flex-col gap-y-8">
        {/* Shipping address block */}
        <div className="flex flex-col gap-y-4">
          <div className="w-52 h-8 bg-gray-200 animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-gray-200 animate-pulse rounded-md" />
            <div className="h-12 bg-gray-200 animate-pulse rounded-md" />
            <div className="h-12 bg-gray-200 animate-pulse rounded-md" />
            <div className="h-12 bg-gray-200 animate-pulse rounded-md" />
            <div className="h-12 bg-gray-200 animate-pulse rounded-md" />
            <div className="h-12 bg-gray-200 animate-pulse rounded-md" />
          </div>
        </div>

        <div className="h-px w-full bg-gray-200" />

        {/* Review block */}
        <div className="flex flex-col gap-y-4">
          <div className="w-32 h-8 bg-gray-200 animate-pulse" />
          <div className="w-full h-16 bg-gray-200 animate-pulse rounded-md" />
          <div className="w-40 h-12 bg-gray-200 animate-pulse rounded-md" />
        </div>
      </div>

      <div className="flex flex-col gap-y-8 py-8 small:py-0">
        <SkeletonOrderSummary />
      </div>
    </div>
  )
}
