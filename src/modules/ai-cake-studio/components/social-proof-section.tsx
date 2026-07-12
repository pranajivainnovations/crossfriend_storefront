"use client"

import { INSPIRATION_CARDS, SHOWCASE_CREATIONS } from "../data/mock-data"

function ShowcaseCard({ item }: { item: { id: string; title: string; subtitle: string; tag: string; imagePath: string } }) {
  return (
    <div className="group relative w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm transition hover:shadow-md sm:w-auto">
      <div className="relative h-[180px] w-full overflow-hidden bg-gradient-to-br from-violet-100 to-purple-100 sm:aspect-[4/3] sm:h-auto">
        <img
          src={item.imagePath}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-violet-700 shadow-sm backdrop-blur">
          {item.tag}
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{item.subtitle}</p>
      </div>
    </div>
  )
}

export default function SocialProofSection() {
  const scrollToStudio = () => {
    document.getElementById("ai-studio")?.scrollIntoView({ behavior: "smooth" })
  }

  const showcaseItems = SHOWCASE_CREATIONS.slice(0, 4)

  return (
    <section className="px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            Loved by cake enthusiasts
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            See what others are creating with AI Cake Studio
          </p>
        </div>

        {/* Showcase — horizontal scroll on mobile, grid on desktop */}
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide sm:hidden">
            {showcaseItems.map((item) => (
              <ShowcaseCard key={item.id} item={item} />
            ))}
          </div>
          <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {showcaseItems.map((item) => (
              <ShowcaseCard key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* Inspiration chips */}
        <div className="mb-8">
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Get inspired — tap a category to start
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {INSPIRATION_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={scrollToStudio}
                className="flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:border-violet-400 hover:bg-violet-100"
              >
                <span>{card.emoji}</span>
                {card.category}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-3 gap-3 text-center">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 px-3 py-5 shadow-lg shadow-violet-200">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10 blur-sm" />
            <p className="relative text-3xl font-extrabold text-white">500+</p>
            <p className="relative mt-1 text-[11px] font-semibold text-violet-200">Designs Created</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 px-3 py-5 shadow-lg shadow-pink-200">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10 blur-sm" />
            <p className="relative text-3xl font-extrabold text-white">100+</p>
            <p className="relative mt-1 text-[11px] font-semibold text-pink-200">Happy Users</p>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 px-3 py-5 shadow-lg shadow-amber-200">
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10 blur-sm" />
            <p className="relative text-3xl font-extrabold text-white">4.9/5</p>
            <p className="relative mt-1 text-[11px] font-semibold text-amber-200">User Rating</p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="rounded-2xl border border-violet-100 bg-white/80 p-4 backdrop-blur">
          <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <div className="rounded-xl bg-violet-50/60 px-3 py-3">
              <span className="text-lg">🤖</span>
              <p className="mt-1 text-xs font-bold text-slate-700">AI Powered</p>
              <p className="text-[10px] text-slate-500">Unique every time</p>
            </div>
            <div className="rounded-xl bg-violet-50/60 px-3 py-3">
              <span className="text-lg">🛡️</span>
              <p className="mt-1 text-xs font-bold text-slate-700">Verified Bakers</p>
              <p className="text-[10px] text-slate-500">Quality assured</p>
            </div>
            <div className="rounded-xl bg-violet-50/60 px-3 py-3">
              <span className="text-lg">⚡</span>
              <p className="mt-1 text-xs font-bold text-slate-700">60 Seconds</p>
              <p className="text-[10px] text-slate-500">Design to order</p>
            </div>
            <div className="rounded-xl bg-violet-50/60 px-3 py-3">
              <span className="text-lg">📍</span>
              <p className="mt-1 text-xs font-bold text-slate-700">Local Delivery</p>
              <p className="text-[10px] text-slate-500">Bakers near you</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
