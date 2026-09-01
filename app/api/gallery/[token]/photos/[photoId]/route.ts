import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { Readable } from "stream"
import { getGalleryByToken } from "@/lib/gallery"
import { createServiceClient } from "@/lib/supabase/service"
import { getFileStream } from "@/lib/drive"
import { makeDownloadCookieValue, downloadCookieName } from "@/lib/download-auth"

type Params = { params: Promise<{ token: string; photoId: string }> }

function detectContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase()
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg"
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  return "image/jpeg"
}

function nodeToWebStream(nodeStream: Readable): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(new Uint8Array(chunk)))
      nodeStream.on("end", () => controller.close())
      nodeStream.on("error", (err) => controller.error(err))
    },
  })
}

export async function GET(request: Request, { params }: Params) {
  const { token, photoId } = await params

  // 1. Verify gallery exists and is enabled
  const gallery = await getGalleryByToken(token)
  if (!gallery || !gallery.gallery_enabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const url = new URL(request.url)
  const isThumb = url.searchParams.get("size") === "thumb"
  const isDownload = url.searchParams.get("download") === "1"

  // 2. Verify download authorization when requested
  if (isDownload) {
    if (!gallery.download_code) {
      return NextResponse.json({ error: "Downloads not enabled" }, { status: 403 })
    }
    const cookieStore = await cookies()
    const dlCookie = cookieStore.get(downloadCookieName(token))?.value
    const expected = makeDownloadCookieValue(token, gallery.download_code)
    if (!dlCookie || dlCookie !== expected) {
      return NextResponse.json({ error: "Not authorized — enter download code first" }, { status: 403 })
    }
  }

  // 3. Fetch photo record — Drive file IDs are read server-side only
  const supabase = createServiceClient()
  const selectField = isThumb
    ? "thumbnail_drive_id, filename"
    : "google_drive_file_id, filename"

  const { data: photo, error } = await supabase
    .from("gallery_photos")
    .select(selectField)
    .eq("id", photoId)
    .eq("project_id", gallery.id)
    .maybeSingle()

  if (error || !photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const fileId = isThumb
    ? (photo as { thumbnail_drive_id: string | null; filename: string }).thumbnail_drive_id
    : (photo as { google_drive_file_id: string; filename: string }).google_drive_file_id

  if (!fileId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // 4. Stream from Drive
  const stream = await getFileStream(fileId)

  const contentType = isThumb ? "image/jpeg" : detectContentType(photo.filename)
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    "Cache-Control": isDownload
      ? "private, no-store"
      : isThumb
        ? "private, max-age=86400"
        : "private, max-age=3600",
  }

  if (isDownload) {
    const safeName = photo.filename.replace(/[^\w.\-]/g, "_")
    headers["Content-Disposition"] = `attachment; filename="${safeName}"`
  }

  return new NextResponse(nodeToWebStream(stream), { headers })
}
