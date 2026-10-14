import { NextResponse, after } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { sendInquiryNotification } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const name = body.name?.trim()
    const email = body.email?.trim()

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase.from("inquiries").insert({
      source: "contact_form",
      name,
      email,
      phone: body.phone?.trim() || null,
      location: body.location?.trim() || null,
      message: body.message?.trim() || null,
      how_found: body.how_found?.trim() || null,
      how_found_detail: body.how_found_detail?.trim() || null,
      status: "new",
    })

    if (error) {
      return NextResponse.json({ error: "Failed to save" }, { status: 500 })
    }

    // Notify photographer — runs after the response is sent, but `after()`
    // keeps the serverless function alive until it finishes instead of
    // letting the platform freeze/kill it mid-request.
    after(() =>
      sendInquiryNotification({ name, email, phone: body.phone, location: body.location, message: body.message, howFound: body.how_found }).catch((err) => {
        console.error("Failed to send inquiry notification email:", err)
      })
    )

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
