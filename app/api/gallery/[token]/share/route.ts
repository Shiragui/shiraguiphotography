import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getGalleryByToken } from "@/lib/gallery"
import { makeDownloadCookieValue, downloadCookieName } from "@/lib/download-auth"
import { sendShareEmail } from "@/lib/email"

type Params = { params: Promise<{ token: string }> }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shiraguiphotography.com"

export async function POST(request: Request, { params }: Params) {
  const { token } = await params

  const gallery = await getGalleryByToken(token)
  if (!gallery || !gallery.gallery_enabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { email, includeDownloadCode } = await request.json()

  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  let downloadCode: string | null = null
  if (includeDownloadCode && gallery.download_code) {
    const cookieStore = await cookies()
    const dlCookie = cookieStore.get(downloadCookieName(token))?.value
    const expected = makeDownloadCookieValue(token, gallery.download_code)
    if (dlCookie !== expected) {
      return NextResponse.json({ error: "Not authorized to share download code" }, { status: 403 })
    }
    downloadCode = gallery.download_code
  }

  const galleryUrl = `${SITE_URL}/gallery/${token}`

  const result = await sendShareEmail({
    toEmail: email.trim(),
    galleryName: gallery.name,
    galleryUrl,
    downloadCode,
  })

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
