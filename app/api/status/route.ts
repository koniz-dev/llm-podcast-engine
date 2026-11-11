import { NextResponse } from "next/server"
import { getPublicConfigStatus } from "@/lib/server/config"

export const dynamic = "force-dynamic"

export async function GET() {
  return NextResponse.json(getPublicConfigStatus(), {
    headers: { "Cache-Control": "no-store" },
  })
}
