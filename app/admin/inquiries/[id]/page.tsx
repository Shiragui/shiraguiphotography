import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getAdminProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/types"
import { InquiryActions } from "@/components/admin/InquiryActions"
import { EmailThread } from "@/components/admin/EmailThread"

type Params = { params: Promise<{ id: string }> }

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div>
      <p style={{ margin: "0 0 2px", fontSize: "0.75rem", color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: "0.95rem", color: "#111827", whiteSpace: "pre-wrap" }}>{value}</p>
    </div>
  )
}

export default async function InquiryDetailPage({ params }: Params) {
  const profile = await getAdminProfile()
  if (!profile) redirect("/admin/login")

  const { id } = await params
  const supabase = await createClient()

  const [{ data: inquiry }, { data: emails }] = await Promise.all([
    supabase
      .from("inquiries")
      .select("*, clients(id, name)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("client_emails")
      .select("id, subject, body, to_email, sent_at")
      .eq("inquiry_id", id)
      .order("sent_at", { ascending: false }),
  ])

  if (!inquiry) notFound()

  const client = Array.isArray(inquiry.clients) ? inquiry.clients[0] : inquiry.clients

  const statusColor: Record<string, string> = {
    new: "#065f46",
    converted: "#1e40af",
    archived: "#6b7280",
  }

  const defaultSubject = `Re: Your photography inquiry`

  return (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: 680 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <Link href="/admin/inquiries" style={{ color: "#005987", fontSize: "0.9rem" }}>
            ← Back to inquiries
          </Link>
          <h1 style={{ margin: "0.25rem 0 0" }}>{inquiry.name}</h1>
        </div>
        <span style={{
          display: "inline-block",
          padding: "0.25rem 0.75rem",
          borderRadius: 99,
          fontSize: "0.8rem",
          fontWeight: 600,
          background: "#f3f4f6",
          color: statusColor[inquiry.status] ?? "#374151",
          letterSpacing: "0.04em",
        }}>
          {inquiry.status}
        </span>
      </div>

      {/* Main details */}
      <div className="admin-card" style={{ padding: "1.5rem", display: "grid", gap: "1.1rem" }}>
        <Field label="Email" value={inquiry.email} />
        <Field label="Phone" value={inquiry.phone} />
        <Field label="Location" value={inquiry.location} />
        <Field label="Message" value={inquiry.message} />
        <Field label="How they found you" value={[inquiry.how_found, inquiry.how_found_detail].filter(Boolean).join(" — ")} />
        <div style={{ borderTop: "1px solid #e5e6e7", paddingTop: "0.75rem" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>
            Received {formatDate(inquiry.created_at)}
            {client && (
              <> · Linked to <Link href={`/admin/clients/${client.id}`} style={{ color: "#005987" }}>{client.name}</Link></>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="admin-card" style={{ padding: "1.5rem" }}>
        <InquiryActions
          inquiryId={inquiry.id}
          status={inquiry.status}
          clientId={inquiry.client_id ?? null}
        />
      </div>

      {/* Email thread */}
      <div className="admin-card" style={{ padding: "1.5rem" }}>
        <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600, color: "#374151" }}>Email</h2>
        <EmailThread
          toEmail={inquiry.email}
          defaultSubject={defaultSubject}
          inquiryId={inquiry.id}
          clientId={inquiry.client_id ?? undefined}
          initialEmails={emails ?? []}
        />
      </div>
    </div>
  )
}
