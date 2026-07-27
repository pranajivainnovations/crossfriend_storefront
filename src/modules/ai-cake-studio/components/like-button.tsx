"use client"

import { useState } from "react"

interface Props {
  designId: string
  initialLiked: boolean
  initialCount: number
  isLoggedIn: boolean
  size?: "sm" | "md"
}

/**
 * Heart + count. Optimistic toggle with rollback on failure. Logged-out
 * users see a brief "Login to like" hint instead of triggering a request —
 * the backend would reject it with AUTH_REQUIRED anyway, so we skip the
 * round trip.
 */
export default function LikeButton({
  designId,
  initialLiked,
  initialCount,
  isLoggedIn,
  size = "sm",
}: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [pending, setPending] = useState(false)
  const [showLoginHint, setShowLoginHint] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isLoggedIn) {
      setShowLoginHint(true)
      setTimeout(() => setShowLoginHint(false), 1800)
      return
    }
    if (pending) return

    const nextLiked = !liked
    setLiked(nextLiked)
    setCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)))
    setPending(true)

    try {
      const res = await fetch(`/api/ai-studio/designs/${designId}/like`, { method: "POST" })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setLiked(!nextLiked)
        setCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)))
      } else {
        setLiked(data.liked)
        setCount(data.likeCount)
      }
    } catch {
      setLiked(!nextLiked)
      setCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)))
    } finally {
      setPending(false)
    }
  }

  const textSize = size === "sm" ? "text-[10px]" : "text-xs"

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 ${textSize} font-bold backdrop-blur-sm transition disabled:opacity-70 ${
          liked ? "text-rose-600" : "text-slate-500 hover:text-rose-500"
        }`}
      >
        <span>{liked ? "❤️" : "🤍"}</span>
        {count > 0 && <span>{count}</span>}
      </button>

      {showLoginHint && (
        <div className="absolute bottom-full left-1/2 mb-1 w-max -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white shadow-lg">
          Login to like
        </div>
      )}
    </div>
  )
}
