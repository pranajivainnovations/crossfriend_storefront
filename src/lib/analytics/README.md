# Analytics

GA4 with Google Consent Mode v2. Everything is off unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set —
no script, no events, no banner — so local and preview builds cannot pollute production reporting.

## Rules

- **Never call `window.gtag` directly.** Import `track` from `@lib/analytics`. It queues to the
  dataLayer, so an event fired before gtag.js finishes loading is delivered rather than dropped, and
  it is a no-op when analytics is unconfigured or running on the server.
- **Never send free text a customer typed.** The Studio reports prompt *length*, not the prompt.
- **Fire after the action succeeds, not on the click.** A rejected add-to-cart that still reported
  makes a backend failure look like a UX problem.
- **Money is converted with `toMajorUnits`.** Medusa stores minor units; GA4 wants major. The
  zero-decimal currency list is imported from `@lib/constants` rather than restated here.

## Events

| Event | Where | Notes |
|---|---|---|
| `page_view` | `PageViewTracker` | Manual — the App Router navigates without a document load, so gtag's automatic one fires once per session. `send_page_view` is off in the config. Search params included: `?type=cake` is a different page to a visitor. |
| `view_item` | product page | Keyed on handle, so re-renders do not re-report. |
| `add_to_cart` | `product-actions` | After the server action resolves. |
| `remove_from_cart` | `DeleteButton` | Only when the caller passes `analytics` — a removal with no item described is not worth reporting. |
| `begin_checkout` | cart summary | On the click, not on the checkout page mounting: that route is reachable by resumed session, bookmark and back-navigation, which would count one visitor several times. |
| `add_shipping_info` | checkout shipping | On Continue, not on selection. |
| `add_payment_info` | checkout payment | On Continue, not on selection. Skipped when the cart is null. |
| `purchase` | order confirmed | Guarded twice — see below. |
| `studio_hero_prompt_submitted` | Studio hero | A scroll-to-studio, several steps before a generation is requested. Named for where it happens so it is never mistaken for the Generate click. |
| `studio_generate_clicked` | `ai-studio-section` | The real intent — the click that actually asks for a generation. |
| `studio_design_generated` | `ai-studio-section` | Success. Carries `duration_ms`, `design_count`, style/occasion/flavour/tiers/shape and the model and provider used. **Not** fired in the `USE_MOCK_AI_STUDIO` branch: canned designs never touched an image provider, and reporting them would make generation look faster and far more reliable than it is. |
| `studio_generation_failed` | `ai-studio-section` | Carries `duration_ms`, `reason` and `model`. This is what explains the gap between the two above — without it, clicks minus designs looks like people changing their minds when it may be the provider timing out. |

### Reading the Studio funnel

`studio_generate_clicked` → `studio_design_generated` is the completion rate, and
`studio_generation_failed` accounts for the difference. `studio_hero_prompt_submitted` sits earlier
and is a different question ("did the hero send anyone to the Studio at all") — do not divide one by
the other.

`duration_ms` on both outcomes is the number to watch: how long people will actually wait is
answerable from it, and the funnel counts alone cannot tell you.

`item_id` is the product **handle**, not the Medusa id, so reports read against the URLs in Search
Console without a lookup table.

## Purchase must not double-count

The confirmation page is refreshed, bookmarked, and reached again from email and order tracking.
Two independent guards:

1. A `sessionStorage` key per transaction — catches refreshes within a session.
2. GA4's own deduplication on `transaction_id` — catches a return visit days later from a new
   session, where sessionStorage is empty.

The second one is the guard that actually holds; if storage is unavailable the event is still sent
rather than dropped.

## Consent

The tag loads immediately with **every storage type denied**, sending cookieless pings that GA4
models into aggregate traffic. Nothing identifying is stored until someone accepts. This is why the
consent default must be in the dataLayer *before* gtag.js executes — if the tag loads first it
applies its own defaults and writes `_ga` before the banner has been seen, and setting consent
afterwards is too late because the cookie is already on disk.

Advertising signals stay denied even on Accept: CrossFriend runs no ad platform, and granting a
permission nothing uses is collecting data with no purpose. Switching them on later is a one-line
change plus a `CONSENT_STORAGE_KEY` version bump, which re-asks rather than silently reusing consent
given for a narrower question.

## Adding an event

1. Add a row to the table above.
2. Call `track("name", payload)` at the point the thing actually happened.
3. Use the `@lib/analytics/ecommerce` mappers for anything involving money or products.
