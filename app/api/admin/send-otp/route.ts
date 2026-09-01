import { NextResponse } from "next/server"
import { randomInt } from "crypto"
import { getAdminProfile } from "@/lib/auth"
import { getResend } from "@/lib/email"

export async function POST() {
  const profile = await getAdminProfile()
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const otp = String(randomInt(100000, 999999))

  try {
    await getResend().emails.send({
      from: process.env.RESEND_FROM!,
      to: profile.email,
      subject: "Your admin verification code",
      text: `Your Shira Gui Photography admin code is: ${otp}\n\nExpires in 10 minutes.`,
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:40px auto;">
          <p style="color:#888;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">Shira Gui Photography</p>
          <h2 style="margin:0 0 16px;">Admin verification code</h2>
          <p style="font-size:36px;font-weight:700;letter-spacing:0.3em;color:#1a1a1a;margin:24px 0;">${otp}</p>
          <p style="color:#888;font-size:13px;">Expires in 10 minutes. If you didn't request this, ignore it.</p>
        </div>`,
    })
  } catch {
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set("sg_otp", otp, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  })
  return response
}
