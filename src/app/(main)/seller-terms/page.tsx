import type { Metadata } from "next"
import Link from "next/link"

import { ENTITY, LEGAL_PENDING } from "@lib/constants/legal"
import { Callout, LegalShell, List, Section } from "@modules/legal/components/legal-shell"

export const metadata: Metadata = {
  alternates: { canonical: "/seller-terms" },
  title: "Baker Terms",
  description:
    "The terms that apply to bakers and sellers listing on CrossFriend — onboarding, FSSAI requirements, listing obligations, payouts, and grounds for suspension.",
}

export default function SellerTermsPage() {
  return (
    <LegalShell
      title="Baker Terms"
      summary="For bakeries selling on CrossFriend. You keep your own business and your own kitchen; we provide the storefront, the orders and the payments — and we require a valid food licence and honest listings."
    >
      <Section n={1} title="Who these terms are for">
        <p>
          These terms apply between {ENTITY.legalName} and any bakery, home baker, confectioner or
          seller listing products on {ENTITY.brand}. They are in addition to our{" "}
          <Link href="/terms" className="text-cf-orange underline">
            Terms of Service
          </Link>
          .
        </p>
        <p>
          You remain an independent business. Nothing here creates an employment relationship, a
          partnership or an agency between us, except that we are authorised to collect payment from
          customers on your behalf.
        </p>
      </Section>

      <Section n={2} title="Joining CrossFriend">
        <p>
          CrossFriend is invite-only. There is no public registration. We approach bakeries, or
          onboard them following a referral, and issue an activation link.
        </p>
        <List
          items={[
            "On activation you receive a permanent Baker ID (for example CFB-00042). It identifies your bakery for as long as you are on the platform and never changes.",
            "You set your own password during activation. We never see it and cannot recover it — we can only issue a fresh activation link.",
            "You are responsible for who in your business has access to your Baker Portal login.",
          ]}
        />
      </Section>

      <Section n={3} title="Food licensing — non-negotiable">
        <Callout>
          <strong>
            You must hold a valid FSSAI registration or licence covering the kitchen you cook in, and
            it must remain valid for as long as you sell on CrossFriend.
          </strong>{" "}
          Tell us immediately if it lapses, is suspended or is cancelled. Selling without one is
          grounds for immediate removal.
        </Callout>
        <p>
          You are the food business operator for everything you make. You are responsible for the
          hygiene of your premises, equipment and staff, and for compliance with the Food Safety and
          Standards Act, 2006.
        </p>
      </Section>

      <Section n={4} title="Your listings">
        <p>You are responsible for everything on your product pages being true.</p>
        <List
          items={[
            "Ingredients and allergens must be declared before a product can be published — the platform will not let you publish without them.",
            "Photographs must be of your own work. Do not use images taken from the internet or from another bakery.",
            "Prices must be the full price the customer pays for that item, inclusive of applicable taxes.",
            "Preparation time must be one you can actually meet, consistently, on a busy day.",
            "Keep listings current. Unpublish anything you cannot make right now rather than cancelling orders for it.",
          ]}
        />
        <p>
          Publishing a product places it on the CrossFriend storefront and makes it orderable. Until
          then it stays a draft that only you can see.
        </p>
      </Section>

      <Section n={5} title="Orders">
        <List
          items={[
            "Accept or decline promptly. A customer waiting on an unanswered order is the fastest way to lose them.",
            "Make what was ordered, to the specification shown, by the delivery time agreed.",
            "Tell us as early as possible if you cannot fulfil an order. Late cancellations damage the customer's occasion and our standing with them.",
            "Package for transport. Cakes travel on two-wheelers on Indian roads.",
          ]}
        />
        <p>
          Repeated late cancellations, missed preparation times or quality complaints will affect
          your visibility on the platform and may lead to suspension.
        </p>
      </Section>

      <Section n={6} title="AI Cake Studio orders">
        <p>
          Some orders come from designs a customer generated in the AI Cake Studio. A generated image
          is a concept, not a specification.
        </p>
        <List
          items={[
            "Interpret the design faithfully using real technique and real ingredients.",
            "If a design cannot be made — structurally impossible, or beyond what is safe to eat — decline the order promptly rather than delivering something unrelated.",
            "Do not substitute a different design without telling the customer through us first.",
          ]}
        />
      </Section>

      <Section n={7} title="Pricing, commission and payouts">
        <p>
          You set your own prices. CrossFriend charges a commission on completed orders, at the rate
          agreed with you in writing during onboarding.
        </p>
        <p className="text-grey-50">Current standard commission rate: {LEGAL_PENDING}</p>
        <List
          items={[
            "We collect payment from the customer and pay you the order value less commission and any applicable deductions.",
            "Payouts are made to the bank account you provide, on the cycle agreed at onboarding.",
            "Refunds properly due to a customer for a fault in your product are deducted from your payouts.",
            "You are responsible for your own GST registration, invoicing and tax filings.",
          ]}
        />
      </Section>

      <Section n={8} title="Your profile and badges">
        <p>
          You maintain your own bakery profile from the Baker Portal — name, description,
          specialities, contact details, turnaround time and photographs.
        </p>
        <p>Some things only CrossFriend can set:</p>
        <List
          items={[
            "Whether your profile is publicly visible.",
            "Your page address (URL).",
            "The Verified badge, which reflects checks we have carried out.",
            "The Blue Tick, awarded on quality criteria and separate from verification.",
            "Your position in featured placements.",
          ]}
        />
        <p>
          These are ours to grant and to withdraw. We will tell you why if we withdraw one.
        </p>
      </Section>

      <Section n={9} title="Customer data">
        <Callout>
          You receive customer details only to fulfil an order — name, delivery address, contact
          number and order contents. You may use them for that purpose and no other.
        </Callout>
        <List
          items={[
            "Do not market to CrossFriend customers using details obtained through the platform.",
            "Do not attempt to move a CrossFriend customer to a direct transaction to avoid commission.",
            "Do not retain customer contact details after an order is complete beyond what your own records require.",
            "Do not sell or share customer data with anyone.",
          ]}
        />
      </Section>

      <Section n={10} title="Suspension and removal">
        <p>We may suspend or remove a bakery, with immediate effect where necessary, for:</p>
        <List
          items={[
            "an invalid, lapsed or missing FSSAI licence",
            "a serious food safety incident, while it is investigated",
            "false ingredient or allergen information",
            "using photographs that are not of your own work",
            "repeated cancellations, no-shows or quality complaints",
            "misuse of customer data, or soliciting customers off-platform",
            "abusive conduct toward customers, delivery partners or our staff",
          ]}
        />
        <p>
          You may leave at any time by unpublishing your products and telling us. Orders already
          accepted must still be fulfilled.
        </p>
      </Section>

      <Section n={11} title="Liability">
        <p>
          You are responsible for the food you make, and you indemnify {ENTITY.legalName} against
          claims arising from it — including food safety incidents, allergen misdeclaration, and
          infringement of someone else&apos;s rights in images or designs you upload.
        </p>
        <p>
          Our liability to you is limited to commission actually received on the affected orders.
        </p>
      </Section>

      <Section n={12} title="Contact">
        <p>
          Baker support:{" "}
          <a href={`mailto:${ENTITY.supportEmail}`} className="text-cf-orange underline">
            {ENTITY.supportEmail}
          </a>{" "}
          · {ENTITY.supportPhone}
        </p>
        <p>
          Governed by the laws of India, with exclusive jurisdiction in {ENTITY.jurisdiction}.
        </p>
      </Section>
    </LegalShell>
  )
}
