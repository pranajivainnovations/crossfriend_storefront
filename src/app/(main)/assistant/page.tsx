import type { Metadata } from "next"
import Link from "next/link"

import { getCustomer } from "@lib/data"
import { listReminders } from "@lib/data/reminders"
import ReminderManager from "@modules/assistant/components/reminder-manager"

/**
 * CrossFriend Personal Assistant.
 *
 * ── Why this is the Assistant and not "Reminders" ──────────────────────────────────────────────
 * The name is the strategy. Reminders are the first capability of a personal assistant, not the
 * product — and what it becomes later (tell me what's coming up, help me prepare, help me act) only
 * makes sense under a name that was never "the reminder page". Calling it that today would be the
 * cheapest possible decision and the most expensive to undo, because by then people would know it by
 * that name.
 *
 * The test the whole thing is built against: if AI Cake Studio disappeared tomorrow, this page
 * should still make complete sense. Nothing here mentions a cake.
 *
 * ── Why it is useful before it is clever ───────────────────────────────────────────────────────
 * There is no intelligence in this version at all, deliberately. A reminder that arrives reliably is
 * worth more than one that is cleverly worded and occasionally missing — and trust earned by being
 * dull is what makes the later capabilities welcome rather than creepy.
 */
export const metadata: Metadata = {
  title: "Your Assistant | CrossFriend",
  description:
    "CrossFriend remembers the dates that matter to you and tells you in time to do something about them.",
}

export const dynamic = "force-dynamic"

export default async function AssistantPage() {
  const customer = await getCustomer().catch(() => null)

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="content-container py-8 small:py-12">
        <header className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cf-purple-600">
            Your Assistant
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 small:text-3xl">
            Never miss what matters
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Tell CrossFriend the dates you care about. We&rsquo;ll remind you in time to actually do
            something about them.
          </p>
        </header>

        <div className="mt-8 max-w-2xl">
          {customer ? (
            <Reminders />
          ) : (
            /* Signed out is a normal state, not an error. The page still explains what it is for,
               because somebody arriving from a link needs to know what they would be signing in to
               rather than being bounced to a login form with no context. */
            <div className="rounded-2xl border border-cf-purple-200 bg-white p-6 text-center">
              <p className="text-4xl" aria-hidden="true">
                🗓️
              </p>
              <p className="mt-3 text-sm font-bold text-slate-900">
                Sign in to start remembering
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                Your reminders are yours alone — they&rsquo;re tied to your account so they follow you
                between your phone and your laptop.
              </p>
              <Link
                href="/account"
                className="mt-4 inline-block rounded-xl bg-cf-purple-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cf-purple-700"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

/** Split out so the reminder fetch only happens for a signed-in visitor. */
async function Reminders() {
  const reminders = await listReminders()
  return <ReminderManager reminders={reminders} />
}
