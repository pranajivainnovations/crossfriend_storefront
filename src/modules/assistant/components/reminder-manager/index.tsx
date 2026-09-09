"use client"

import { useState, useTransition } from "react"

import {
  createReminder,
  deleteReminder,
  updateReminder,
  type Reminder,
} from "@lib/data/reminders"
import PushOptIn from "@modules/common/components/push-opt-in"

/**
 * Creating and managing reminders.
 *
 * ── Why the confirmation states the exact moment ───────────────────────────────────────────────
 * "Saved" is not enough. A reminder is a promise about a moment that may be eleven months away, and
 * nothing between now and then will tell the person whether it was understood — they find out by it
 * arriving, or by it not. So the list says "We'll tell you on Tue 22 Dec, 9:00 am" rather than
 * echoing back what they typed, because the useful confirmation is the one that could reveal a
 * mistake: a wrong year, a lead time that lands it in the wrong week.
 *
 * ── Why the delivery outcome is shown at all ───────────────────────────────────────────────────
 * Most products hide this. But "we tried and you had no device to notify" is a completely different
 * fact from "we forgot", and only one of them is the person's to fix. A reminder system that cannot
 * be audited is one that has to be taken on faith, and this one has to earn that instead.
 */

const LEAD_OPTIONS = [
  { value: 0, label: "On the day" },
  { value: 1, label: "1 day before" },
  { value: 3, label: "3 days before" },
  { value: 7, label: "A week before" },
  { value: 14, label: "2 weeks before" },
]

