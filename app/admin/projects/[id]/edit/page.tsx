import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateGalleryToken, generateDownloadCode } from "@/lib/gallery";
import { ProjectForm } from "@/components/admin/ProjectForm";
import { DeleteProjectButton } from "@/components/admin/DeleteProjectButton";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { ContractManager } from "@/components/admin/ContractManager";
import type { ContractData } from "@/components/admin/ContractManager";

type Params = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Params) {
  const profile = await getAdminProfile();
  if (!profile) redirect("/admin/login");

  const { id } = await params;
  const supabase = await createClient();

  const serviceClient = createServiceClient();

  const [{ data: project }, { data: clients }, { data: contractRow }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, gallery_token, gallery_enabled, clients(name, email)")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("clients").select("id, name").order("name"),
    serviceClient
      .from("contracts")
      .select("id, status, signer_name, signed_at, sign_token, photo_release, pdf_drive_id")
      .eq("project_id", id)
      .maybeSingle(),
  ]);

  if (!project || !clients) notFound();

  // Auto-generate gallery token and download code for older projects
  let galleryToken = project.gallery_token as string | null
  let downloadCode = project.download_code as string | null
  const updates: Record<string, string | boolean> = {}
  if (!galleryToken) { galleryToken = generateGalleryToken(); updates.gallery_token = galleryToken; updates.gallery_enabled = true }
  if (!downloadCode) { downloadCode = generateDownloadCode(); updates.download_code = downloadCode }
  if (Object.keys(updates).length > 0) {
    await supabase.from("projects").update(updates).eq("id", id)
  }

  const linkedClient = Array.isArray(project.clients) ? project.clients[0] : project.clients

  const initialContract: ContractData | null = contractRow
    ? {
        id: contractRow.id,
        status: contractRow.status as ContractData["status"],
        signer_name: contractRow.signer_name ?? null,
        signed_at: contractRow.signed_at ?? null,
        sign_token: contractRow.sign_token,
        photo_release: contractRow.photo_release ?? null,
        pdf_drive_id: contractRow.pdf_drive_id ?? null,
      }
    : null

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 640 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <Link href="/admin/projects" style={{ color: "#005987" }}>
            ← Back to projects
          </Link>
          <h1 style={{ marginBottom: 0 }}>Edit project</h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
          <Link
            href={`/admin/projects/${project.id}/photos`}
            className="admin-button admin-button-secondary"
          >
            Manage photos →
          </Link>
          <DeleteProjectButton projectId={project.id} />
        </div>
      </div>
      <ProjectForm
        clients={clients}
        projectId={project.id}
        initial={{
          client_id: project.client_id,
          name: project.name,
          project_type: project.project_type,
          session_date: project.session_date,
          notes: project.notes,
        }}
      />
      <div className="admin-card" style={{ padding: "1.5rem" }}>
        <h2 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.1rem" }}>Gallery</h2>
        <GalleryManager
          projectId={project.id}
          galleryToken={galleryToken}
          initialDownloadCode={downloadCode}
          clientEmail={linkedClient?.email ?? null}
        />
      </div>
      <div className="admin-card" style={{ padding: "1.5rem" }}>
        <h2 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "1.1rem" }}>Contract</h2>
        <ContractManager
          projectId={project.id}
          clientEmail={linkedClient?.email ?? null}
          initialContract={initialContract}
        />
      </div>
    </div>
  );
}
