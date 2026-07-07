# AI Cake Studio

## Goal

Ship AI Cake Studio as a production-ready experience that:

- lets users generate cake concepts from prompts and selections,
- converts those concepts into real cake orders,
- protects the image-generation budget with login, quotas, and abuse controls.

---

## Current Status

### Completed

- AI Cake Studio landing page structure is in place.
- Hero, inspiration cards, showcase gallery, AI studio form, baker handoff, and bottom CTA are implemented.
- Local image folders under `public/ai-cake-studio/` are set up.
- Mock data powers the current design-generation flow.
- Layout resilience was added so page rendering does not fully fail when backend storefront data is unavailable.
- AI Studio image rendering was upgraded to use local assets.

### In Progress

- Build validation and final cleanup.
- Production-quality content and final asset replacement.
- Definition of generation limits, login requirements, and usage tracking.

### Not Done Yet

- Real AI image generation backend.
- Auth-gated generation flow.
- Free-attempt/token accounting.
- Admin visibility into generation consumption.
- Final production QA across devices and end-to-end flow.

---

## Remaining Work

### 1. Stabilize the build

- Re-run `npm run build` and confirm zero TypeScript failures.
- Clean up remaining non-blocking `img` warnings outside the AI Studio module.
- Re-check `hero-section.tsx` because it was edited again after earlier fixes.

### 2. Replace placeholder content with final assets

- Add final approved images for hero, inspiration, showcase, baker, and CTA sections.
- Review alt text, cropping, and mobile behavior for each image.

### 3. Move from mock generation to real generation

- Add a real API route for cake image generation.
- Define the prompt payload shape from the current form fields.
- Persist the generated result metadata so the user can revisit their outputs.
- Decide whether generated images are stored locally, in object storage, or through provider-hosted URLs.

### 4. Gate generation behind login

- Require user authentication before first generation request.
- Keep browsing AI Cake Studio public, but block generate actions for anonymous users.
- Show a clear sign-in wall when a guest clicks generate.

### 5. Add quota and abuse protection

- Track how many generations each user has consumed.
- Rate-limit requests to prevent rapid drain of credits.
- Add fallback controls for non-user abuse such as IP/device throttling.
- Block repeated retries while a request is already in progress.

### 6. Set up cake add-ons in Medusa admin

Add-ons shown in the price estimator (candles, toppers, sparklers, etc.) are now
driven live from the database via `/api/cake-addons`. Until the category is created,
the estimator falls back to the hardcoded list automatically — so nothing is broken today.

To migrate fully to DB-driven add-ons:

- [ ] Create a **Product Category** in Medusa admin with handle `cake-addons`
- [ ] Create each add-on as a **Product** inside that category with a variant and a price
- [ ] On each product's **Metadata**, set:
  - `emoji` — e.g. `🕯️`
  - `suggestFor` — comma-separated occasions/styles, e.g. `Birthday,Kids`
  - `price` — (optional) direct ₹ override; otherwise variant price ÷ 100 is used
- [ ] Verify add-ons appear in the price estimator and can also be sold standalone from the store

### 7. Complete the order handoff flow

- Define what happens after a user selects a generated design.
- Decide whether selection creates a saved design, draft cart item, lead, or baker inquiry.
- Connect the selected design to baker discovery or custom cake checkout.

### 7. Validate the experience end to end

- Test mobile, tablet, and desktop layouts.
- Test login-required generation behavior.
- Test exhausted-quota behavior.
- Test generation failure and retry states.
- Test backend-unavailable fallback states.

---

## Recommended Usage Policy

## Core Recommendation

Yes, it is workable, and it should be implemented before launching real AI generation.

The safest practical model is:

- browsing is open,
- generation requires login,
- each user receives a small free allowance,
- additional usage is unlocked later through paid packs, order milestones, or admin grants.

## Suggested Free Allowance

Recommended starting policy:

- `3` free generations for every newly registered user,
- optional `1` bonus generation after verified email or first saved profile completion,
- no anonymous free generations once the real model is connected.

Why `3` is a good starting point:

- enough for exploration,
- low enough to protect budget,
- easy to communicate,
- gives real data before pricing is introduced.

If model cost is very low, you can raise this to `5`. If cost is high or abuse risk is high, start at `2`.

---

## How To Track Free Attempts

### Track per user

For every authenticated user, store:

- `free_generation_limit`
- `free_generations_used`
- `paid_generation_balance`
- `last_generation_at`
- `generation_status` for in-flight request protection

### Track every generation event

Create a generation ledger/history table with fields like:

- `id`
- `customer_id`
- `prompt`
- `occasion`
- `style`
- `provider`
- `provider_model`
- `status`
- `image_count`
- `credit_cost`
- `created_at`
- `failed_reason`

This gives you:

- auditability,
- cost visibility,
- analytics on which prompts and styles convert,
- the ability to investigate abuse or provider failures.

### Add abuse protection beyond login

Login alone is not enough. Also add:

- per-user cooldown, for example `1` request every `20` to `30` seconds,
- per-IP rate limit,
- daily cap, for example `5` total generations per day for free-tier users,
- server-side lock to prevent duplicate submits.

