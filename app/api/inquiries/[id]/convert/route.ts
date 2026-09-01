import { NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api-auth"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params
    const supabase = await createClient()

    // Fetch the inquiry
    const { data: inquiry, error: fetchError } = await supabase
      .from("inquiries")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchError || !inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 })
    }

    if (inquiry.client_id) {
      // Already converted — just return the existing client
      return NextResponse.json({ clientId: inquiry.client_id, isNew: false })
    }

    // Find existing client by email or create a new one
    let clientId: string
    let isNew = false

    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("email", inquiry.email)
      .maybeSingle()

    if (existing) {
      clientId = existing.id
    } else {
      const { data: created, error: createError } = await supabase
        .from("clients")
        .insert({
          name: inquiry.name,
          email: inquiry.email,
          phone: inquiry.phone ?? null,
          notes: inquiry.message ? `Inquiry: ${inquiry.message}` : null,
        })
        .select("id")
        .single()

      if (createError || !created) {
        return NextResponse.json({ error: createError?.message ?? "Failed to create client" }, { status: 500 })
      }

      clientId = created.id
      isNew = true
    }

    // Link inquiry to client and mark converted
    await supabase
      .from("inquiries")
      .update({ client_id: clientId, status: "converted", updated_at: new Date().toISOString() })
      .eq("id", id)

    return NextResponse.json({ clientId, isNew })
  })
}
