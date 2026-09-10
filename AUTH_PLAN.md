# Streamlining sign-in: mobile OTP as the only identity

**Status:** Phases 0 and 1 done (2026-09-10, not yet deployed) · **Written:** 2026-09-10
**Decision:** mobile + OTP becomes the only way to sign in. Email/password is retired.

---

## Why now

There are **4 customers in production**. Three arrived by OTP, one by email/password, and no phone
number appears on both — so there is nothing to reconcile. Every recent signup came through OTP.

The cost of this change grows with every account. Today it is one person to migrate.

The email/password accounts belong to the team, not to customers, so retiring that path costs
nothing externally.

---

## What exists today

The two systems are not parallel. Mobile OTP has no accounts of its own — it verifies the code, then
**logs into Medusa using a password it computes**:

```
email     = {mobile}@pranajiva.in
password  = CF_{mobile}_{OTP_PASSWORD_SALT[0..16]}
```

`src/app/api/auth/otp/verify/route.ts`

So both paths already land in the same `public.customer` table. There is less to unify than it
looks — the work is not merging two systems, it is removing a dangerous shortcut from one.

Three smaller problems come from the same file:

| | |
|---|---|
| `first_name: mobile` | customers appear in Medusa admin as their own phone number |
| `@pranajiva.in` | the wrong brand's domain on the CrossFriend storefront; it will surface on receipts |
| httpOnly cookie only | works for the website, cannot be used by a mobile app later |

---

## The security problem

### What it is

A customer's password is a **pure function of their mobile number and one shared salt**. It is not
random, not per-user, and never changes — `derivePassword()` returns the same string forever.

Anyone holding the salt can compute the password for any mobile number and authenticate as that
customer. The salt lives in the storefront's `.env` and `docker-compose.yml`, so it is one
server-access or repo-access away from being every customer's password at once.

There is also a **legacy fallback still accepted** at `verify/route.ts:39`:

```
CF_{mobile}_cf_chang
```

That constant needs no salt at all. It is in the repository and in the built image. Any account
created before a real salt was set can be signed into by anyone who knows the customer's mobile
number. The code's own comment says to delete it "once the accounts created before the salt was set
have all signed in at least once" — that has never been verified, and until it is, this is the
cheapest way in.

### Why OTP-only does **not** fix it — and makes it worse

This is the part worth being clear about, because the instinct is that removing the password form
closes the door.

**Removing the form removes a page, not an endpoint.** Medusa exposes `POST /store/auth`, which
accepts an email and a password and returns a session token. That endpoint stays live whether or not
our site has a login form on it. An attacker never visits the storefront at all — they compute the
password and call the API directly.

So after the switch, the attack is unchanged: *know a mobile number, know the salt, get the account.*
No code is requested, no SMS is sent, no rate limit is touched.

It gets worse in four specific ways:

**1. The blast radius goes from most accounts to all of them.**
Today one customer chose their own password. Once OTP is the only path, *every* account's password is
derived from the same scheme and the same salt. The salt stops being a shared secret and becomes a
master key to the entire customer base — and its value grows with every customer we acquire.

**2. The username list becomes public information.**
Usernames become `{mobile}@domain`. Mobile numbers are not secret: they are on every order, given to
bakers for delivery coordination, and used on WhatsApp. An attacker needs one non-secret value and
one secret — and the secret is shared by everyone.

**3. It defeats the purpose of OTP.**
The point of a one-time code is proving possession of the phone. But possession is only ever proven
to *our route*; Medusa is handed a password and never learns an OTP happened. Everything built around
that flow — `crossfriend.otp_attempts`, the resend cooldown, the daily send limit, the DLT-registered
template — guards one door while a second, unguarded door stands beside it.

**4. Nothing can be revoked.**
There is no per-customer credential to reset. Suspecting one account is compromised means rotating
the salt, which changes every customer's password at once. That is survivable — the OTP flow simply
re-derives on next sign-in — but it means the only available response to a single incident is a
global one.

### The fix, stated plainly

> Stop deriving passwords. Have the backend issue the session token after it verifies the OTP.

The backend already owns `/store/crossfriend/otp/verify` and already confirms the code. It should
return a customer session token rather than `{ verified: true }`. Then:

