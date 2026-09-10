import { Metadata } from "next"

import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import { PlanningProvider } from "@modules/planning/context/planning-context"
import { PincodeProvider } from "@lib/context/pincode-context"
import { WishlistProvider } from "@lib/context/wishlist-context"
import { ReviewsProvider } from "@lib/context/reviews-context"
import PlanningWizard from "@modules/planning/components/planning-wizard"
import WhatsAppWidget from "@modules/common/components/whatsapp-widget"
import BottomBar from "@modules/layout/components/bottom-bar"
import { retrieveCart } from "@modules/cart/actions"
import { getSiteSettings } from "@lib/data/site-settings"
import { getAnnouncement } from "@lib/data/announcement"
import AnnouncementBanner from "@modules/layout/components/announcement-banner"
import { BASE_URL } from "@lib/util/seo"

/**
 * Deliberately NOT force-dynamic.
 *
 * ── What force-dynamic was doing here ──────────────────────────────────────────────────────────
 * It was added to stop Next calling Medusa during the build, and it did that. But in Next 14
 * `dynamic = "force-dynamic"` also sets the segment's default `fetchCache` to `"force-no-store"`,
 * and because this is the layout, that applied to every fetch on every page beneath it. The result
 * was that getSiteSettings and getAnnouncement — both written with `next: { revalidate: 60 }` —
 * never cached anything, and neither did the four catalogue calls in Nav.
 *
 * That is expensive here in a way it would not be in most deployments: the storefront runs in
 * Mumbai and the backend in Stockholm, so each of those calls is a round trip of roughly 6,000 km.
 * Eight of them, uncached, on every single page view, is most of a three-second first byte.
 *
 * ── Why removing it does not reintroduce build-time Medusa calls ───────────────────────────────
 * These pages are still rendered per request: retrieveCart below reads an httpOnly cookie, and so
 * does CartButton inside Nav, which opts the whole route into dynamic rendering on its own. What
 * changes is only that the fetch Data Cache is allowed to work again — dynamic rendering and the
 * Data Cache are independent, and it was the implicit force-no-store, not the rendering mode, that
 * was costing the time.
 *
 * If the cart ever moves to a client-side fetch, these pages become statically renderable and this
 * comment stops being true — check both call sites before assuming it still is.
 */

/**
 * BASE_URL comes from the shared seo module. This file previously declared its own copy defaulting
 * to "https://localhost:8000", a second instance of the bug that had production publishing
 * localhost canonicals — and because this layout wraps every customer-facing page, its metadataBase
 * overrode the root layout's for all of them. One definition, one place to be wrong.
 */
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  /* Fetched alongside settings rather than after it. Both sit above every page, and serialising
     two independent backend calls would put their latency end to end on first paint. */
  const [settings, announcement] = await Promise.all([getSiteSettings(), getAnnouncement()])

  /**
   * Cart count for the mobile bar's badge.
   *
   * Read here rather than inside the bar because the bar is a client component and the cart lives
   * behind an httpOnly cookie. Every page under this layout is force-dynamic and the nav already
   * retrieves the cart in the same request, so Next's fetch deduplication makes this free rather
   * than a second round trip.
   */
  const cart = await retrieveCart().catch(() => null)
  const cartCount = cart?.items?.reduce((n, item) => n + (item.quantity ?? 0), 0) ?? 0

  return (
    <PincodeProvider>
      <WishlistProvider>
        <ReviewsProvider>
          <PlanningProvider>
            {/* Above the nav, because a banner below it reads as page content and gets scrolled
                past. Renders nothing at all when there is no announcement — no reserved space, no
                layout shift. */}
            {announcement && <AnnouncementBanner announcement={announcement} />}
            <Nav />
            {props.children}
            <Footer />
            <PlanningWizard />
            <WhatsAppWidget number={settings.whatsappNumber} />
            <BottomBar cartCount={cartCount} whatsappNumber={settings.whatsappNumber} />
            {/* Reserves the height the fixed bar occupies. Without it the bar sits on top of
                whatever each page ends with — most visibly the footer's last row. */}
            <div className="h-14 small:hidden" aria-hidden="true" />
          </PlanningProvider>
        </ReviewsProvider>
      </WishlistProvider>
    </PincodeProvider>
  )
}
