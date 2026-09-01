// Server-only — never import from "use client" files
import { createHmac } from "crypto"

export function makeDownloadCookieValue(galleryToken: string, downloadCode: string): string {
  return createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY!)
    .update(`${galleryToken}:${downloadCode}`)
    .digest("hex")
}

export function downloadCookieName(galleryToken: string): string {
  return `dl_${galleryToken}`
}
