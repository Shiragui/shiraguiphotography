import { NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api-auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  return withAdminAuth(async () => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ inquiries: data })
  })
}

export async function POST(request: Request) {
  return withAdminAuth(async () => {
    const body = await request.json()
    const supabase = await createClient()

    if (!body.name?.trim() || !body.email?.trim()) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("inquiries")
      .insert({
        source: "manual",
        name: body.name.trim(),
        email: body.email.trim(),
        phone: body.phone?.trim() || null,
        location: body.location?.trim() || null,
        message: body.message?.trim() || null,
        how_found: body.how_found?.trim() || null,
        status: "new",
      })
      .select("id")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ id: data.id }, { status: 201 })
  })
}
