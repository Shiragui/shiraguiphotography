import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const profile = await getAdminProfile();
  if (!profile) redirect("/admin/login");

  const supabase = await createClient();

  const [{ count: clientCount }, { count: projectCount }, { count: inquiryCount }, { data: recentClients }] =
    await Promise.all([
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("inquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("clients").select("id, name, email, created_at").order("created_at", { ascending: false }).limit(5),
    ]);

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "2.25rem" }}>Dashboard</h1>
        <p style={{ color: "#6b7680" }}>Welcome back. Manage clients, projects, and inquiries in one place.</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
        }}
      >
        <StatCard label="Clients" value={clientCount ?? 0} href="/admin/clients" />
        <StatCard label="Projects" value={projectCount ?? 0} href="/admin/projects" />
        <StatCard label="New inquiries" value={inquiryCount ?? 0} href="/admin/inquiries" />
      </div>

      <section className="admin-card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <h2 style={{ marginTop: 0 }}>Recent clients</h2>
          <Link href="/admin/clients/new" className="admin-button">
            New client
          </Link>
        </div>
        {recentClients && recentClients.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {recentClients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <Link href={`/admin/clients/${client.id}`} style={{ color: "#005987", fontWeight: 600 }}>
                      {client.name}
                    </Link>
                  </td>
                  <td>{client.email}</td>
                  <td>{new Date(client.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: "#6b7680" }}>No clients yet. Create your first client to get started.</p>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="admin-card" style={{ padding: "1.25rem", textDecoration: "none" }}>
      <div style={{ color: "#6b7680", fontSize: "0.9rem" }}>{label}</div>
      <div style={{ fontSize: "2rem", fontWeight: 900, color: "#005987" }}>{value}</div>
    </Link>
  );
}