- each customer gets a **random** password that nothing ever recomputes and nobody needs to know
- there is no shared secret left to leak
- `POST /store/auth` is no longer a bypass, because no password is guessable
- the token also works for a future mobile app, where an httpOnly cookie does not

---

## Target design

**One identity: the mobile number.** Email becomes an optional profile field used for receipts. It is
never a way to sign in.

```
1. Customer enters mobile
2. Backend issues OTP        (existing: /store/crossfriend/otp/send)
3. Customer enters code
4. Backend verifies AND issues a customer token  ← the change
5. Storefront sets the cookie; a future app keeps the token
```

The account is created on first successful verification, exactly as it is now — but with a random
password and a real name field rather than the phone number.

---

## Plan

### Phase 0 — stop the bleeding — **DONE**

> **Correction to an earlier version of this plan.** It said *"Rotate `OTP_PASSWORD_SALT` — rotation
> is safe, customers re-derive on next sign-in."* **That was wrong and would have locked every
> customer out.** The derived password is stored as a scrypt hash by Medusa. Change the salt and the
> newly computed password no longer matches the stored hash, login fails, the old code falls through
> to *creating* the customer, and that fails on a duplicate email — with no recovery path, because
> there is no password reset. The salt was therefore **not** rotated; Phase 1 removes the need to.

What was actually done:

1. **Checked which accounts were on the public constant**, rather than assuming. Verifying each
   stored hash against both candidate passwords found that **one live account was on
   `CF_{mobile}_cf_chang`** — created 2026-09-02, signable-into by anyone knowing that mobile number.
   The exposure was real, not theoretical.
2. **Rotated that account onto the current-salt password** — an immediate fix needing no deploy,
   because the currently-running code tries that password first. Confirmed afterwards that the public
   constant no longer works and the account still signs in.
3. **Deleted `legacyPassword()`** along with the rest of the derived-password code in Phase 1.

The salt stays in place until Phase 1 ships, then is removed entirely rather than rotated.

### Phase 1 — the backend issues the token — **DONE, not deployed**

3. `/store/crossfriend/otp/verify` now finds-or-creates the customer and returns a Medusa session
   token, minted with the same payload and lifetime as Medusa's own `/store/auth`
   (`{ customer_id, domain: "store" }`, 30 days) so every existing authenticated route accepts it
   unchanged. New service: `src/services/crossfriend/customer-session.ts`.
4. New customers get a **random 48-byte password**, thrown away immediately, and `@crossfriend.in`.
   `first_name` is left blank rather than filled with the mobile number, which is what made every
   customer show up in admin as their own phone.
5. **The stored password is randomised on every sign-in, not just at creation.** Existing accounts
   still hold a derived password, and `POST /store/auth` still accepts it — so the old attack would
   survive this change until each hash is overwritten. Rotating on each verify makes the migration
   self-healing: an account repairs itself the first time its owner signs in, with no list to work
   through.
6. The storefront route is now ~80 lines that call the backend and set a cookie. `derivePassword`,
   `legacyPassword` and every reference to `OTP_PASSWORD_SALT` are gone from `src/` — verified by
   search, not by memory.
7. `jsonwebtoken` promoted to an explicit backend dependency. It resolved by hoisting from Medusa's
   own tree, which is fine until it is not — and a hoisting break on the auth path fails at runtime,
   not at build.

**Also found:** Medusa hashes customer passwords with scrypt at `logN: 1` — a work factor of **two**,
which is effectively no key stretching. Survivable for a random secret, dangerous for a guessable
one. Another reason the derived scheme had to be removed rather than improved.

*The derived-password attack is gone the moment this deploys.*

### Phase 2 — one sign-in everywhere

6. `/account` sign-in and registration use the existing OTP component. The email/password form is
   removed, not hidden.
7. Migrate the one email/password customer: attach their phone, so their orders follow them.
8. ~~**Extend the session from 7 days to 90.**~~ **Done in Phase 1** — the cookie now lasts 30 days,
   matched to the token's own lifetime rather than exceeding it. A cookie outliving its token is
   worse than a short one: a browser that believes it is signed in and is silently rejected by every
   request. Raising both together is a one-line change whenever wanted.

