import { NextResponse } from "next/server"
import { Pool } from "pg"

let pool: Pool | null = null

function getPool(): Pool {
  if (pool) return pool
  pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
  return pool
}

export async function GET() {
  try {
    const db = getPool()

    // First test: can we connect at all?
    const test = await db.query(`SELECT 1 as alive`)

    // Second test: does the schema exist?
    const schema = await db.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'ai_studio'`
    )

    // Third test: does the table exist?
    const table = await db.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'ai_studio' AND table_name = 'cake_designs'`
    )

    // Fourth test: count rows
    let count = null
    let sample = null
    let columns = null
    if (table.rows.length > 0) {
      const countResult = await db.query(`SELECT COUNT(*) as count FROM ai_studio.cake_designs`)
      count = countResult.rows[0]?.count

      const sampleResult = await db.query(`SELECT * FROM ai_studio.cake_designs LIMIT 1`)
      sample = sampleResult.rows[0] || null
      columns = sampleResult.fields.map((f) => f.name)
    }

    return NextResponse.json({
      connection: "ok",
      databaseUrl: process.env.DATABASE_URL ? "SET (hidden)" : "NOT SET",
      schemaExists: schema.rows.length > 0,
      tableExists: table.rows.length > 0,
      rowCount: count,
      columns,
      sample,
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error?.message || "Unknown error",
      code: error?.code || null,
      detail: error?.detail || null,
      stack: error?.stack?.split("\n").slice(0, 3) || null,
    })
  }
}
