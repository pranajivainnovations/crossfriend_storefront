import { Metadata } from "next"

import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import { PlanningProvider } from "@modules/planning/context/planning-context"
import PlanningWizard from "@modules/planning/components/planning-wizard"

export const dynamic = "force-dynamic"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:8000"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
}

export default async function PageLayout(props: { children: React.ReactNode }) {
  return (
    <PlanningProvider>
      <Nav />
      {props.children}
      <Footer />
      <PlanningWizard />
    </PlanningProvider>
  )
}
