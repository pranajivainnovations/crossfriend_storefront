import { NextResponse } from "next/server"
import type { BakerProfile } from "@modules/ai-cake-studio/types"
// In production this query will hit the Medusa baker-profiles collection
// or a dedicated baker service filtered by pincode/service area.

const SAMPLE_BAKERS: BakerProfile[] = [
  {
    id: "baker-1",
    name: "Sweety's Cakes",
    avatar: "👩‍🍳",
    rating: 4.8,
    reviewCount: 127,
    specialty: "Custom Designer Cakes",
    minPrice: 800,
    deliveryRadius: "8 km",
    distance: "2.3 km",
    turnaround: "48 hrs",
    verified: true,
    whatsapp: "9876543210",
  },
  {
    id: "baker-2",
    name: "The Bake House",
    avatar: "🏪",
    rating: 4.6,
    reviewCount: 89,
    specialty: "Fondant & Luxury Cakes",
    minPrice: 1200,
    deliveryRadius: "10 km",
    distance: "4.1 km",
    turnaround: "3 days",
    verified: true,
  },
  {
    id: "baker-3",
    name: "Priya's Patisserie",
    avatar: "🎂",
    rating: 4.9,
    reviewCount: 203,
    specialty: "Wedding & Tiered Cakes",
    minPrice: 2500,
    deliveryRadius: "15 km",
    distance: "5.8 km",
    turnaround: "5 days",
    verified: true,
    whatsapp: "9123456789",
  },
  {
    id: "baker-4",
    name: "Cake Wala",
    avatar: "🧁",
    rating: 4.3,
    reviewCount: 45,
    specialty: "Budget-friendly Designs",
    minPrice: 600,
    deliveryRadius: "5 km",
    distance: "1.2 km",
    turnaround: "24 hrs",
    verified: false,
  },
  {
    id: "baker-5",
    name: "Sugar & Spice Studio",
    avatar: "🍰",
    rating: 4.7,
    reviewCount: 61,
    specialty: "Kids & Theme Cakes",
    minPrice: 950,
    deliveryRadius: "7 km",
    distance: "3.5 km",
    turnaround: "48 hrs",
    verified: true,
    whatsapp: "9012345678",
  },
]

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pincode = (searchParams.get("pincode") ?? "").trim()

  if (!/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { error: "Please enter a valid 6-digit pincode" },
      { status: 400 }
    )
  }

  // TODO: Replace with real query:
  //   const bakers = await medusaClient.custom.get(`/baker-profiles?pincode=${pincode}`)
  // For now, return sample data with a slight distance variation seeded by pincode.
  const seed = parseInt(pincode.slice(-2), 10) / 100
  const bakers = SAMPLE_BAKERS.map((b) => ({
    ...b,
    distance: `${(parseFloat(b.distance) + seed).toFixed(1)} km`,
  }))

  return NextResponse.json({ bakers, pincode })
}
