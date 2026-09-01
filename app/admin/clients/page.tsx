import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ClientsPage() {
  const profile = await getAdminProfile();
  if (!profile) redirect("/admin/login");

  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Clients</h1>
          <p style={{ color: "#6b7680" }}>Manage your photography clients.</p>
        </div>
        <Link href="/admin/clients/new" className="admin-button">
          New client
        </Link>
      </div>

      <section className="admin-card" style={{ padding: "1rem 0" }}>
        {clients && clients.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <Link href={`/admin/clients/${client.id}`} style={{ color: "#005987", fontWeight: 600 }}>
                      {client.name}
                    </Link>
                  </td>
                  <td>{client.email}</td>
                  <td>{client.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ padding: "0 1.5rem", color: "#6b7680" }}>No clients yet.</p>
        )}
      </section>
    </div>
  );
}
