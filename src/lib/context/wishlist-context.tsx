"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"

interface WishlistContextType {
  items: string[] // product IDs
  addItem: (productId: string) => void
  removeItem: (productId: string) => void
  toggleItem: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  count: number
}

const WishlistContext = createContext<WishlistContextType | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("cf_wishlist")
    if (saved) {
      try { setItems(JSON.parse(saved)) } catch {}
    }
  }, [])

  const persist = (newItems: string[]) => {
    setItems(newItems)
    localStorage.setItem("cf_wishlist", JSON.stringify(newItems))
  }

  const addItem = useCallback((productId: string) => {
    setItems((prev) => {
      if (prev.includes(productId)) return prev
      const next = [...prev, productId]
      localStorage.setItem("cf_wishlist", JSON.stringify(next))
      return next
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((id) => id !== productId)
      localStorage.setItem("cf_wishlist", JSON.stringify(next))
      return next
    })
  }, [])

  const toggleItem = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
      localStorage.setItem("cf_wishlist", JSON.stringify(next))
      return next
    })
  }, [])

  const isInWishlist = useCallback((productId: string) => items.includes(productId), [items])

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, toggleItem, isInWishlist, count: items.length }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider")
  return ctx
}
