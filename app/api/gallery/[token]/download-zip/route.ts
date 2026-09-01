import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { Readable } from "stream"
import { ZipArchive } from "archiver"
import { getGalleryByToken } from "@/lib/gallery"
import { createServiceClient } from "@/lib/supabase/service"
import { getFileStream } from "@/lib/drive"
import { makeDownloadCookieValue, downloadCookieName } from "@/lib/download-auth"

type Params = { params: Promise<{ token: string }> }

export async function GET(request: Request, { params }: Params) {
  const { token } = await params

  const gallery = await getGalleryByToken(token)
  if (!gallery || !gallery.gallery_enabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!gallery.download_code) {
    return NextResponse.json({ error: "Downloads not enabled" }, { status: 403 })
  }

  // Verify download cookie
  const cookieStore = await cookies()
  const dlCookie = cookieStore.get(downloadCookieName(token))?.value
  const expected = makeDownloadCookieValue(token, gallery.download_code)
  if (!dlCookie || dlCookie !== expected) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  // Determine which photos to include
  const url = new URL(request.url)
  const idsParam = url.searchParams.get("ids")
  const photoIds = idsParam ? idsParam.split(",").filter(Boolean) : null

  const supabase = createServiceClient()

  let query = supabase
    .from("gallery_photos")
    .select("id, filename, google_drive_file_id")
    .eq("project_id", gallery.id)
    .order("sort_order", { ascending: true })

  if (photoIds) {
    query = query.in("id", photoIds)
  }

  const { data: photos, error } = await query

  if (error || !photos || photos.length === 0) {
    return NextResponse.json({ error: "No photos found" }, { status: 404 })
  }

  // Stream a zip back to the client
  const archive = new ZipArchive({ zlib: { level: 5 } })

  // Add each photo to the archive
  ;(async () => {
    for (const photo of photos) {
      try {
        const stream = await getFileStream(photo.google_drive_file_id)
        archive.append(stream, { name: photo.filename })
      } catch {
        // Skip photos that fail to fetch
      }
    }
    archive.finalize()
  })()

  const folderName = gallery.name.replace(/[^\w\s-]/g, "").trim() || "gallery"
  const filename = `${folderName}.zip`

  return new NextResponse(Readable.toWeb(archive) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  })
}
