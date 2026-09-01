import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatProjectStatus } from "@/lib/types";
import { DeleteClientButton } from "@/components/admin/DeleteClientButton";

type Params = { params: Promise<{ id: string }> };

export default async function ClientDetailPage({ params }: Params) {
  const profile = await getAdminProfile();
  if (!profile) redirect("/admin/login");

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: projects }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase.from("projects").select("*").eq("client_id", id).order("created_at", { ascending: false }),
  ]);

  if (!client) notFound();

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <Link href="/admin/clients" style={{ color: "#005987" }}>
            ← Back to clients
          </Link>
          <h1 style={{ marginBottom: 0 }}>{client.name}</h1>
          <p style={{ color: "#6b7680", marginTop: "0.35rem" }}>
            {client.email}
            {client.phone ? ` · ${client.phone}` : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href={`/admin/clients/${client.id}/edit`} className="admin-button admin-button-secondary">
            Edit client
          </Link>
          <Link href={`/admin/projects/new?client=${client.id}`} className="admin-button">
            New project
          </Link>
          <DeleteClientButton clientId={client.id} />
        </div>
      </div>

      {client.notes ? (
        <section className="admin-card" style={{ padding: "1.25rem" }}>
          <h2 style={{ marginTop: 0 }}>Notes</h2>
          <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{client.notes}</p>
        </section>
      ) : null}

      <section className="admin-card" style={{ padding: "1rem 0" }}>
        <h2 style={{ padding: "0 1.5rem" }}>Projects</h2>
        {projects && projects.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Type</th>
                <th>Session date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <Link href={`/admin/projects/${project.id}/edit`} style={{ color: "#005987", fontWeight: 600 }}>
                      {project.name}
                    </Link>
                  </td>
                  <td>{project.project_type || "—"}</td>
                  <td>{formatDate(project.session_date)}</td>
                  <td>
                    <span className="status-pill">{formatProjectStatus(project.status)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ padding: "0 1.5rem", color: "#6b7680" }}>No projects yet for this client.</p>
        )}
      </section>
    </div>
  );
}
