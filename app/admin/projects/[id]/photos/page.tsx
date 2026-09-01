import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getAdminProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { PhotoUploadForm } from "@/components/admin/PhotoUploadForm"

type Params = { params: Promise<{ id: string }> }

export default async function ProjectPhotosPage({ params }: Params) {
  const profile = await getAdminProfile()
  if (!profile) redirect("/admin/login")

  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, gallery_token, cover_photo_id")
    .eq("id", id)
    .maybeSingle()

  if (!project) notFound()

  const { data: photos } = await supabase
    .from("gallery_photos")
    .select("id, filename, sort_order, created_at")
    .eq("project_id", id)
    .order("sort_order", { ascending: true })

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 900 }}>
      <div>
        <Link href={`/admin/projects/${project.id}/edit`} style={{ color: "#005987" }}>
          ← Back to edit project
        </Link>
        <h1 style={{ marginBottom: 0 }}>Photos — {project.name}</h1>
      </div>
      <PhotoUploadForm
        projectId={project.id}
        initialPhotos={photos ?? []}
        galleryToken={project.gallery_token ?? null}
        initialCoverPhotoId={project.cover_photo_id ?? null}
      />
    </div>
  )
}