### Phase 2b — the profile, and asking for the rest

Signing in with a phone number means we start with nothing else: no name, no email. That is the
right trade at the door — one field to get in — but it leaves an account that cannot be emailed a
receipt or addressed by name. The profile is where that gets filled in, over time, by choice.

9. **Email becomes an editable profile field.** `profile-email` and `profile-name` already exist in
    `src/modules/account/components/` and can be reused as they are. `profile-password` is deleted —
    there is no password to change.
10. **Ask at the moment the answer is worth something to the user, not on arrival.**
    The natural place for an email is checkout: *"Where should we send your receipt?"* asked there is
    a service, asked on a landing page it is a toll. Same field, opposite reception.
11. **A quiet completeness prompt in the account area** — a single dismissible line listing what is
    missing and why it is useful ("add your email and we'll send order receipts"). Never a modal on
    load, never blocking a purchase.

Three rules this must not break:

- **Nothing is gated on it.** A customer who never adds an email must be able to order, be delivered
  to, and be reminded. Phone is the identity; everything else is enrichment.
- **A reason accompanies every ask.** "Complete your profile" is a chore. "Add your email and we'll
  send receipts you can find later" is an offer. The second one gets answered.
- **An email for receipts is not consent to marketing.** Separate purposes under DPDP, so a separate
  opt-in, asked separately. Quietly adding a receipt address to a mailing list is the kind of thing
  that is cheap to do and expensive to have done.

### Phase 3 — cleanup

12. Remove `OTP_PASSWORD_SALT` from `.env`, `.env.template` and `docker-compose.yml` on every
    environment. **Only after Phase 1 is deployed and verified** — until then the running code still
    needs it.
13. ~~Re-check that nothing else calls `medusaClient.auth.getToken` with a computed password.~~
    Done — no call sites remain in `src/`.
14. **One-time sweep to randomise the remaining stored passwords**, so accounts are repaired without
    waiting for their owners to sign in. Run *after* deploy: doing it before would lock those
    customers out of the currently-running code.

---

## Social sign-in — considered, and declined

Worth recording the reasoning, because it will be raised again.

**It solves a problem we do not have, and reintroduces the one we are fixing.** Google gives us a
verified email. We need a verified *phone* — for delivery, for the baker to call, for reminders. So a
Google user still has to enter and verify their number afterwards: two steps where OTP is one. It is
not a shortcut here, it is a detour.

**It puts the duplicate-account problem straight back.** The entire point of this plan is one
identity. Add Google and the same person can arrive as a phone number on Monday and an email on
Friday, and something has to decide those are the same human. Account linking is where the real cost
lives — not the OAuth flow, which is a day, but the merge logic, which is forever.

**It is not what the market expects.** Swiggy, Zomato, Blinkit, Flipkart are all phone-and-OTP. A
customer in India reaches for their number first; a Google button is at best ignored and at worst
looks like it wants something.

**What social login is actually being asked to solve is friction and SMS cost — and both have better
answers:**

- **Longer sessions.** The cookie is currently **7 days** (`verify/route.ts:111`). That means a monthly
  customer does an OTP *every single visit*. At 90 days OTP becomes a once-per-device event rather
  than a tax on returning — the same friction reduction social login promises, for a one-line change
  and no second identity.
- **WhatsApp OTP later.** Cheaper per message than SMS in India and materially better deliverability.
  It needs an approved template, so it is not free, but it is aligned with a phone-first identity
  rather than pulling against it.

Revisit only if we sell outside India, or if desktop becomes a serious share of orders — where
typing a number and waiting for an SMS genuinely is worse than one click.

## Deliberately not doing

- **Email as a login method, even as a fallback.** A fallback is a second door, and second doors are
  where this problem came from.
- **Social sign-in.** See above.
- **Password reset flows.** There are no passwords to reset. That is the point.
- **Merging duplicate accounts.** None exist — verified, zero phone numbers appear on both sides.

---

## The one thing to watch

OTP-only means **anyone who loses access to their number loses access to their account**, and there
is no email fallback to recover through. That is the accepted trade of this design, not an oversight.
Support recovery will need a manual, identity-checked path in OPS before the customer base is large
enough for it to come up — worth building before it is needed, not after.
