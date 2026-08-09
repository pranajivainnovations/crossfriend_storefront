import { Metadata } from "next"

import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import { PlanningProvider } from "@modules/planning/context/planning-context"
import { PincodeProvider } from "@lib/context/pincode-context"
import { WishlistProvider } from "@lib/context/wishlist-context"
import { ReviewsProvider } from "@lib/context/reviews-context"
import PlanningWizard from "@modules/planning/components/planning-wizard"
import WhatsAppWidget from "@modules/common/components/whatsapp-widget"
import { getSiteSettings } from "@lib/data/site-settings"
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
  const settings = await getSiteSettings()

  return (
    <PincodeProvider>
      <WishlistProvider>
        <ReviewsProvider>
          <PlanningProvider>
            <Nav />
            {props.children}
            <Footer />
            <PlanningWizard />
            <WhatsAppWidget number={settings.whatsappNumber} />
          </PlanningProvider>
        </ReviewsProvider>
      </WishlistProvider>
    </PincodeProvider>
  )
}
