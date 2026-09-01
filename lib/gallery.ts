// Server-only — never import from "use client" files
import { randomBytes } from "crypto"
import { createServiceClient } from "@/lib/supabase/service"

export function generateGalleryToken(): string {
  return randomBytes(24).toString("base64url")
}

export function generateDownloadCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  const bytes = randomBytes(8)
  return Array.from(bytes, b => chars[b % chars.length]).join("")
}

export async function getGalleryByToken(token: string): Promise<{
  id: string
  name: string
  gallery_enabled: boolean
  download_code: string | null
  cover_photo_id: string | null
  session_date: string | null
} | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, gallery_enabled, download_code, cover_photo_id, session_date")
    .eq("gallery_token", token)
    .maybeSingle()

  if (error || !data) return null
  return data
}

export async function getGalleryPhotos(
  projectId: string
): Promise<Array<{ id: string; filename: string; sort_order: number }>> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("gallery_photos")
    .select("id, filename, sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })

  if (error || !data) return []
  return data
}
