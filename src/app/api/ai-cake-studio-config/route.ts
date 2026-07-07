import fs from "fs"
import path from "path"
import { NextResponse } from "next/server"

const CONFIG_PATH = path.join(
  process.cwd(),
  "src/modules/ai-cake-studio/config/ai-cake-studio-config.json"
)

export async function GET() {
  try {
    const raw = await fs.promises.readFile(CONFIG_PATH, "utf-8")
    const config = JSON.parse(raw)
    return NextResponse.json(config)
  } catch (error) {
    console.error("[AiCakeStudio] Failed to read config", error)
    return NextResponse.json({ error: "Failed to load AI cake studio config" }, { status: 500 })
  }
}
