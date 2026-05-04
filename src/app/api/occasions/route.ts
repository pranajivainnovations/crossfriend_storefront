import { NextResponse } from "next/server"
import { getOccasions } from "@lib/data/dynamic"

export const dynamic = "force-dynamic"

export async function GET() {
  const occasions = await getOccasions()
  return NextResponse.json({ occasions })
}
