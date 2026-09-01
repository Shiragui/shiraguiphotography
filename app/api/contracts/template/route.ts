import { NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api-auth"
import { createServiceClient } from "@/lib/supabase/service"

export async function GET() {
  return withAdminAuth(async () => {
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("contract_templates")
      .select("*")
      .eq("is_default", true)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "No default template found" }, { status: 404 })
    }

    return NextResponse.json(data)
  })
}

export async function PATCH(request: Request) {
  return withAdminAuth(async () => {
    const supabase = createServiceClient()
    const body = await request.json()

    const updates: Record<string, string> = {}
    if (typeof body.body === "string") updates.body = body.body
    if (typeof body.name === "string") updates.name = body.name

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("contract_templates")
      .update(updates)
      .eq("is_default", true)
      .select()
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  })
}
