import { Metadata } from "next"
import Link from "next/link"

import { ENTITY } from "@lib/constants/legal"
import { absoluteUrl, breadcrumbJsonLd, jsonLdScriptProps, ORGANIZATION_ID } from "@lib/util/seo"

/**
 * How to reach CrossFriend, and who you are reaching.
 *
 * Deliberately has no contact form. A form implies a queue somebody watches, and there is no
 * ticketing system behind one today — a message dropped into a void is worse than an email address
 * that visibly works. When there is somewhere for submissions to land, a form belongs here.
 *
 * Routes for customers and for prospective bakers are separated because they are genuinely
 * different conversations going to different places, and a single "contact us" address makes both
 * slower.
 *
 * Every legal value renders from ENTITY — see the note in `@lib/constants/legal` on why the company
 * name and address must exist in exactly one place.
 */

export const metadata: Metadata = {
  title: "Contact CrossFriend",
  description: `Contact CrossFriend — customer support, baker enquiries and the registered office of ${ENTITY.legalName} in Ghaziabad, Uttar Pradesh.`,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact CrossFriend",
    description: "Customer support, baker enquiries, and where CrossFriend is registered.",
    url: absoluteUrl("/contact"),
    type: "website",
  },
}

export default function ContactPage() {
  const contactJsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": absoluteUrl("/contact") + "#contact",
    url: absoluteUrl("/contact"),
    name: "Contact CrossFriend",
    // References the single Organization node rather than describing another one.
    mainEntity: { "@id": ORGANIZATION_ID },
  }

  return (
    <div className="content-container py-10 small:py-16">
      <script {...jsonLdScriptProps(contactJsonLd)} />
      <script
        {...jsonLdScriptProps(breadcrumbJsonLd([{ name: "Contact", path: "/contact" }]))}
      />

      <div className="max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-grey-90 small:text-4xl">Contact us</h1>
        <p className="mt-5 text-base leading-relaxed text-grey-70">
          Email is the fastest way to reach us and the only channel we monitor properly. We reply
          within one working day.
        </p>

        <div className="mt-8 grid gap-4 small:grid-cols-2">
          <div className="rounded-xl border border-ui-border-base p-5">
            <h2 className="font-heading text-base font-semibold text-grey-90">Orders and support</h2>
            <p className="mt-1 text-sm text-grey-60">
              Anything about an order you have placed, a delivery, or a refund.
            </p>
            <a
              href={`mailto:${ENTITY.supportEmail}`}
              className="mt-3 block text-sm font-medium text-grey-90 underline underline-offset-2"
            >
              {ENTITY.supportEmail}
            </a>
            <a
              href={`tel:${ENTITY.supportPhone.replace(/\s/g, "")}`}
              className="mt-1 block text-sm text-grey-70"
            >
              {ENTITY.supportPhone}
            </a>
          </div>

          <div className="rounded-xl border border-ui-border-base p-5">
            <h2 className="font-heading text-base font-semibold text-grey-90">
              Bakers and partnerships
            </h2>
            <p className="mt-1 text-sm text-grey-60">
              If you run a bakery and want to sell on {ENTITY.brand}.
            </p>
            <a
              href={`mailto:${ENTITY.supportEmail}?subject=Baker%20enquiry`}
              className="mt-3 block text-sm font-medium text-grey-90 underline underline-offset-2"
            >
              {ENTITY.supportEmail}
            </a>
            <p className="mt-1 text-sm text-grey-60">
              Include your FSSAI number and kitchen address — it saves a round trip.
            </p>
          </div>
        </div>

        <h2 className="mt-12 font-heading text-xl font-semibold text-grey-90">Operated by</h2>
        <div className="mt-3 rounded-xl bg-cf-warm p-5">
          <p className="text-sm leading-relaxed text-grey-80">
            <span className="font-semibold text-grey-90">{ENTITY.brand}</span>
            <br />A brand and online platform of
            <br />
            <span className="font-semibold text-grey-90">{ENTITY.legalName}</span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-grey-80">
            <span className="text-grey-50">Registered office</span>
            <br />
            {ENTITY.address}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-grey-80">
            <span className="text-grey-50">CIN</span>
            <br />
            {ENTITY.cin}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-grey-80">
            <span className="text-grey-50">Website</span>
            <br />
            {ENTITY.website}
          </p>
        </div>

        <h2 className="mt-12 font-heading text-xl font-semibold text-grey-90">Grievance officer</h2>
        <p className="mt-3 text-sm leading-relaxed text-grey-70">
          If a complaint has not been resolved through support, you can escalate to our grievance
          officer, appointed under the Information Technology (Intermediary Guidelines and Digital
          Media Ethics Code) Rules, 2021.
        </p>
        <p className="mt-3 text-sm text-grey-80">
          {ENTITY.grievanceOfficer.name}
          <br />
          <a
            href={`mailto:${ENTITY.grievanceOfficer.email}`}
            className="underline underline-offset-2"
          >
            {ENTITY.grievanceOfficer.email}
          </a>
        </p>

        <p className="mt-10 text-sm text-grey-60">
          More about the company on{" "}
          <Link href="/about" className="text-grey-90 underline underline-offset-2">
            About
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
