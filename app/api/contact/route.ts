import { NextResponse } from "next/server"
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

    // Notify photographer — fire and forget
    sendInquiryNotification({ name, email, phone: body.phone, location: body.location, message: body.message, howFound: body.how_found }).catch(() => {})

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
