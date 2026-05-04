import { Metadata } from "next"

import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import { PlanningProvider } from "@modules/planning/context/planning-context"
import { PincodeProvider } from "@lib/context/pincode-context"
import { WishlistProvider } from "@lib/context/wishlist-context"
import { ReviewsProvider } from "@lib/context/reviews-context"
import PlanningWizard from "@modules/planning/components/planning-wizard"
import WhatsAppWidget from "@modules/common/components/whatsapp-widget"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  return (
    <PincodeProvider>
      <WishlistProvider>
        <ReviewsProvider>
          <PlanningProvider>
            <Nav />
            {props.children}
            <Footer />
            <PlanningWizard />
            <WhatsAppWidget />
          </PlanningProvider>
        </ReviewsProvider>
      </WishlistProvider>
    </PincodeProvider>
  )
}
