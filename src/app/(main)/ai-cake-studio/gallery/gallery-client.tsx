"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import type { Customer } from "@medusajs/medusa"
import DesignLightbox from "@modules/ai-cake-studio/components/design-lightbox"
import LikeButton from "@modules/ai-cake-studio/components/like-button"
import PromptReveal from "@modules/ai-cake-studio/components/prompt-reveal"
import type { GeneratedDesign } from "@modules/ai-cake-studio/types"

interface ShowcaseDesign {
  id: string
  imageUrl: string
  prompt: string
  /** Exact compiled prompt sent to the image provider — public by design, so visitors can reuse it elsewhere */
  compiledPrompt?: string
  style: string
  occasion: string
  flavor: string
  likeCount: number
  commentCount: number
  viewCount: number
  isLiked: boolean
  createdAt: string
}

interface Props {
  initialDesigns: ShowcaseDesign[]
  initialTotal: number
  customer: Omit<Customer, "password_hash"> | null
}

const OCCASION_FILTERS = [
  { value: "", label: "All" },
  { value: "Birthday", label: "🎂 Birthday" },
  { value: "Wedding", label: "💍 Wedding" },
  { value: "Kids", label: "👶 Kids" },
  { value: "Anniversary", label: "💝 Anniversary" },
  { value: "Festival", label: "🎪 Festival" },
  { value: "Special", label: "🎁 Special" },
]

const STYLE_FILTERS = [
  { value: "", label: "All Styles" },
  { value: "Realistic", label: "🎂 Realistic" },
  { value: "Cartoon", label: "🎨 Cartoon" },
  { value: "Luxury", label: "✨ Luxury" },
  { value: "Minimal", label: "🤍 Minimal" },
  { value: "3D Sculpted", label: "🏆 3D Sculpted" },
  { value: "Wedding", label: "💍 Wedding" },
  { value: "Kids", label: "🎠 Kids" },
]

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "recent", label: "Most Recent" },
  { value: "trending", label: "Trending" },
]

