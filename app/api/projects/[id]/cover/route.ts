import { NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api-auth"
import { createServiceClient } from "@/lib/supabase/service"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params
    const { photo_id } = await request.json()

    const supabase = createServiceClient()

    // Verify the photo belongs to this project
    const { data: photo } = await supabase
      .from("gallery_photos")
      .select("id")
      .eq("id", photo_id)
      .eq("project_id", id)
      .maybeSingle()

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    const { error } = await supabase
      .from("projects")
      .update({ cover_photo_id: photo_id })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  })
}

export async function DELETE(_request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params
    const supabase = createServiceClient()

    const { error } = await supabase
      .from("projects")
      .update({ cover_photo_id: null })
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  })
}
