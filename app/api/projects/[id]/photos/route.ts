import { NextResponse } from "next/server"
import { Readable } from "stream"
import sharp from "sharp"
import { withAdminAuth } from "@/lib/api-auth"
import { createClient } from "@/lib/supabase/server"
import {
  getOrCreateProjectFolder,
  uploadFileToDrive,
  deleteFile,
} from "@/lib/drive"

type Params = { params: Promise<{ id: string }> }

const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"])
const MAX_BYTES = 50 * 1024 * 1024 // 50 MB

export async function POST(request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params
    const supabase = await createClient()

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, drive_folder_id")
      .eq("id", id)
      .maybeSingle()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // File is sent as raw binary body; filename and type come from headers/params
    const url = new URL(request.url)
    const filename = url.searchParams.get("filename") || "photo.jpg"
    const mimeType = request.headers.get("content-type") || "image/jpeg"

    if (!ALLOWED_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await request.arrayBuffer())

    if (buffer.byteLength > MAX_BYTES) {
      return NextResponse.json({ error: "File exceeds 50 MB limit" }, { status: 400 })
    }

    // Get or create Drive folder, persist if newly created
    let folderId = project.drive_folder_id as string | null
    if (!folderId) {
      folderId = await getOrCreateProjectFolder(project.id, project.name)
      await supabase
        .from("projects")
        .update({ drive_folder_id: folderId })
        .eq("id", id)
    }

    // Deduplicate: if a photo with the same filename already exists, delete it first
    const { data: existing } = await supabase
      .from("gallery_photos")
      .select("id, google_drive_file_id, thumbnail_drive_id")
      .eq("project_id", id)
      .eq("filename", filename)
      .maybeSingle()

    if (existing) {
      await supabase.from("gallery_photos").delete().eq("id", existing.id)
      try { await deleteFile(existing.google_drive_file_id) } catch { /* ignore */ }
      if (existing.thumbnail_drive_id) {
        try { await deleteFile(existing.thumbnail_drive_id) } catch { /* ignore */ }
      }
    }

    // Step 4: Upload original to Drive
    const driveFileId = await uploadFileToDrive(
      Readable.from(buffer),
      filename,
      mimeType,
      folderId
    )

    // Step 5: Generate thumbnail using Sharp
    let thumbBuffer: Buffer
    try {
      thumbBuffer = await sharp(buffer)
        .resize(800, undefined, { withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer()
    } catch {
      try { await deleteFile(driveFileId) } catch { /* ignore */ }
      return NextResponse.json({ error: "Thumbnail generation failed" }, { status: 500 })
    }

    // Step 6: Upload thumbnail to Drive
    let thumbnailDriveId: string
    try {
      thumbnailDriveId = await uploadFileToDrive(
        Readable.from(thumbBuffer),
        "thumb_" + filename,
        "image/jpeg",
        folderId
      )
    } catch {
      try { await deleteFile(driveFileId) } catch { /* ignore */ }
      return NextResponse.json({ error: "Thumbnail upload failed" }, { status: 500 })
    }

    // Determine next sort_order
    const { count } = await supabase
      .from("gallery_photos")
      .select("id", { count: "exact", head: true })
      .eq("project_id", id)

    const sortOrder = (count ?? 0)

    // Step 7: Insert DB record with both Drive file IDs
    // Note: Drive file IDs are stored server-side only and not exposed in
    // public API responses. This admin-only route returns the full DB record,
    // which is acceptable since it is protected by withAdminAuth.
    const { data: photo, error: insertError } = await supabase
      .from("gallery_photos")
      .insert({
        project_id: id,
        filename: filename,
        google_drive_file_id: driveFileId,
        thumbnail_drive_id: thumbnailDriveId,
        sort_order: sortOrder,
      })
      .select("id, project_id, filename, sort_order, created_at")
      .single()

    if (insertError || !photo) {
      // Best-effort cleanup of both Drive files
      try { await deleteFile(driveFileId) } catch { /* ignore */ }
      try { await deleteFile(thumbnailDriveId) } catch { /* ignore */ }
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to save photo" },
        { status: 500 }
      )
    }

    return NextResponse.json({ photo }, { status: 201 })
  })
}

export async function GET(_request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params
    const supabase = await createClient()

    const { data: photos, error } = await supabase
      .from("gallery_photos")
      .select("id, project_id, filename, sort_order, created_at")
      .eq("project_id", id)
      .order("sort_order", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ photos })
  })
}

export async function DELETE(request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const photoId = searchParams.get("photoId")

    if (!photoId) {
      return NextResponse.json({ error: "photoId is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch the record so we have the Drive file IDs
    const { data: photo, error: fetchError } = await supabase
      .from("gallery_photos")
      .select("id, google_drive_file_id, thumbnail_drive_id")
      .eq("id", photoId)
      .eq("project_id", id)
      .maybeSingle()

    if (fetchError || !photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 })
    }

    // Delete from DB first
    const { error: deleteError } = await supabase
      .from("gallery_photos")
      .delete()
      .eq("id", photoId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    // Best-effort Drive cleanup for both original and thumbnail
    try { await deleteFile(photo.google_drive_file_id) } catch { /* ignore */ }
    if (photo.thumbnail_drive_id) {
      try { await deleteFile(photo.thumbnail_drive_id) } catch { /* ignore */ }
    }

    return NextResponse.json({ ok: true })
  })
}
