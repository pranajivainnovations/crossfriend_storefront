/**
 * Trust markers on a baker.
 *
 * Two distinct things, deliberately not merged into one "verified" concept:
 *
 *   trustBadge — CrossFriend has verified this is a real, operating bakery.
 *   blueTick   — granted after the baker meets the full profile/quality criteria.
 *
 * A baker can have the first without the second, and claiming an account grants neither. Keeping
 * them separate in the UI is what stops "verified" quietly coming to mean "we checked they exist",
 * which is the failure mode every marketplace badge eventually drifts into.
 */
export default function BakerBadges({
  blueTick,
  trustBadge,
  size = "normal",
}: {
  blueTick: boolean
  trustBadge: boolean
  size?: "normal" | "small"
}) {
  if (!blueTick && !trustBadge) return null

  const dimension = size === "small" ? "h-4 w-4" : "h-5 w-5"

  return (
    <span className="flex shrink-0 items-center gap-x-1">
      {blueTick && (
        <span title="Blue tick — verified quality" aria-label="Blue tick verified">
          <svg
            className={`${dimension} text-cf-purple`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 1.5l2.1 1.6 2.6-.3 1 2.4 2.3 1.2-.7 2.6.7 2.6-2.3 1.2-1 2.4-2.6-.3L10 18.5l-2.1-1.6-2.6.3-1-2.4L2 13.6l.7-2.6L2 8.4l2.3-1.2 1-2.4 2.6.3L10 1.5zm3.6 6.2a.75.75 0 00-1.2-.9l-3.1 4.2-1.7-1.6a.75.75 0 10-1 1.1l2.3 2.2a.75.75 0 001.1-.1l3.6-4.9z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
      {trustBadge && (
        <span title="Verified bakery" aria-label="Verified bakery">
          <svg
            className={`${dimension} text-emerald-600`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 1.6l6.5 2.4v5.2c0 3.9-2.6 7.5-6.5 8.9-3.9-1.4-6.5-5-6.5-8.9V4L10 1.6zm3.3 5.9a.75.75 0 00-1.15-.96l-3 3.6-1.35-1.3a.75.75 0 10-1.04 1.08l1.93 1.86a.75.75 0 001.1-.06l3.5-4.22z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      )}
    </span>
  )
}
