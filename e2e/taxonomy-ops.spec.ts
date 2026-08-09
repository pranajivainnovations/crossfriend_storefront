import { test, expect, Page } from "@playwright/test"
import { Client } from "pg"
import fs from "fs"

/**
 * Drives the real OPS Taxonomy UI in a browser.
 *
 * The server actions are exercised by clicking the actual buttons rather than by POSTing a
 * hand-built request: Next's bound-action wire format is an internal detail, so a hand-built
 * request would test my guess at that format rather than the page.
 *
 * Every test mutates shared taxonomy rows, so the whole taxonomy is snapshotted before the run and
 * restored after it — including after a mid-test failure. An earlier version cleaned up only on the
 * happy path, and two aborted runs left a stray pairing and a stray occasion behind that then broke
 * the next run's assumptions.
 */

const OPS = "http://localhost:4000"
const API = "http://localhost:9000"
const dbUrl = fs
  .readFileSync("D:/apps/Backend/Backend/.env", "utf8")
  .match(/DATABASE_URL=(.*)/)![1]
  .trim()

let db: Client
let snapshot: {
  types: Array<{ type_id: string; label: string; emoji: string | null; display_order: number; is_active: boolean }>
  occasions: Array<{ collection_id: string; label: string; tagline: string | null; emoji: string | null; gradient: string | null; display_order: number; is_active: boolean }>
  matrix: Array<{ collection_id: string; type_id: string; display_order: number }>
}

test.beforeAll(async () => {
  db = new Client({ connectionString: dbUrl })
  await db.connect()

  snapshot = {
    types: (await db.query(`SELECT type_id, label, emoji, display_order, is_active FROM crossfriend.product_types`)).rows,
    occasions: (await db.query(`SELECT collection_id, label, tagline, emoji, gradient, display_order, is_active FROM crossfriend.occasions`)).rows,
    matrix: (await db.query(`SELECT collection_id, type_id, display_order FROM crossfriend.occasion_product_types`)).rows,
  }
})

