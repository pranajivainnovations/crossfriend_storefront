/**
 * RETIRED — the occasion × product type mapping now lives in Postgres.
 *
 * It is edited in OPS at /taxonomy, served by GET /store/crossfriend/taxonomy, and read by
 * `@lib/data/taxonomy`. Use `getOccasionTypeValues(handle)` instead of the old `getOccasionTypes`.
 *
 * ── Why this file is gone rather than kept as a fallback ────────────────────────────────────────
 * It read type-occasion-map.json from disk, overlaid it on a hardcoded TYPE_OCCASION_MAP, and
 * validated every key against a frozen PRODUCT_TYPES array — silently discarding anything the array
 * did not already contain. The JSON's `"Fancy-Dress"` key had therefore never taken effect at any
 * point in its life: the whitelist spells it `costume`, so the loader dropped the line and fell
 * back to the hardcoded default. Someone edited that file believing they had changed behaviour.
 *
 * A fallback would reintroduce exactly that failure mode — a second answer that silently wins when
 * the first is unavailable, with no way to tell which one is live. The taxonomy route already
 * degrades safely on its own: an unreachable backend yields an empty taxonomy, and every consumer
 * renders nothing rather than something wrong.
 *
 * This stub exists only so a stale import fails at build time with an explanation, instead of
 * resolving to a module that quietly returns different answers.
 */

export function loadOccasionMap(): never {
  throw new Error(
    "loadOccasionMap() is retired. The occasion × type matrix is in Postgres — " +
      "use getTaxonomy() from @lib/data/taxonomy, edited in OPS at /taxonomy."
  )
}

export function getOccasionTypes(): never {
  throw new Error(
    "getOccasionTypes() is retired. Use getOccasionTypeValues(handle) from @lib/data/taxonomy."
  )
}

export function loadConfiguredOccasions(): never {
  throw new Error(
    "loadConfiguredOccasions() is retired. Use getTaxonomy().occasions from @lib/data/taxonomy."
  )
}

export function loadConfiguredTypes(): never {
  throw new Error(
    "loadConfiguredTypes() is retired. Use getTaxonomy().types from @lib/data/taxonomy."
  )
}
