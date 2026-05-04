import { Text, clx } from "@medusajs/ui"

import { getCategoriesList, getCollectionsList } from "@lib/data"
import { getOccasions, getProductTypes } from "@lib/data/dynamic"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import MedusaCTA from "@modules/layout/components/medusa-cta"

export default async function Footer() {
  const [{ collections }, occasions, productTypes] = await Promise.all([
    getCollectionsList(0, 6),
    getOccasions(),
    getProductTypes(),
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
                    className="hover:text-white transition-colors"
                  >
                    Cart
                  </LocalizedClientLink>
                </li>
                <li>
                  <LocalizedClientLink
                    href="/store"
                    className="hover:text-white transition-colors"
                  >
                    All Products
                  </LocalizedClientLink>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex w-full mb-8 pt-6 border-t border-grey-80 justify-between text-grey-40">
          <Text className="txt-compact-small">
            © {new Date().getFullYear()} CrossFriend. All rights reserved.
          </Text>
          <MedusaCTA />
        </div>
      </div>
    </footer>
  )
}
