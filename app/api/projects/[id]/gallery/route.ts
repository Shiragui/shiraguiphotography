import { NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api-auth"
import { createServiceClient } from "@/lib/supabase/service"
import { generateGalleryToken } from "@/lib/gallery"

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params
    const supabase = createServiceClient()

    // Verify project exists and get current token
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id, gallery_token")
      .eq("id", id)
      .maybeSingle()

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Generate a token only if one doesn't already exist
    const token = project.gallery_token ?? generateGalleryToken()

    const { error: updateError } = await supabase
      .from("projects")
      .update({ gallery_token: token, gallery_enabled: true })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ gallery_token: token, gallery_enabled: true })
  })
}

export async function PATCH(request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params
    const body = await request.json()
    const downloadCode: string | null = body.download_code ?? null

    const supabase = createServiceClient()

    const { error } = await supabase
      .from("projects")
      .update({ download_code: downloadCode })
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

    // Verify project exists
    const { data: project, error: fetchError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Disable gallery but preserve the token so the URL works if re-enabled
    const { error: updateError } = await supabase
      .from("projects")
      .update({ gallery_enabled: false })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ gallery_enabled: false })
  })
}
