import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatProjectStatus } from "@/lib/types";

export default async function ProjectsPage() {
  const profile = await getAdminProfile();
  if (!profile) redirect("/admin/login");

  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*, clients(id, name, email)")
    .order("created_at", { ascending: false });

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Projects</h1>
          <p style={{ color: "#6b7680" }}>Track each client session from inquiry to delivery.</p>
        </div>
        <Link href="/admin/projects/new" className="admin-button">
          New project
        </Link>
      </div>

      <section className="admin-card" style={{ padding: "1rem 0" }}>
        {projects && projects.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th>Type</th>
                <th>Session date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td>
                    <Link
                      href={`/admin/projects/${project.id}/edit`}
                      style={{ color: "#005987", fontWeight: 600 }}
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td>
                    {project.clients ? (
                      <Link href={`/admin/clients/${project.clients.id}`} style={{ color: "#39454b" }}>
                        {project.clients.name}
                      </Link>
                    ) : (
                      "—"
                    )}
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
          <p style={{ padding: "0 1.5rem", color: "#6b7680" }}>No projects yet.</p>
        )}
      </section>
    </div>
  );
}
