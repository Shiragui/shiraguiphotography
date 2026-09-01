import { NextRequest, NextResponse } from "next/server"
import { getAdminProfile } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const profile = await getAdminProfile()
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await request.json()
  if (!code) return NextResponse.json({ error: "Code required" }, { status: 400 })

  const stored = request.cookies.get("sg_otp")?.value
  if (!stored || String(code).trim() !== stored) {
    return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })
  }

  const response = NextResponse.json({ ok: true })
  // Clear the OTP cookie
  response.cookies.set("sg_otp", "", { maxAge: 0, path: "/" })
  // Set the long-lived 2FA verified cookie
  response.cookies.set("sg_2fa", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: "/",
  })
  return response
}
