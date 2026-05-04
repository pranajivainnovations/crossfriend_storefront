"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"

export interface Review {
  id: string
  productId: string
  rating: number // 1-5
  title: string
  body: string
  author: string
  date: string // ISO date
  verified: boolean
}

interface ReviewsContextType {
  getReviews: (productId: string) => Review[]
  getAverageRating: (productId: string) => { average: number; count: number }
  addReview: (review: Omit<Review, "id" | "date">) => void
}

const ReviewsContext = createContext<ReviewsContextType | null>(null)

// Seed data for demonstration
const SEED_REVIEWS: Review[] = [
  {
    id: "r1",
    productId: "",
    rating: 5,
    title: "Amazing cake!",
    body: "Delivered on time, fresh and delicious. The customization was perfect.",
    author: "Priya S.",
    date: "2026-04-28",
    verified: true,
  },
  {
    id: "r2",
    productId: "",
    rating: 4,
    title: "Good quality decorations",
    body: "Colors were vibrant. Setup was easy. Would order again.",
    author: "Rahul K.",
    date: "2026-04-25",
    verified: true,
  },
  {
    id: "r3",
    productId: "",
    rating: 5,
    title: "Perfect birthday gift",
    body: "My daughter loved it! Fast delivery and great packaging.",
    author: "Anita M.",
    date: "2026-04-20",
    verified: true,
  },
]

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("cf_reviews")
    if (saved) {
      try { setReviews(JSON.parse(saved)) } catch {}
    }
  }, [])

  const getReviews = useCallback((productId: string) => {
    const userReviews = reviews.filter((r) => r.productId === productId)
    // Add seed reviews for demo (randomized per product)
    const seedForProduct = SEED_REVIEWS.map((r, i) => ({
      ...r,
      id: `seed-${productId}-${i}`,
      productId,
      rating: Math.max(3, Math.min(5, r.rating - (productId.charCodeAt(4) % 2))),
    }))
    return [...userReviews, ...seedForProduct]
  }, [reviews])

  const getAverageRating = useCallback((productId: string) => {
    const allReviews = getReviews(productId)
    if (allReviews.length === 0) return { average: 0, count: 0 }
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0)
    return { average: Math.round((sum / allReviews.length) * 10) / 10, count: allReviews.length }
  }, [getReviews])

  const addReview = useCallback((review: Omit<Review, "id" | "date">) => {
    const newReview: Review = {
      ...review,
      id: `user-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
    }
    setReviews((prev) => {
      const next = [newReview, ...prev]
      localStorage.setItem("cf_reviews", JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <ReviewsContext.Provider value={{ getReviews, getAverageRating, addReview }}>
      {children}
    </ReviewsContext.Provider>
  )
}

export function useReviews() {
  const ctx = useContext(ReviewsContext)
  if (!ctx) throw new Error("useReviews must be used within ReviewsProvider")
  return ctx
}
