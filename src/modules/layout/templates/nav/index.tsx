import { Suspense } from "react"

import { listRegions } from "@lib/data"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import MegaMenu from "@modules/layout/components/mega-menu"
import PlanningTrigger from "@modules/planning/components/planning-trigger"

export default async function Nav() {
  const regions = await listRegions().then((regions) => regions)

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-white border-ui-border-base">
        <nav className="content-container flex items-center justify-between w-full h-full text-small-regular">
          {/* Left: Hamburger (mobile) + Logo + MegaMenu (desktop) */}
          <div className="flex items-center gap-x-4 h-full flex-1 basis-0">
            {/* Mobile hamburger */}
            <div className="h-full small:hidden">
              <SideMenu regions={regions} />
            </div>

            {/* Logo */}
            <LocalizedClientLink
              href="/"
              className="font-heading font-bold text-xl gradient-cf-text hover:opacity-80 transition-opacity"
              data-testid="nav-store-link"
            >
              CrossFriend
            </LocalizedClientLink>

            {/* Desktop mega-menu + top links */}
            <div className="hidden small:flex items-center gap-x-5 h-full ml-4">
              <MegaMenu />
              <LocalizedClientLink
                href="/store?type=cake"
                className="text-sm text-ui-fg-subtle hover:text-cf-orange transition-colors"
              >
                Cakes
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/store?type=decor"
                className="text-sm text-ui-fg-subtle hover:text-cf-orange transition-colors"
              >
                Decor
              </LocalizedClientLink>
              <LocalizedClientLink
                href="/store?type=gift"
                className="text-sm text-ui-fg-subtle hover:text-cf-orange transition-colors"
              >
                Gifts
              </LocalizedClientLink>
            </div>
          </div>

          {/* Right: Start Planning CTA + Search + Account + Cart */}
          <div className="flex items-center gap-x-4 h-full flex-1 basis-0 justify-end">
            {/* Start Planning CTA — desktop only */}
            <PlanningTrigger className="hidden medium:inline-flex btn-cf-primary !py-2 !px-5 text-xs">
              🎉 Start Planning
            </PlanningTrigger>

            <div className="hidden small:flex items-center gap-x-5 h-full">
              {process.env.FEATURE_SEARCH_ENABLED && (
                <LocalizedClientLink
                  className="text-sm text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
                  href="/search"
                  scroll={false}
                  data-testid="nav-search-link"
                >
                  Search
                </LocalizedClientLink>
              )}
              <LocalizedClientLink
                className="text-sm text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
                href="/account"
                data-testid="nav-account-link"
              >
                Account
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="text-sm text-ui-fg-subtle hover:text-ui-fg-base flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Cart (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
