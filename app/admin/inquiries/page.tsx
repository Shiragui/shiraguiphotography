import Link from "next/link"
import { redirect } from "next/navigation"
import { getAdminProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/types"


export default async function InquiriesPage() {
  const profile = await getAdminProfile()
  if (!profile) redirect("/admin/login")

  const supabase = await createClient()
  const { data: inquiries } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false })

  const newCount = inquiries?.filter(i => i.status === "new").length ?? 0

  const statusColor: Record<string, string> = {
    new: "#065f46",
    converted: "#1e40af",
    archived: "#6b7280",
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>Inquiries</h1>
          {newCount > 0 && (
            <p style={{ margin: "0.25rem 0 0", color: "#065f46", fontSize: "0.88rem", fontWeight: 500 }}>
              {newCount} new {newCount === 1 ? "inquiry" : "inquiries"} waiting
            </p>
          )}
        </div>
        <Link href="/admin/inquiries/new" className="admin-button">
          + New inquiry
        </Link>
      </div>

      <section className="admin-card" style={{ padding: "1rem 0" }}>
        {inquiries && inquiries.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Received</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id} style={{ cursor: "pointer" }}>
                  <td>
                    <Link
                      href={`/admin/inquiries/${inquiry.id}`}
                      style={{ color: "inherit", textDecoration: "none", fontWeight: inquiry.status === "new" ? 600 : 400 }}
                    >
                      {inquiry.name}
                    </Link>
                  </td>
                  <td style={{ color: "#6b7680" }}>{inquiry.email}</td>
                  <td>
                    <span style={{
                      display: "inline-block",
                      padding: "0.2rem 0.6rem",
                      borderRadius: 99,
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      background: "#f3f4f6",
                      color: statusColor[inquiry.status] ?? "#374151",
                    }}>
                      {inquiry.status}
                    </span>
                  </td>
                  <td style={{ color: "#6b7680" }}>{formatDate(inquiry.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: "1.5rem" }}>
            <p style={{ margin: "0 0 0.5rem", color: "#6b7680" }}>No inquiries yet.</p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
              When someone fills out your contact form, enter the details using the &ldquo;+ New inquiry&rdquo; button above.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