---

## Recommended Product Rules

### MVP Rules

- Guests can view the page but cannot generate.
- Logged-in users get `3` free generations total.
- Each generation can return up to `3` image concepts.
- Regenerate consumes another generation.
- Failed provider calls should not consume credits if no usable image is returned.

### Post-MVP Rules

- Add paid credit packs.
- Add bonus credits after first order or custom cake purchase.
- Add admin/manual credit grants for support cases.
- Add higher limits for premium or repeat customers.

---

## Suggested UX States

### Guest user

- Generate button opens login/signup prompt.
- Copy should explain that login is required to save designs and unlock free generations.

### Logged-in user with credits left

- Show remaining balance near the generate button.
- Example: `2 free generations left`.

### Logged-in user with no credits left

- Disable generate button.
- Show next action:
  - buy more credits,
  - request a custom cake consultation,
  - or continue with previously generated designs.

### Failure state

- If the provider fails, show a retry message.
- Only deduct credits after a successful completed generation.

---

## Suggested Implementation Order

### Phase A

- Finish current build cleanup.
- Finalize assets and responsive QA.

### Phase B

- Add real generation API.
- Add login-required generate action.

### Phase C

- Add credit counters and generation ledger.
- Add rate limiting and cooldowns.

### Phase D

- Add exhausted-credit UX.
- Add admin reporting and optional paid credits.

---

## Definition of Done

AI Cake Studio is complete when:

- production build passes,
- final assets are in place,
- generation uses a real backend,
- only logged-in users can generate,
- free usage is limited and tracked server-side,
- exhausted-credit and provider-failure flows are handled cleanly,
- the selected design can move into the next order/baker flow,
- the full feature is QA-tested across devices.

---

## Open Decisions

- Which AI provider will be used for cake image generation?
- How many images should one generation return?
- Should credits be lifetime free credits, daily free credits, or both?
- Should users be able to purchase extra credits?
- Where should generated images be stored?
- What is the next step after selecting a design: baker inquiry, custom cake checkout, or saved concept library?

---

## Counter vs Token — Decision Log

**Decision: Use attempt counter in the UI, credit balance in the backend.**

### Why counter for UI

- Users understand "3 free attempts left" immediately.
- "Token" is a technical term and will confuse non-tech users.
- Counter is simpler to explain, design, and build now.
- Can still evolve to token-based pricing later without redesigning the UI language.

### Why credit balance in the backend

- More flexible for future paid packs.
- Separates free vs purchased vs bonus credits.
- Easier to audit and grant manually.

### Terminology split

| Surface | Term to use |
|---|---|
| UI facing users | Free attempts, attempts left |
| Backend data model | generation_balance, credit |
| Admin / internal | generation credit, quota |

---

## How Users Can Get More Generations

### Phase 1 — MVP

| Source | Amount | Notes |
|---|---|---|
| New account | 3 free attempts | Granted at registration |
| Verify email | +1 | Optional, easy win |

### Phase 2 — Post-launch

| Source | Amount | Notes |
|---|---|---|
| First custom cake order | +5 | Reward purchase with more AI usage |
| Any order above threshold | +2 | Encourages repeat orders |
| Complete full profile | +1 | Drives data quality |
| Admin manual grant | any amount | For support, VIP, testing |

### Phase 3 — Monetisation

| Source | Amount | Notes |
|---|---|---|
| Paid pack: Starter | 5 attempts | Small purchase |
| Paid pack: Creator | 15 attempts | Mid-tier |
| Paid pack: Studio | 50 attempts | Power user |
| Premium subscription | Monthly allowance | Bundled with other perks |

### Backend data model for tracking

Each user has:

- `free_generation_limit` — fixed at 3 for now
- `free_generations_used` — increments per successful generation
- `bonus_generation_balance` — starts at 0, can be increased by admin or purchases
- `last_generation_at` — for cooldown enforcement
- `generation_locked` — boolean, true when request is in-flight

Available attempts shown in UI:

```
remaining = (free_generation_limit - free_generations_used) + bonus_generation_balance
```

---

## UI States Implemented

### State 1 — Guest (not logged in)

- Full form is accessible so user can explore.
- Generate button is replaced with "Login to Generate".
- Sub-text: "Free account needed — 3 free attempts on signup".
- Clicking redirects to `/account`.

### State 2 — Logged in, attempts remaining

- Small badge near generate button: `✨ {N} free attempt{s} remaining`.
- Generate button is enabled when prompt is filled.
- Counter decrements locally on each successful generation.
- Real decrement comes from server once backend quota API is live.

### State 3 — Logged in, no attempts left

- Generate button is disabled and shows "No free attempts left".
- Show earn-more nudge: "Place an order to earn more" or "Get extra attempts".
- User can still view and interact with previously generated designs.

### State 4 — In progress

- Generate button shows spinner and "Generating..." text.
- All inputs are disabled during generation.
- Prevents double-submit.

### State 5 — Provider failure

- Show inline error message.
- Do not deduct attempt counter on failure.
- Offer retry without cost.