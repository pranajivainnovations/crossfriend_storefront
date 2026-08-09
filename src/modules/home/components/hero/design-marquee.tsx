import Image from "next/image"
import Link from "next/link"

import type { ShowcaseDesign } from "@lib/data/showcase"

/**
 * Two slow columns of real generated cakes, drifting in opposite directions.
 *
 * CSS animation on a duplicated list rather than JavaScript: it runs on the compositor, costs
 * nothing on the main thread while the rest of the page hydrates, and it works before any JS loads
 * at all. The list is rendered twice and translated by exactly -50%, which is what makes the loop
 * seamless — any other offset shows a visible jump each cycle.
 *
 * `prefers-reduced-motion` stops it outright (see globals.css). Drifting imagery is exactly the
 * kind of ambient movement that triggers vestibular discomfort, and the columns read perfectly well
 * as a static collage.
 */
export default function DesignMarquee({ designs }: { designs: ShowcaseDesign[] }) {
  if (designs.length === 0) return null

  const mid = Math.ceil(designs.length / 2)
  const columns = [designs.slice(0, mid), designs.slice(mid)]

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative grid h-full grid-cols-2 gap-3 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
    >
      {columns.map((column, i) => {
        if (column.length === 0) return null
        return (
          <div
            key={i}
            className={`flex flex-col gap-3 ${i === 0 ? "animate-drift-up" : "animate-drift-down"}`}
          >
            {/* Rendered twice: the second copy is what the first scrolls into. */}
            {[...column, ...column].map((design, j) => (
              <figure
                key={`${design.id}-${j}`}
                className="relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10"
              >
                <Image
                  src={design.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 40vw, 20vw"
                  className="object-cover"
                  // Only the first few are above the fold on a tall screen; the rest can wait.
                  loading={j < 2 ? "eager" : "lazy"}
                />
              </figure>
            ))}
          </div>
        )
      })}
    </div>
  )
}

/**
 * The same designs as a static, interactive strip for narrow screens.
 *
 * The marquee is decorative and aria-hidden, so on mobile — where it is hidden entirely — this
 * carries the actual content: real designs, their prompts, and a way into the gallery.
 */
export function DesignStrip({ designs }: { designs: ShowcaseDesign[] }) {
  if (designs.length === 0) return null

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex gap-3">
        {designs.slice(0, 8).map((design) => (
          <li key={design.id} className="w-40 shrink-0">
            <Link href="/ai-cake-studio/gallery" className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                <Image
                  src={design.imageUrl}
                  alt={design.prompt || "AI generated cake design"}
                  fill
                  sizes="160px"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              </div>
              {design.prompt && (
                <p className="mt-2 line-clamp-2 text-xs leading-snug text-white/50">
                  &ldquo;{design.prompt}&rdquo;
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
