import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "@/components/admin/ProjectForm";

type SearchParams = { searchParams: Promise<{ client?: string }> };

export default async function NewProjectPage({ searchParams }: SearchParams) {
  const profile = await getAdminProfile();
  if (!profile) redirect("/admin/login");

  const { client: defaultClientId } = await searchParams;
  const supabase = await createClient();
  const { data: clients } = await supabase.from("clients").select("id, name").order("name");

  if (!clients || clients.length === 0) {
    return (
      <div className="admin-card" style={{ padding: "1.5rem" }}>
        <h1 style={{ marginTop: 0 }}>New project</h1>
        <p style={{ color: "#6b7680" }}>Create a client first before adding a project.</p>
        <Link href="/admin/clients/new" className="admin-button">
          Create client
        </Link>
      </div>
    );
  }

  const selectedClient = defaultClientId && clients.some((c) => c.id === defaultClientId)
    ? defaultClientId
    : clients[0].id;

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 640 }}>
      <div>
        <Link href="/admin/projects" style={{ color: "#005987" }}>
          ← Back to projects
        </Link>
        <h1 style={{ marginBottom: 0 }}>New project</h1>
      </div>
      <ProjectForm
        clients={clients}
        initial={{ client_id: selectedClient, name: "" }}
        submitLabel="Create project"
      />
    </div>
  );
}
