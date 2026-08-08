"use client"

import { useEffect, useState } from "react"

interface Comment {
  id: string
  content: string
  customerName: string
  createdAt: string
  isOwn: boolean
}

interface Props {
  designId: string
  isLoggedIn: boolean
}

/**
 * Comment list + input, meant to live in the lightbox's slideFooter for the
 * currently-viewed design. Fetches fresh whenever designId changes (i.e.
 * whenever the user navigates to a different slide).
 */
export default function CommentSection({ designId, isLoggedIn }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/ai-studio/designs/${designId}/comments?limit=20`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setComments(data.comments || [])
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [designId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = input.trim()
    if (!content || submitting) return

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/ai-studio/designs/${designId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || "Couldn't post your comment. Please try again.")
      } else {
        setComments((prev) => [data.comment, ...prev])
        setInput("")
      }
    } catch {
      setError("Couldn't post your comment. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    const previous = comments
    setComments((cur) => cur.filter((c) => c.id !== commentId))

    try {
      const res = await fetch(`/api/ai-studio/designs/${designId}/comments/${commentId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok || !data.success) setComments(previous)
    } catch {
      setComments(previous)
    }
  }

  return (
    <div className="max-h-[38vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 500))}
            placeholder="Add a comment..."
            disabled={submitting}
            className="flex-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={submitting || !input.trim()}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-cf-purple-700 transition disabled:opacity-50"
          >
            Post
          </button>
        </form>
      ) : (
        <p className="mb-3 text-xs text-white/60">Login to leave a comment.</p>
      )}

      {error && <p className="mb-2 text-xs text-rose-300">{error}</p>}

      {loading ? (
        <p className="text-xs text-white/50">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-white/50">No comments yet — be the first!</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((c) => (
            <li key={c.id} className="rounded-xl bg-white/10 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white/90">{c.customerName}</span>
                {c.isOwn && (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="text-[10px] font-semibold text-white/50 transition hover:text-rose-300"
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-white/70">{c.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
