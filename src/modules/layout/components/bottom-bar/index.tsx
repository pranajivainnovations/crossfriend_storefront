"use client"

import { usePathname } from "next/navigation"

import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * The mobile bottom bar.
 *
 * ── Why this exists ────────────────────────────────────────────────────────────────────────────
 * Every screen of this site is used on a phone, and until now mobile navigation was a hamburger and
 * nothing else. Everything the business wants people to do — design a cake, browse what others made,
 * reach a human — lived behind a menu nobody opens, or at the top of a page they have already
 * scrolled past. A persistent bar puts them where a thumb already is.
 *
 * ── The slots, and what was left out ───────────────────────────────────────────────────────────
 * Five slots is the practical maximum before targets get too small to hit, so each one is a decision
 * about what CrossFriend is for:
 *
 * - **Design** takes the centre and is raised, because it is the only thing here no competitor has.
 *   A raised centre action is the one bottom-bar convention that reliably reads as "this is the
 *   thing to do", and it is worth spending on the Studio rather than on navigation.
 * - **Help** is a WhatsApp handoff. It replaces the floating button that used to sit over this exact
 *   corner, and it earns a permanent slot because a customer who wants to talk to a person is the
 *   highest-intent customer on the site.
 * - **Account** is deliberately absent. It holds orders, addresses and a profile — little a customer
 *   is looking for — and it is already in the hamburger, which is where two decades of the web have
 *   taught people to look for it. Nothing is lost by leaving it there.
 *
 * When the Personal Assistant ships it will want a slot, and Help is the one it should contest —
 * not Home, and not Design.
 *
 * ── Two things that are easy to get wrong ──────────────────────────────────────────────────────
 * The bar is `fixed`, so it covers whatever the page ends with unless the page reserves the space;
 * the layout renders a spacer of the same height for that. And it sits in the region an iPhone uses
 * for its home indicator, so the padding has to account for the safe-area inset or the labels end up
 * under the gesture bar.
 */

interface Slot {
  href: string
  label: string
  icon: React.ReactNode
  /** Matches the pathname, tolerating any locale prefix the router may have added. */
  isActive: (path: string) => boolean
}

const HOME_ICON = (
  <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 01-1.06 1.06l-.72-.72v6.88a2.25 2.25 0 01-2.25 2.25H6.81a2.25 2.25 0 01-2.25-2.25v-6.88l-.72.72a.75.75 0 11-1.06-1.06l8.69-8.69z" />
)

const GALLERY_ICON = (
  <path
    fillRule="evenodd"
    d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
    clipRule="evenodd"
  />
)

const CART_ICON = (
  <path
    fillRule="evenodd"
    d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 004.25 22.5h15.5a1.875 1.875 0 001.865-2.071l-1.263-12a1.875 1.875 0 00-1.865-1.679H16.5V6a4.5 4.5 0 10-9 0zM12 3a3 3 0 00-3 3v.75h6V6a3 3 0 00-3-3zm-3 8.25a3 3 0 106 0v-.75a.75.75 0 011.5 0v.75a4.5 4.5 0 11-9 0v-.75a.75.75 0 011.5 0v.75z"
    clipRule="evenodd"
  />
)

/** The WhatsApp glyph, matching the widget it replaces on mobile. */
const WHATSAPP_ICON = (
  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
)

export default function BottomBar({
  cartCount,
  whatsappNumber,
}: {
  cartCount: number
  whatsappNumber: string
}) {
  const pathname = usePathname() || "/"

  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hi! I need help with my order on CrossFriend."
  )}`

  const left: Slot[] = [
    {
      href: "/",
      label: "Home",
      icon: HOME_ICON,
      // Exact match only — every path starts with "/", so a prefix test would light this up forever.
      isActive: (p) => p === "/" || /^\/[a-z]{2}$/.test(p),
    },
    {
      href: "/ai-cake-studio/gallery",
      label: "Designs",
      icon: GALLERY_ICON,
      isActive: (p) => p.includes("/ai-cake-studio/gallery"),
    },
  ]

  const right: Slot[] = [
    {
      href: "/cart",
      label: "Cart",
      icon: CART_ICON,
      isActive: (p) => p.includes("/cart"),
    },
  ]

  // The Studio is active only on its own page — the gallery lives under the same path segment and
  // has its own slot, so a plain prefix test would light both at once.
  const studioActive =
    pathname.includes("/ai-cake-studio") && !pathname.includes("/ai-cake-studio/gallery")

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-cf-purple-100 bg-white/95 backdrop-blur small:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex h-14 max-w-lg items-stretch justify-between px-1">
        {left.map((slot) => (
          <BarItem key={slot.href} slot={slot} active={slot.isActive(pathname)} />
        ))}

        {/* The raised centre action. Given its own list item so the five slots stay evenly spaced. */}
        <li className="relative flex flex-1 justify-center">
          <LocalizedClientLink
            href="/ai-cake-studio"
            aria-current={studioActive ? "page" : undefined}
            className="absolute -top-5 flex flex-col items-center"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cf-purple-600 to-fuchsia-600 text-white shadow-lg transition ${
                studioActive ? "ring-4 ring-cf-purple-200" : ""
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                <path d="M12 2l1.9 4.9L19 8.8l-4.1 3.2L15.6 17 12 14.3 8.4 17l.7-5L5 8.8l5.1-1.9L12 2z" />
              </svg>
            </span>
            <span className="mt-1 text-[10px] font-bold text-cf-purple-700">Design</span>
          </LocalizedClientLink>
        </li>

        {right.map((slot) => (
          <BarItem
            key={slot.href}
            slot={slot}
            active={slot.isActive(pathname)}
            badge={slot.href === "/cart" && cartCount > 0 ? cartCount : undefined}
          />
        ))}

        {/* Not a LocalizedClientLink — this leaves the site entirely. */}
        <li className="flex flex-1">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[#128C4A]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              {WHATSAPP_ICON}
            </svg>
            <span className="text-[10px] font-semibold">Help</span>
          </a>
        </li>
      </ul>
    </nav>
  )
}

function BarItem({
  slot,
  active,
  badge,
}: {
  slot: Slot
  active: boolean
  badge?: number
}) {
  return (
    <li className="flex flex-1">
      <LocalizedClientLink
        href={slot.href}
        aria-current={active ? "page" : undefined}
        className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
          active ? "text-cf-purple-700" : "text-slate-400"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          {slot.icon}
        </svg>
        <span className="text-[10px] font-semibold">{slot.label}</span>
        {badge !== undefined && (
          <span className="absolute right-1/2 top-0 translate-x-4 rounded-full bg-cf-orange px-1.5 text-[9px] font-bold leading-4 text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </LocalizedClientLink>
    </li>
  )
}
