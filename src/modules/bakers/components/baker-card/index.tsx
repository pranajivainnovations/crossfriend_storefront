import Link from "next/link"
import Image from "next/image"

import type { BakerSummary } from "@lib/data/bakers"
import BakerBadges from "../baker-badges"

/**
 * One baker in the directory grid.
 *
 * The whole card is the link rather than a "View" button — a card that looks clickable and isn't
 * is a small, constant irritation, and it costs nothing to make the obvious target the real one.
 *
 * No photo is the common case for a freshly onboarded bakery, so the fallback is a designed state
 * (brand-tinted monogram) rather than a broken-image frame or a grey box.
 */
export default function BakerCard({ baker }: { baker: BakerSummary }) {
  const location = [baker.city, baker.state].filter(Boolean).join(", ")

  return (
    <Link
      href={`/bakers/${baker.slug}`}
      className="group flex flex-col overflow-hidden rounded-large border border-grey-20 bg-white transition hover:border-cf-purple-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cf-purple"
      data-testid="baker-card"
    >
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-cf-purple-50">
        {baker.photoUrl ? (
          <Image
            src={baker.photoUrl}
            alt={baker.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="text-4xl font-bold text-cf-purple-300"
              aria-hidden="true"
            >
              {baker.name.trim().charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-y-2 p-4">
        <div className="flex items-start justify-between gap-x-2">
          <h3 className="text-base-semi leading-snug text-grey-90 line-clamp-2">
            {baker.name}
          </h3>
          <BakerBadges
            blueTick={baker.blueTick}
            trustBadge={baker.trustBadge}
            size="small"
          />
        </div>

        {location && (
          <p className="text-small-regular text-grey-50">{location}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-small-regular text-grey-50">
          {baker.rating != null && (
            <span className="flex items-center gap-x-1 text-grey-70">
              <span className="text-cf-yellow" aria-hidden="true">
                ★
              </span>
              <span className="tabular-nums font-semibold">
                {baker.rating.toFixed(1)}
              </span>
              {baker.reviewCount > 0 && <span>({baker.reviewCount})</span>}
            </span>
          )}
          <span>
            {baker.productCount === 1
              ? "1 item"
              : `${baker.productCount} items`}
          </span>
        </div>
      </div>
    </Link>
  )
}
