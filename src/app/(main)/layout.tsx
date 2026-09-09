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

// Force ALL pages under (main) to render at request time — no build-time Medusa calls
export const dynamic = "force-dynamic"

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
