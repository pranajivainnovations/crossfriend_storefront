"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"

/**
 * Product reviews.
 *
 * ── Why this returns nothing today ──────────────────────────────────────────────────────────────
 * This file used to ship three hardcoded reviews — "Priya S.", "Rahul K.", "Anita M." — attached to
 * every product, each flagged `verified: true`, with the rating nudged per product so the averages
 * looked varied. Nobody wrote them. They produced the 3.7-star average that appeared on the live
 * product page and that an external audit read as real customer feedback.
 *
 * That is fabricated social proof on a site that takes payments. Under the Consumer Protection Act
 * 2019 and the BIS standard on online reviews (IS 19000:2022), publishing invented reviews — and
 * especially labelling them "verified" — is a misleading trade practice, not a cosmetic problem. It
 * also blocks the AggregateRating markup we want: putting an invented average into structured data
 * turns a site-level embarrassment into something Google can issue a manual action over.
 *
 * So the seeds are gone. Until there is a real reviews API backed by verified orders, this returns
 * exactly what exists, which is nothing.
 *
 * ── Why the write path is disabled too ──────────────────────────────────────────────────────────
 * Submissions were written to the visitor's own `localStorage`. The reviewer saw their review
 * appear and reasonably concluded they had posted it publicly; in fact nobody else would ever see
 * it, and it vanished when they cleared site data. A form that silently discards what a customer
 * writes is the same broken promise as inventing reviews, pointed the other way.
 *
 * `addReview` is kept as a no-op rather than deleted so the shape of this context does not change
 * while the UI is adjusted; it is removed for real when the backend lands.
 *
 * ── What replacing this properly requires ───────────────────────────────────────────────────────
 * A `reviews` table keyed to a fulfilled order line, an authenticated POST that verifies the
 * reviewer actually bought the product, moderation in OPS, and only then AggregateRating markup —
 * gated behind a minimum review count so a 1-review "5.0" never reaches a search result.
 */

export interface Review {
  id: string
  productId: string
  rating: number // 1-5
  title: string
  body: string
  author: string
  date: string // ISO date
  /** Reserved for a real order-backed check. Nothing sets this today. */
  verified: boolean
}

interface ReviewsContextType {
  getReviews: (productId: string) => Review[]
  getAverageRating: (productId: string) => { average: number; count: number }
  /** No-op until a real reviews API exists. See the note above. */
  addReview: (review: Omit<Review, "id" | "date">) => void
  /** Lets the UI say "reviews are coming" instead of pretending a product has none. */
  reviewsEnabled: boolean
}

const ReviewsContext = createContext<ReviewsContextType | null>(null)

/**
 * Flips to true when a real API is wired. Kept as a constant rather than an env var because it is
 * not a configuration choice — it describes whether the feature exists at all.
 */
const REVIEWS_ENABLED = false

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([])

  /**
   * One-time cleanup of the old fabricated data.
   *
   * Anyone who visited before this change has `cf_reviews` sitting in their browser, holding
   * whatever they typed into a form that never went anywhere. Reading it back would resurrect
   * exactly the content this change exists to remove, so it is cleared rather than migrated.
   */
  useEffect(() => {
    try {
      localStorage.removeItem("cf_reviews")
    } catch {
      // Private mode, or storage disabled. Nothing to clean up in that case.
    }
  }, [])

  const getReviews = useCallback((_productId: string) => reviews, [reviews])

  const getAverageRating = useCallback(
    (_productId: string) => ({ average: 0, count: 0 }),
    []
  )

  const addReview = useCallback((_review: Omit<Review, "id" | "date">) => {
    // Intentionally does nothing. Storing to localStorage told the reviewer their review was
    // published when it was visible to nobody. Silence is better than that lie, and the UI no
    // longer offers the form.
  }, [])

  return (
    <ReviewsContext.Provider
      value={{ getReviews, getAverageRating, addReview, reviewsEnabled: REVIEWS_ENABLED }}
    >
      {children}
    </ReviewsContext.Provider>
  )
}

export function useReviews() {
  const ctx = useContext(ReviewsContext)
  if (!ctx) throw new Error("useReviews must be used within ReviewsProvider")
  return ctx
}