export default function GalleryClient({ initialDesigns, initialTotal, customer }: Props) {
  const isLoggedIn = Boolean(customer)
  const [designs, setDesigns] = useState<ShowcaseDesign[]>(initialDesigns)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(initialDesigns.length < initialTotal)

  // Filters
  const [occasion, setOccasion] = useState("")
  const [style, setStyle] = useState("")
  const [sort, setSort] = useState("popular")

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Fetch designs with current filters
  const fetchDesigns = async (resetPage = true) => {
    setLoading(true)
    const currentPage = resetPage ? 1 : page + 1
    const params = new URLSearchParams({
      limit: "24",
      sort,
      page: String(currentPage),
    })
    if (occasion) params.set("occasion", occasion)
    if (style) params.set("style", style)

    try {
      const res = await fetch(`/api/ai-cake-studio-showcase?${params}`)
      const data = await res.json()

      if (resetPage) {
        setDesigns(data.designs || [])
        setPage(1)
      } else {
        setDesigns((prev) => [...prev, ...(data.designs || [])])
        setPage(currentPage)
      }
      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch when filters change
  const handleFilterChange = (type: "occasion" | "style" | "sort", value: string) => {
    if (type === "occasion") setOccasion(value)
    if (type === "style") setStyle(value)
    if (type === "sort") setSort(value)

    // Trigger fetch after state update
    setTimeout(() => fetchDesigns(true), 0)
  }

  // Actually trigger fetch when state updates
  const applyFilters = () => {
    fetchDesigns(true)
  }

  // Use prompt — navigate to studio page, carrying this design's known
  // style/occasion/flavor along with it (the studio asks whether to apply them).
  const handleUsePrompt = (design: ShowcaseDesign) => {
    sessionStorage.setItem(
      "cf-use-prompt",
      JSON.stringify({
        prompt: design.prompt,
        style: design.style,
        occasion: design.occasion,
        flavor: design.flavor,
      })
    )
    window.location.href = "/ai-cake-studio"
  }

  // Use this cake — skip the prompt entirely, adopt this exact design and
  // land straight on price estimation for it.
  const handleUseCake = (design: ShowcaseDesign) => {
    sessionStorage.setItem(
      "cf-use-cake",
      JSON.stringify({
        id: design.id,
        imageUrl: design.imageUrl,
        style: design.style,
        occasion: design.occasion,
        flavor: design.flavor,
        prompt: design.prompt,
        compiledPrompt: design.compiledPrompt,
      })
    )
    window.location.href = "/ai-cake-studio"
  }

  // Lightbox data
  const lightboxDesigns: GeneratedDesign[] = designs.map((d) => ({
    id: d.id,
    title: `${d.style}${d.occasion ? " · " + d.occasion : ""} Cake`,
    description: d.prompt,
    gradient: "from-violet-400 via-purple-300 to-indigo-400",
    style: d.style,
    liked: false,
    imageUrl: d.imageUrl,
    compiledPrompt: d.compiledPrompt,
  }))

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/ai-cake-studio"
            className="mb-4 inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700"
          >
            ← Back to AI Cake Studio
          </Link>
          <h1 className="font-heading text-3xl font-bold text-slate-900 sm:text-4xl lg:text-5xl">
            Community Cake Gallery
          </h1>
          <p className="mt-2 text-base text-slate-500">
            {total > 0 ? `${total} designs` : "Browse"} created by our community — get inspired or use a prompt to create your own
          </p>
        </div>

        {/* Filters bar */}
        <div className="mb-6 space-y-3 rounded-2xl border border-violet-100 bg-white p-4">
          {/* Occasion */}
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Occasion</p>
            <div className="flex flex-wrap gap-2">
              {OCCASION_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => { setOccasion(f.value); setTimeout(applyFilters, 0) }}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    occasion === f.value
                      ? "bg-violet-600 text-white"
                      : "border border-violet-200 bg-white text-violet-700 hover:border-violet-400"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Style + Sort row */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Style</p>
              <div className="flex flex-wrap gap-2">
                {STYLE_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => { setStyle(f.value); setTimeout(applyFilters, 0) }}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      style === f.value
                        ? "bg-violet-600 text-white"
                        : "border border-violet-200 bg-white text-violet-700 hover:border-violet-400"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">Sort</p>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setTimeout(applyFilters, 0) }}
                className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-violet-400 focus:outline-none"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && designs.length === 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-72 animate-pulse rounded-2xl border border-violet-100 bg-violet-50" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && designs.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-violet-200 bg-violet-50/30 py-16 text-center">
            <span className="text-5xl">🎂</span>
            <p className="text-sm font-semibold text-slate-600">No designs found for this filter</p>
            <p className="text-xs text-slate-400">Try a different occasion or style</p>
            <button
              type="button"
              onClick={() => { setOccasion(""); setStyle(""); setTimeout(applyFilters, 0) }}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Design grid */}
        {designs.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {designs.map((design, index) => (
              <motion.article
                key={design.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (index % 8) * 0.05 }}
                className="group overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm transition hover:shadow-md"
              >
                {/* Image */}
                <div
                  className="relative aspect-square cursor-pointer overflow-hidden bg-gradient-to-br from-violet-100 to-purple-50"
                  onClick={() => {
                    setLightboxIndex(index)
                    setLightboxOpen(true)
                  }}
                >
                  {/* next/image, not a plain <img> — the source files are full-resolution ~1.7MB
                      generated PNGs and this is a thumbnail grid. */}
                  <Image
                    src={design.imageUrl}
                    alt={`${design.style} ${design.occasion || ""} cake design`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-violet-700 opacity-0 transition group-hover:opacity-100">
                      View full
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2 flex gap-1.5">
                    <LikeButton
                      designId={design.id}
                      initialLiked={design.isLiked}
                      initialCount={design.likeCount}
                      isLoggedIn={isLoggedIn}
                    />
                    {design.commentCount > 0 && (
                      <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-600 backdrop-blur-sm">
                        💬 {design.commentCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="mb-2 flex flex-wrap gap-1">
                    <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                      {design.style}
                    </span>
                    {design.occasion && (
                      <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                        {design.occasion}
                      </span>
                    )}
                    {design.flavor && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        {design.flavor}
                      </span>
                    )}
                  </div>

                  <p className="line-clamp-2 text-xs text-slate-500 leading-relaxed">
                    {design.prompt}
                  </p>

                  {/* Use this prompt / Use this cake — side by side on
                      larger screens, compact icon+word pair on mobile */}
                  <div className="mt-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleUsePrompt(design)}
                      className="flex-1 rounded-xl border border-violet-200 bg-violet-50 py-1.5 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-100"
                    >
                      <span className="hidden sm:inline">✨ Use this prompt</span>
                      <span className="sm:hidden">✨ Prompt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUseCake(design)}
                      className="flex-1 rounded-xl border border-emerald-200 bg-emerald-50 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <span className="hidden sm:inline">🎂 Use this cake</span>
                      <span className="sm:hidden">🎂 Cake</span>
                    </button>
                  </div>

                  <PromptReveal prompt={design.compiledPrompt} compact />
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => fetchDesigns(false)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-6 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z" />
                  </svg>
                  Loading...
                </>
              ) : (
                `Load more designs`
              )}
            </button>
          </div>
        )}

        {/* Back to studio CTA */}
        <div className="mt-10 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-6 text-center">
          <p className="text-lg font-bold text-slate-900">Want to create your own?</p>
          <p className="mt-1 text-sm text-slate-500">Describe your dream cake and let AI design it in seconds</p>
          <Link
            href="/ai-cake-studio"
            className="mt-4 inline-flex rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-violet-200 transition hover:from-violet-700 hover:to-purple-700"
          >
            ✨ Start Designing
          </Link>
        </div>
      </div>

      {/* Lightbox */}
      <DesignLightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        designs={lightboxDesigns}
        startIndex={lightboxIndex}
        isLoggedIn={isLoggedIn}
      />
    </div>
  )
}
