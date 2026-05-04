import { NextRequest, NextResponse } from "next/server"

// Serviceable pincode ranges — NCR + major metros
// In production, replace with delivery partner API (Shiprocket/Delhivery)
const SERVICEABLE_AREAS: Record<string, { city: string; area: string; sameDayAvailable: boolean; estimatedDays: number }> = {}

// NCR pincodes (201xxx = Ghaziabad/Noida, 110xxx = Delhi, 122xxx = Gurgaon)
const NCR_PREFIXES = ["201", "110", "122", "120", "121", "203", "250", "301"]
const METRO_PREFIXES = ["400", "500", "560", "600", "700"] // Mumbai, Hyderabad, Bangalore, Chennai, Kolkata

function getAreaInfo(pincode: string) {
  const prefix3 = pincode.slice(0, 3)

  if (NCR_PREFIXES.includes(prefix3)) {
    const cityMap: Record<string, string> = {
      "201": "Ghaziabad/Noida",
      "110": "Delhi",
      "122": "Gurgaon",
      "120": "Noida/Greater Noida",
      "121": "Faridabad",
      "203": "Bulandshahr",
      "250": "Meerut",
      "301": "Alwar",
    }
    return {
      available: true,
      city: cityMap[prefix3] || "NCR",
      area: "NCR Region",
      sameDayAvailable: ["201", "110", "122", "120"].includes(prefix3),
      estimatedDays: ["201", "110", "122", "120"].includes(prefix3) ? 0 : 1,
    }
  }

  if (METRO_PREFIXES.includes(prefix3)) {
    const cityMap: Record<string, string> = {
      "400": "Mumbai",
      "500": "Hyderabad",
      "560": "Bangalore",
      "600": "Chennai",
      "700": "Kolkata",
    }
    return {
      available: true,
      city: cityMap[prefix3] || "Metro City",
      area: "Metro",
      sameDayAvailable: false,
      estimatedDays: 2,
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  const pincode = request.nextUrl.searchParams.get("pincode")

  if (!pincode || !/^\d{6}$/.test(pincode)) {
    return NextResponse.json(
      { success: false, error: "Invalid pincode. Must be 6 digits." },
      { status: 400 }
    )
  }

  const areaInfo = getAreaInfo(pincode)

  if (!areaInfo) {
    return NextResponse.json({
      success: false,
      error: "Sorry, delivery is not available in your area yet. We're expanding soon!",
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      available: areaInfo.available,
      estimatedDays: areaInfo.estimatedDays,
      sameDayAvailable: areaInfo.sameDayAvailable,
      city: areaInfo.city,
      area: areaInfo.area,
    },
  })
}
