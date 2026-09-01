import { NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api-auth"
import { createClient } from "@/lib/supabase/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  return withAdminAuth(async () => {
    const body = await request.json()
    const { to_email, subject, message, inquiry_id, client_id, project_id } = body

    if (!to_email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "To, subject, and message are required" }, { status: 400 })
    }

    // Send via Resend
    const { error: sendError } = await resend.emails.send({
      from: process.env.RESEND_FROM!,
      replyTo: process.env.RESEND_REPLY_TO,
      to: to_email.trim(),
      subject: subject.trim(),
      text: message.trim(),
      html: `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.7;color:#1a1a1a;max-width:560px;">${message.trim().replace(/\n/g, "<br>")}<br><br><hr style="border:none;border-top:1px solid #eee;margin:24px 0"><p style="font-size:12px;color:#888;">Shira Gui Photography</p></div>`,
    })

    if (sendError) {
      return NextResponse.json({ error: sendError.message }, { status: 500 })
    }

    // Store in database
    const supabase = await createClient()
    const { data, error: dbError } = await supabase
      .from("client_emails")
      .insert({
        to_email: to_email.trim(),
        subject: subject.trim(),
        body: message.trim(),
        inquiry_id: inquiry_id ?? null,
        client_id: client_id ?? null,
        project_id: project_id ?? null,
      })
      .select("id, sent_at")
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, email: data }, { status: 201 })
  })
}