test.afterAll(async () => {
  // Restore exactly what was there, then drop anything the tests created.
  await db.query(`DELETE FROM crossfriend.occasion_product_types`)
  await db.query(`DELETE FROM crossfriend.occasions`)
  await db.query(`DELETE FROM crossfriend.product_types`)

  for (const t of snapshot.types) {
    await db.query(
      `INSERT INTO crossfriend.product_types (type_id, label, emoji, display_order, is_active)
       VALUES ($1,$2,$3,$4,$5)`,
      [t.type_id, t.label, t.emoji, t.display_order, t.is_active]
    )
  }
  for (const o of snapshot.occasions) {
    await db.query(
      `INSERT INTO crossfriend.occasions (collection_id, label, tagline, emoji, gradient, display_order, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [o.collection_id, o.label, o.tagline, o.emoji, o.gradient, o.display_order, o.is_active]
    )
  }
  for (const m of snapshot.matrix) {
    await db.query(
      `INSERT INTO crossfriend.occasion_product_types (collection_id, type_id, display_order)
       VALUES ($1,$2,$3)`,
      [m.collection_id, m.type_id, m.display_order]
    )
  }

  // Medusa rows the tests may have created (registry rows are already gone via the wipe above).
  await db.query(`DELETE FROM public.product_type WHERE value = 'bouquet'`)
  await db.query(`DELETE FROM public.product_collection WHERE handle = 'diwali'`)

  await db.end()
})

async function signIn(page: Page) {
  // Minted outside the spec: `jose` lives in the OPS app, not this one.
  const token = process.env.OPS_TOKEN
  if (!token) throw new Error("OPS_TOKEN not set — mint one before running this config")

  await page.context().addCookies([
    { name: "ops_session", value: token, url: OPS, httpOnly: true, sameSite: "Lax" },
  ])
  await page.goto(`${OPS}/taxonomy`)
}

const pairCount = async (occasion: string, type: string) =>
  (
    await db.query(
      `SELECT count(*)::int n FROM crossfriend.occasion_product_types m
         JOIN public.product_collection pc ON pc.id = m.collection_id
         JOIN public.product_type pt ON pt.id = m.type_id
        WHERE pc.handle = $1 AND pt.value = $2`,
      [occasion, type]
    )
  ).rows[0].n

test.describe("OPS → Taxonomy", () => {
  test("adds a product type, creating both the Medusa row and the registry row", async ({ page }) => {
    await db.query(`DELETE FROM crossfriend.product_types WHERE type_id IN
                      (SELECT id FROM public.product_type WHERE value = 'bouquet')`)
    await db.query(`DELETE FROM public.product_type WHERE value = 'bouquet'`)

    await signIn(page)

    await page.getByPlaceholder("Machine value, e.g. bouquet").fill("Bouquet")
    await page.getByPlaceholder("Label, e.g. Bouquets").fill("Bouquets")
    await page.getByRole("button", { name: "+ Add type" }).click()

    await expect(page.getByRole("button", { name: "Retire Bouquets" })).toBeVisible()

    const medusa = await db.query(`SELECT id, value FROM public.product_type WHERE value = 'bouquet'`)
    expect(medusa.rowCount, "exactly one Medusa product_type created").toBe(1)
    expect(medusa.rows[0].value, '"Bouquet" slugified to a URL-safe value').toBe("bouquet")
    expect(medusa.rows[0].id, "deterministic id").toMatch(/^ptyp_cf_/)

    const registry = await db.query(
      `SELECT label, is_active FROM crossfriend.product_types WHERE type_id = $1`,
      [medusa.rows[0].id]
    )
    expect(registry.rows[0].label).toBe("Bouquets")
    expect(registry.rows[0].is_active).toBe(true)

    // A brand-new type must not appear on any occasion until someone deliberately pairs it.
    const pairings = await db.query(
      `SELECT count(*)::int n FROM crossfriend.occasion_product_types WHERE type_id = $1`,
      [medusa.rows[0].id]
    )
    expect(pairings.rows[0].n, "new type is on no occasion until paired").toBe(0)

    // …and it reaches the storefront with no deploy.
    const tax = await (await fetch(`${API}/store/crossfriend/taxonomy`)).json()
    expect(tax.types.some((t: { value: string }) => t.value === "bouquet")).toBe(true)
  })

  test("pairs and unpairs a type with an occasion from the grid", async ({ page }) => {
    // Start from a known-unpaired cell regardless of what earlier tests did.
    await db.query(`
      DELETE FROM crossfriend.occasion_product_types m
       USING public.product_collection pc, public.product_type pt
       WHERE pc.id = m.collection_id AND pt.id = m.type_id
         AND pc.handle = 'birthday' AND pt.value = 'toys'`)
    expect(await pairCount("birthday", "toys")).toBe(0)

    await signIn(page)

    await page.getByRole("button", { name: "Add Toys on Birthday" }).click()
    await expect(page.getByRole("button", { name: "Remove Toys on Birthday" })).toBeVisible()
    expect(await pairCount("birthday", "toys"), "pairing created").toBe(1)

    // The storefront preview must reflect it immediately — that is the point of showing it.
    // Scoped to the preview list: the handle also appears in the occasion registry row below.
    await expect(
      page.locator("li").filter({ hasText: "/occasions/birthday" })
    ).toContainText("Toys")

    await page.getByRole("button", { name: "Remove Toys on Birthday" }).click()
    await expect(page.getByRole("button", { name: "Add Toys on Birthday" })).toBeVisible()
    expect(await pairCount("birthday", "toys"), "unpairing removes it").toBe(0)
  })

  test("retiring a type keeps its pairings; bringing it back restores them", async ({ page }) => {
    await signIn(page)

    const before = (
      await db.query(`SELECT count(*)::int n FROM crossfriend.occasion_product_types m
                        JOIN public.product_type pt ON pt.id = m.type_id WHERE pt.value = 'costume'`)
    ).rows[0].n
    expect(before).toBeGreaterThan(0)

    await page.getByRole("button", { name: "Retire Costumes" }).click()
    await expect(page.getByRole("button", { name: "Bring back Costumes" })).toBeVisible()

    const kept = (
      await db.query(`SELECT count(*)::int n FROM crossfriend.occasion_product_types m
                        JOIN public.product_type pt ON pt.id = m.type_id WHERE pt.value = 'costume'`)
    ).rows[0].n
    expect(kept, "pairings survive retirement — bringing it back is lossless").toBe(before)

    // The storefront must stop offering it while it is retired.
    const off = await (await fetch(`${API}/store/crossfriend/taxonomy`)).json()
    expect(off.types.some((t: { value: string }) => t.value === "costume")).toBe(false)
    expect(
      Object.values(off.matrix as Record<string, string[]>).some((v) => v.includes("costume")),
      "retired type disappears from every occasion at once"
    ).toBe(false)

    await page.getByRole("button", { name: "Bring back Costumes" }).click()
    await expect(page.getByRole("button", { name: "Retire Costumes" })).toBeVisible()

    const on = await (await fetch(`${API}/store/crossfriend/taxonomy`)).json()
    expect(on.types.some((t: { value: string }) => t.value === "costume")).toBe(true)
    expect(on.matrix.festival).toContain("costume")
  })

  test("adds an occasion, creating the Medusa collection too", async ({ page }) => {
    await db.query(`DELETE FROM crossfriend.occasions WHERE collection_id IN
                      (SELECT id FROM public.product_collection WHERE handle = 'diwali')`)
    await db.query(`DELETE FROM public.product_collection WHERE handle = 'diwali'`)

    await signIn(page)

    await page.getByPlaceholder("URL, e.g. diwali").fill("Diwali")
    await page.getByPlaceholder("Label, e.g. Diwali").fill("Diwali")
    await page.getByPlaceholder("Tagline (optional)").fill("Light up the festival")
    await page.getByRole("button", { name: "+ Add occasion" }).click()

    await expect(page.getByRole("button", { name: "Retire Diwali" })).toBeVisible()

    const collection = await db.query(
      `SELECT id, title, metadata FROM public.product_collection
        WHERE handle = 'diwali' AND deleted_at IS NULL`
    )
    expect(collection.rowCount, "Medusa collection created").toBe(1)
    expect(collection.rows[0].metadata?.brand, "tagged as crossfriend").toBe("crossfriend")

    // A new occasion with no types warns rather than pretending the page works.
    await expect(page.getByText("no sections — page will be empty")).toBeVisible()
  })
})
