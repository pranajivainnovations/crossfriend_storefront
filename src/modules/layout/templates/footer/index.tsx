import { Text } from "@medusajs/ui"

import { getCollectionsList } from "@lib/data"
import { getOccasions, getProductTypes } from "@lib/data/dynamic"
import { ENTITY, LEGAL_PAGES } from "@lib/constants/legal"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PushOptIn from "@modules/common/components/push-opt-in"
import MedusaCTA from "@modules/layout/components/medusa-cta"

export default async function Footer() {
  const [{ collections }, occasions, productTypes] = await Promise.all([
    getCollectionsList(0, 6).catch(() => ({ collections: [] })),
    getOccasions().catch(() => []),
    getProductTypes().catch(() => []),
  ])

  return (
    <footer className="border-t border-ui-border-base w-full bg-grey-90 text-white">
      <div className="content-container flex flex-col w-full">
        {/* Top section */}
        <div className="flex flex-col gap-y-8 xsmall:flex-row items-start justify-between py-16">
          {/* Brand column */}
          <div className="max-w-xs">
            <LocalizedClientLink
              href="/"
              className="font-heading font-bold text-2xl gradient-cf-text"
            >
              CrossFriend
            </LocalizedClientLink>
            <p className="mt-3 text-sm text-grey-40 leading-relaxed">
              Make every celebration unforgettable. Cakes, decorations, gifts,
              costumes — everything you need, planned in minutes.
            </p>
          </div>

          {/* Links grid */}
          <div className="text-small-regular gap-10 md:gap-x-16 grid grid-cols-2 sm:grid-cols-4">
            {/* Occasions (dynamic) */}
            {occasions.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-grey-40 mb-1">
                  Occasions
                </span>
                <ul className="grid grid-cols-1 gap-2">
                  {occasions.map((o) => (
                    <li key={o.slug}>
                      <LocalizedClientLink
                        href={`/occasions/${o.slug}`}
                        className="text-sm text-grey-30 hover:text-white transition-colors"
                      >
                        {o.emoji} {o.label}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Categories (dynamic from product types) */}
            {productTypes.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-grey-40 mb-1">
                  Categories
                </span>
                <ul className="grid grid-cols-1 gap-2">
                  {productTypes.map((item) => (
                    <li key={item.value}>
                      <LocalizedClientLink
                        href={item.href}
                        className="text-sm text-grey-30 hover:text-white transition-colors"
                      >
                        {item.label}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Collections (from Medusa) */}
            {collections && collections.length > 0 && (
              <div className="flex flex-col gap-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-grey-40 mb-1">
                  Collections
                </span>
                <ul className="grid grid-cols-1 gap-2">
                  {collections.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <LocalizedClientLink
                        href={`/collections/${c.handle}`}
                        className="text-sm text-grey-30 hover:text-white transition-colors"
                      >
                        {c.title}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Help & info */}
            <div className="flex flex-col gap-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-grey-40 mb-1">
                Help
              </span>
              <ul className="grid grid-cols-1 gap-2 text-sm text-grey-30">
                <li>
                  <LocalizedClientLink
                    href="/account"
                    className="hover:text-white transition-colors"
                  >
                    My Account
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/cart"
                    prefetch={false}
                    className="hover:text-white transition-colors"
                  >
                    Cart
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/ready-to-order"
                    className="hover:text-white transition-colors"
                  >
                    Ready to Order
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/bakers"
                    className="hover:text-white transition-colors"
                  >
                    Local Bakers
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>

            {/* Legal. Its own column rather than buried in Help: a payment gateway, an app store
                reviewer and a customer looking for the refund policy all expect to find these
                from the footer, and all three go looking in the same place. */}
            <div className="flex flex-col gap-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-grey-40 mb-1">
                Legal
              </span>
              <ul className="grid grid-cols-1 gap-2 text-sm text-grey-30">
                {LEGAL_PAGES.map((p) => (
                  <li key={p.href}>
                    <LocalizedClientLink
                      href={p.href}
                      className="hover:text-white transition-colors"
                    >
                      {p.label}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex w-full flex-col gap-3 mb-8 pt-6 border-t border-grey-80 text-grey-40 small:flex-row small:items-center small:justify-between">
          <div className="text-xs leading-relaxed">
            {/*
              The ownership statement sits ABOVE the copyright line, and says "brand and online
              platform owned and operated by" rather than a looser "operated by".

              That phrasing is doing a specific job. A brand name alone does not tell a customer who
              they contracted with, and more immediately: TRAI DLT registration, payment gateways and
              the MCA register all need to see that CrossFriend and the company are one entity. A DLT
              header application was rejected precisely because nothing publicly connected the two.
              The CIN is included because that is the string a verifier looks up.

              Every value renders from ENTITY, so the spelling here can never drift from the legal
              pages — which is the whole point when the thing being asserted is an exact-match claim.
            */}
            <p className="text-grey-50">
              {ENTITY.brand} is a brand and online platform owned and operated by{" "}
              {ENTITY.legalName}, Uttar Pradesh, India. CIN: {ENTITY.cin}
            </p>
            <Text className="txt-compact-small mt-1">
              © {new Date().getFullYear()} {ENTITY.brand}. All rights reserved.
            </Text>
            <p className="mt-1 text-grey-50">
              {ENTITY.supportEmail} · {ENTITY.supportPhone}
            </p>
            {/* The permanent off switch.
                The opt-in is offered once, after somebody generates a design — but turning it off
                must never require reproducing the moment that turned it on. It renders nothing at
                all unless this browser can actually receive notifications, so it stays invisible to
                everyone it would only confuse. */}
            <div className="mt-2">
              <PushOptIn context="footer" compact />
            </div>
          </div>
          <MedusaCTA />
        </div>
      </div>
    </footer>
  )
}
