import { NextResponse } from "next/server"
import { getOccasions } from "@lib/data/dynamic"

export const revalidate = 300

export async function GET() {
  const occasions = await getOccasions()
  return NextResponse.json({ occasions })
}