function formatWhen(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00+05:30`).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function ReminderManager({ reminders }: { reminders: Reminder[] }) {
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleCreate = (formData: FormData) => {
    setError(null)
    setSaved(null)
    startTransition(async () => {
      const result = await createReminder(formData)
      if (!result.ok) {
        setError(result.error ?? "Could not save that.")
        return
      }
      setSaved("Saved. It's in the list below.")
      // Uncontrolled fields; React resets the form itself once a form action resolves.
    })
  }

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null)
    setSaved(null)
    startTransition(async () => {
      const result = await fn()
      if (!result.ok) setError(result.error ?? "Could not do that.")
    })
  }

  const active = reminders.filter((r) => r.isActive)
  const paused = reminders.filter((r) => !r.isActive)

  return (
    <div className="space-y-8">
      <PushOptIn context="assistant" />

      <section className="rounded-2xl border border-cf-purple-200 bg-white p-5">
        <h2 className="text-base font-bold text-slate-900">Remember something for me</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          A birthday, an anniversary, anything you&rsquo;d rather not forget.
        </p>

        <form action={handleCreate} className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-700">What is it?</span>
            <input
              type="text"
              name="title"
              required
              maxLength={120}
              placeholder="Mum's birthday"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cf-purple-400 focus:outline-none"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Date</span>
              <input
                type="date"
                name="eventDate"
                required
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cf-purple-400 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Repeats</span>
              <select
                name="repeatRule"
                defaultValue="yearly"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cf-purple-400 focus:outline-none"
              >
                {/* Yearly by default: most of what people ask to be reminded of is a birthday or an
                    anniversary, and a one-off is the exception worth choosing deliberately. */}
                <option value="yearly">Every year</option>
                <option value="once">Just once</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-slate-700">Tell me</span>
              <select
                name="leadDays"
                defaultValue="3"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cf-purple-400 focus:outline-none"
              >
                {LEAD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-slate-700">
              Anything worth remembering <span className="font-normal text-slate-400">(optional)</span>
            </span>
            <textarea
              name="notes"
              rows={2}
              maxLength={2000}
              placeholder="What they like, what you did last year…"
              className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-cf-purple-400 focus:outline-none"
            />
            {/* Said plainly, because people will type phone numbers and details about other people
                into this box, and they should know what they are doing before they do. */}
            <span className="mt-1 block text-[11px] text-slate-400">
              Only you ever see this. It&rsquo;s deleted with the reminder.
            </span>
          </label>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
              {error}
            </p>
          )}
          {saved && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
              {saved}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-cf-purple-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cf-purple-700 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Remember this"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-base font-bold text-slate-900">Coming up</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {/* The floor the whole product stands on: this list works even for somebody who never
              turned notifications on, and on a phone where the browser cannot offer them. */}
          Here whether or not notifications are on.
        </p>

        <div className="mt-3 space-y-2">
          {active.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Nothing yet. Add the first thing above.
            </p>
          )}
          {active.map((reminder) => (
            <ReminderRow
              key={reminder.id}
              reminder={reminder}
              pending={pending}
              onPause={() => act(() => updateReminder(reminder.id, { isActive: false }))}
              onDelete={() => act(() => deleteReminder(reminder.id))}
            />
          ))}
        </div>
      </section>

      {paused.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-500">Paused ({paused.length})</h2>
          <div className="mt-2 space-y-2">
            {paused.map((reminder) => (
              <ReminderRow
                key={reminder.id}
                reminder={reminder}
                pending={pending}
                onResume={() => act(() => updateReminder(reminder.id, { isActive: true }))}
                onDelete={() => act(() => deleteReminder(reminder.id))}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ReminderRow({
  reminder,
  pending,
  onPause,
  onResume,
  onDelete,
}: {
  reminder: Reminder
  pending: boolean
  onPause?: () => void
  onResume?: () => void
  onDelete: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <article
      className={`rounded-xl border bg-white p-4 ${
        reminder.isActive ? "border-slate-200" : "border-slate-200 opacity-60"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">{reminder.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatDate(reminder.eventDate)}
            {reminder.repeatRule === "yearly" ? " · every year" : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-cf-purple-50 px-2.5 py-1 text-[11px] font-bold text-cf-purple-700">
          {reminder.leadDays === 0 ? "On the day" : `${reminder.leadDays}d before`}
        </span>
      </div>

      {reminder.notes && (
        <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {reminder.notes}
        </p>
      )}

      {/* The promise, stated as a moment rather than a restatement of the input. */}
      {reminder.isActive && reminder.nextDueAt && (
        <p className="mt-2 text-xs font-semibold text-emerald-700">
          We&rsquo;ll tell you on {formatWhen(reminder.nextDueAt)}
        </p>
      )}
      {reminder.isActive && !reminder.nextDueAt && (
        <p className="mt-2 text-xs font-semibold text-amber-700">
          Nothing further scheduled — this date has passed.
        </p>
      )}

      {/* The audit trail. See the note at the top of this file for why it is not hidden. */}
      {reminder.lastSentAt && (
        <p className="mt-1 text-[11px] text-slate-400">
          Last sent {formatWhen(reminder.lastSentAt)}
          {reminder.lastError ? ` — ${reminder.lastError}` : ""}
        </p>
      )}
      {reminder.lastStatus === "failed" && (
        <p className="mt-1 text-[11px] font-semibold text-red-600">
          The last one could not be delivered.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2">
        {onPause && (
          <button
            type="button"
            onClick={onPause}
            disabled={pending}
            className="text-xs font-semibold text-slate-500 underline underline-offset-2 hover:text-slate-800 disabled:opacity-50"
          >
            Pause
          </button>
        )}
        {onResume && (
          <button
            type="button"
            onClick={onResume}
            disabled={pending}
            className="text-xs font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-900 disabled:opacity-50"
          >
            Resume
          </button>
        )}

        {/* Two steps, because deleting is the one thing here that cannot be undone — the notes go
            with it, and they are the part somebody would actually miss. */}
        {confirming ? (
          <span className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Delete this?</span>
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="font-bold text-red-600 underline underline-offset-2 disabled:opacity-50"
            >
              Yes, delete
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="font-semibold text-slate-400 underline underline-offset-2"
            >
              Keep
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-xs font-semibold text-slate-300 underline underline-offset-2 transition hover:text-red-500"
          >
            Delete
          </button>
        )}
      </div>
    </article>
  )
}
