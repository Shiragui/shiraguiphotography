import { NextResponse } from "next/server"
import { getGalleryByToken } from "@/lib/gallery"
import { makeDownloadCookieValue, downloadCookieName } from "@/lib/download-auth"

type Params = { params: Promise<{ token: string }> }

export async function POST(request: Request, { params }: Params) {
  const { token } = await params

  const gallery = await getGalleryByToken(token)
  if (!gallery || !gallery.gallery_enabled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!gallery.download_code) {
    return NextResponse.json({ error: "Downloads not available" }, { status: 400 })
  }

  const body = await request.json()
  const code: string = body.code ?? ""

  if (code.trim().toLowerCase() !== gallery.download_code.trim().toLowerCase()) {
    return NextResponse.json({ error: "Incorrect code" }, { status: 401 })
  }

  const cookieValue = makeDownloadCookieValue(token, gallery.download_code)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(downloadCookieName(token), cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
  return response
}
