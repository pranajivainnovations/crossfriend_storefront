"use client"

import { useState } from "react"
import { useReviews } from "@lib/context/reviews-context"
import StarRating from "@modules/common/components/star-rating"

type ReviewsSectionProps = {
  productId: string
}

export default function ReviewsSection({ productId }: ReviewsSectionProps) {
  const { getReviews, getAverageRating, addReview } = useReviews()
  const reviews = getReviews(productId)
  const { average, count } = getAverageRating(productId)

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ rating: 5, title: "", body: "", author: "" })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.author) return
    addReview({
      productId,
      rating: formData.rating,
      title: formData.title,
      body: formData.body,
      author: formData.author,
      verified: false,
    })
    setFormData({ rating: 5, title: "", body: "", author: "" })
    setShowForm(false)
  }

  return (
    <div className="border-t border-ui-border-base pt-8 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-heading font-semibold text-grey-80">Customer Reviews</h3>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={average} count={count} size="md" />
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium border border-cf-orange text-cf-orange rounded-lg hover:bg-cf-orange hover:text-white transition-colors"
        >
          Write a Review
        </button>
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-cf-warm rounded-xl">
          <div className="grid gap-3">
            <div>
              <label className="text-xs font-medium text-grey-80 mb-1 block">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className={`w-8 h-8 text-lg ${star <= formData.rating ? "text-amber-400" : "text-grey-20"}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              placeholder="Your name"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              className="px-3 py-2 rounded-lg border border-ui-border-base text-sm focus:outline-none focus:ring-2 focus:ring-cf-orange/40"
              required
            />
            <input
              type="text"
              placeholder="Review title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="px-3 py-2 rounded-lg border border-ui-border-base text-sm focus:outline-none focus:ring-2 focus:ring-cf-orange/40"
              required
            />
            <textarea
              placeholder="Your review (optional)"
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              rows={3}
              className="px-3 py-2 rounded-lg border border-ui-border-base text-sm focus:outline-none focus:ring-2 focus:ring-cf-orange/40 resize-none"
            />
            <button
              type="submit"
              className="self-start px-4 py-2 bg-cf-orange text-white text-sm font-semibold rounded-lg hover:bg-cf-orange-dark transition-colors"
            >
              Submit Review
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.slice(0, 5).map((review) => (
          <div key={review.id} className="pb-4 border-b border-ui-border-base last:border-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} size="xs" showCount={false} />
                <span className="text-xs font-semibold text-grey-80">{review.title}</span>
              </div>
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
