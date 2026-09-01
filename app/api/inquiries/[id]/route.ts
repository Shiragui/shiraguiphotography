import { NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api-auth"
import { createClient } from "@/lib/supabase/server"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params
    const body = await request.json()
    const supabase = await createClient()

    const { error } = await supabase
      .from("inquiries")
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  })
}
