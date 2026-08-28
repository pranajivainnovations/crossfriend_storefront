"use client"

import { useReviews } from "@lib/context/reviews-context"
import StarRating from "@modules/common/components/star-rating"

type ReviewsSectionProps = {
  productId: string
}

/**
 * Customer reviews on the product page.
 *
 * Renders nothing at all while reviews are unavailable — see the long note in
 * `@lib/context/reviews-context` for why the previous version, which showed three invented
 * "verified" reviews on every product and collected new ones into the visitor's own localStorage,
 * had to go.
 *
 * Returning null rather than an empty "No reviews yet — be the first!" block is deliberate. That
 * empty state invites a review the site cannot actually accept, and on a catalogue this small it
 * would appear identically on every product, reading as a broken section rather than a new one.
 * When the API lands, the empty state arrives with it and means something.
 */
export default function ReviewsSection({ productId }: ReviewsSectionProps) {
  const { getReviews, getAverageRating, reviewsEnabled } = useReviews()

  if (!reviewsEnabled) return null

  const reviews = getReviews(productId)
  const { average, count } = getAverageRating(productId)

  if (reviews.length === 0) {
    return (
      <div className="border-t border-ui-border-base pt-8 mt-8">
        <h3 className="text-lg font-heading font-semibold text-grey-80">Customer Reviews</h3>
        <p className="mt-2 text-sm text-grey-60">
          No reviews yet. Reviews appear here once a delivered order has been rated.
        </p>
      </div>
    )
  }

  return (
    <div className="border-t border-ui-border-base pt-8 mt-8">
      <div className="mb-6">
        <h3 className="text-lg font-heading font-semibold text-grey-80">Customer Reviews</h3>
        <div className="flex items-center gap-2 mt-1">
          <StarRating rating={average} count={count} size="md" />
        </div>
      </div>

      <div className="space-y-4">
        {reviews.slice(0, 5).map((review) => (
          <div key={review.id} className="pb-4 border-b border-ui-border-base last:border-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} size="xs" showCount={false} />
                <span className="text-xs font-semibold text-grey-80">{review.title}</span>
              </div>
              {/*
                Only a review tied to a fulfilled order may carry this badge. Nothing sets
                `verified` today, so it never renders — which is the point: the old code set it on
                three reviews nobody had written.
              */}
              {review.verified && (
                <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 rounded-full font-medium">
                  ✓ Verified
                </span>
              )}
            </div>
            {review.body && <p className="text-xs text-grey-60 mt-1">{review.body}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] text-grey-40">{review.author}</span>
              <span className="text-[10px] text-grey-30">•</span>
              <span className="text-[10px] text-grey-40">{review.date}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
