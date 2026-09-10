import MobileOtpAuth from "@modules/common/components/mobile-otp-auth"

/**
 * Signing in to the account area.
 *
 * ── Why there is no sign-in / register switch any more ─────────────────────────────────────────
 * There used to be two views and a toggle between them. With a mobile number there is only one
 * question — what is your number — and whether an account already exists is our problem, not
 * something to ask somebody to declare up front. A first-time visitor and a returning one type
 * exactly the same thing; the backend creates the account if it needs to.
 *
 * That also removes the most common way people get stuck on a sign-in screen: choosing the wrong
 * side of the toggle and being told their email is already taken, or that it does not exist.
 *
 * ── Why the email and password form is deleted rather than hidden ──────────────────────────────
 * A hidden form is still a live route and still a second way in. The whole point of this change is
 * one identity and one door — see AUTH_PLAN.md.
 */
const LoginTemplate = () => {
  return (
    <div className="flex w-full justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          {/* Says what will happen, so nobody hunts for a "create account" link that no longer
              exists. */}
          Enter your mobile number and we&rsquo;ll text you a code. If you&rsquo;re new,
          this creates your account.
        </p>

        <MobileOtpAuth
          title="Sign in to CrossFriend"
          subtitle="Just your mobile number — no password to remember"
          successText="Taking you to your account…"
          redirectTo="/account"
        />

        <p className="mt-6 text-xs leading-relaxed text-slate-400">
          We use your number to sign you in and to keep you updated about your orders. You can add an
          email later in your profile if you&rsquo;d like receipts.
        </p>
      </div>
    </div>
  )
}

export default LoginTemplate
