import { Metadata } from "next"
import Link from "next/link"

import { ENTITY } from "@lib/constants/legal"
import { absoluteUrl, breadcrumbJsonLd, jsonLdScriptProps, ORGANIZATION_ID } from "@lib/util/seo"

/**
 * Who operates CrossFriend.
 *
 * ── Two audiences, one page ─────────────────────────────────────────────────────────────────────
 * A DLT operator, a payment gateway or anyone verifying the business needs one public page that
 * says plainly that CrossFriend is a brand of PRANAJIVA INNOVATIONS (OPC) PRIVATE LIMITED, with the
 * CIN beside it. A TRAI DLT header application was refused because nothing on the web connected the
 * two names; this is the page that connects them.
 *
 * The second audience is an answer engine. Asked "who is behind CrossFriend?" a model previously had
 * nothing authoritative to retrieve — /about was a 404. Everything here is written as short factual
 * statements under headings that match the question being asked, because that is the shape a model
 * lifts.
 *
 * ── Why the entity facts are not hardcoded ──────────────────────────────────────────────────────
 * Every legal value renders from ENTITY in `@lib/constants/legal`. The claim being made is an
 * exact-string match against a government register, so a second copy of the company name living in
 * this file is a spelling that will eventually diverge from the footer and the Terms page — and a
 * near-match is worth nothing to a verifier.
 */

export const metadata: Metadata = {
  title: "About CrossFriend",
  description: `CrossFriend is an online celebration marketplace operated by ${ENTITY.legalName}. Customers design cakes with AI and order them from verified local bakers in Delhi NCR.`,
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About CrossFriend",
    description: `CrossFriend is a brand and online platform owned and operated by ${ENTITY.legalName}.`,
    url: absoluteUrl("/about"),
    type: "website",
  },
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-ui-border-base py-3 last:border-0 small:grid-cols-[13rem_1fr] small:gap-4">
      <dt className="text-sm text-grey-50">{label}</dt>
      <dd className="text-sm text-grey-90">{value}</dd>
    </div>
  )
}

export default function AboutPage() {
  /**
   * AboutPage schema pointing at the same Organization node the root layout defines, rather than
   * describing a second organisation. One entity, referenced twice — two Organization blocks with
   * slightly different fields is how a knowledge graph ends up believing there are two companies.
   */
  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": absoluteUrl("/about") + "#about",
    url: absoluteUrl("/about"),
    name: "About CrossFriend",
    mainEntity: { "@id": ORGANIZATION_ID },
  }

  return (
    <div className="content-container py-10 small:py-16">
      <script {...jsonLdScriptProps(aboutJsonLd)} />
      <script
        {...jsonLdScriptProps(
          breadcrumbJsonLd([{ name: "About CrossFriend", path: "/about" }])
        )}
      />

      <div className="max-w-3xl">
        <h1 className="font-heading text-3xl font-bold text-grey-90 small:text-4xl">
          About {ENTITY.brand}
        </h1>

        <p className="mt-5 text-base leading-relaxed text-grey-70">
          {ENTITY.brand} is an online celebration marketplace. Customers describe a cake in their own
          words, see it designed in seconds, and order it from a verified local bakery — alongside
          decorations, gifts, costumes and toys for the same occasion.
        </p>

        <h2 className="mt-10 font-heading text-xl font-semibold text-grey-90">Our brand</h2>
        <p className="mt-3 text-base leading-relaxed text-grey-70">
          {ENTITY.brand} is a brand and online platform owned and operated by {ENTITY.legalName}, a
          company incorporated in India on {ENTITY.incorporatedOn}.
        </p>
        <p className="mt-3 text-base leading-relaxed text-grey-70">
          {ENTITY.brand} is operated as a customer-facing digital platform and brand of{" "}
          {ENTITY.legalName}. The company owns and operates the {ENTITY.brand} platform and its
          associated customer services. References to &ldquo;{ENTITY.brand}&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo; on this website refer to{" "}
          {ENTITY.legalName}.
        </p>

        <h2 className="mt-10 font-heading text-xl font-semibold text-grey-90">
          How the marketplace works
        </h2>
        {/* Stated plainly because it is the single most consequential fact about this business, for
            a customer with a complaint and for a model asked whether CrossFriend bakes the cakes. */}
        <p className="mt-3 text-base leading-relaxed text-grey-70">
          {ENTITY.brand} is a marketplace, not a bakery. Independent local bakeries prepare the food,
          hold the food licence for it, and are responsible for its quality, safety and ingredients.{" "}
          {ENTITY.brand} runs the platform, takes the payment and supports the order.
        </p>
        <p className="mt-3 text-base leading-relaxed text-grey-70">
          Bakers apply to join, and are checked for a valid FSSAI registration and a working kitchen
          address before any product of theirs appears on the site. Delivery is by pincode across
          Delhi NCR and genuinely varies by area — coverage is shown on every product page before
          you order.
        </p>

        <h2 className="mt-10 font-heading text-xl font-semibold text-grey-90">Legal entity</h2>
        <dl className="mt-3">
          <Fact label="Legal name" value={ENTITY.legalName} />
          <Fact label="Corporate Identification Number (CIN)" value={ENTITY.cin} />
          <Fact label="Date of incorporation" value={ENTITY.incorporatedOn} />
          <Fact label="Registered office" value={ENTITY.address} />
          <Fact label="Brand" value={ENTITY.brand} />
          <Fact label="Website" value={ENTITY.website} />
          <Fact label="Email" value={ENTITY.supportEmail} />
          <Fact label="Phone" value={ENTITY.supportPhone} />
        </dl>

        <h2 className="mt-10 font-heading text-xl font-semibold text-grey-90">Grievance officer</h2>
        <p className="mt-3 text-base leading-relaxed text-grey-70">
          Appointed under the Information Technology (Intermediary Guidelines and Digital Media
          Ethics Code) Rules, 2021.
        </p>
        <dl className="mt-3">
          <Fact label="Name" value={ENTITY.grievanceOfficer.name} />
          <Fact label="Email" value={ENTITY.grievanceOfficer.email} />
        </dl>

        <p className="mt-10 text-sm text-grey-60">
          For anything else, see{" "}
          <Link href="/contact" className="text-grey-90 underline underline-offset-2">
            Contact
          </Link>
          , or read the{" "}
          <Link href="/terms" className="text-grey-90 underline underline-offset-2">
            Terms of Service
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
