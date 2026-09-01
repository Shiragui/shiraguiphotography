import { NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api-auth"
import { createServiceClient } from "@/lib/supabase/service"
import { sendGalleryEmail } from "@/lib/email"

type Params = { params: Promise<{ id: string }> }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shiraguiphotography.com"

export async function POST(request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params
    const body = await request.json()
    const emails: string[] = (body.emails ?? [])
      .map((e: string) => e.trim())
      .filter(Boolean)
    const includeDownloadCode: boolean = body.includeDownloadCode !== false

    if (emails.length === 0) {
      return NextResponse.json({ error: "At least one email address is required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: project, error } = await supabase
      .from("projects")
      .select("id, name, gallery_token, gallery_enabled, download_code, cover_photo_id, clients(name)")
      .eq("id", id)
      .maybeSingle()

    if (error || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    if (!project.gallery_enabled || !project.gallery_token) {
      return NextResponse.json({ error: "Gallery is not enabled" }, { status: 400 })
    }

    const client = Array.isArray(project.clients) ? project.clients[0] : project.clients
    const galleryUrl = `${SITE_URL}/gallery/${project.gallery_token}`

    const coverImageUrl = project.cover_photo_id
      ? `${SITE_URL}/api/gallery/${project.gallery_token}/photos/${project.cover_photo_id}?size=thumb`
      : null

    const result = await sendGalleryEmail({
      clientName: client?.name ?? "there",
      emails,
      projectName: project.name,
      galleryUrl,
      coverImageUrl,
      downloadCode: includeDownloadCode ? (project.download_code ?? null) : null,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, sentTo: emails })
  })
}
