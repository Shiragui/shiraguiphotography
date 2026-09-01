import Link from "next/link"
import { redirect } from "next/navigation"
import { getAdminProfile } from "@/lib/auth"
import { NewInquiryForm } from "@/components/admin/NewInquiryForm"

export default async function NewInquiryPage() {
  const profile = await getAdminProfile()
  if (!profile) redirect("/admin/login")

  return (
    <div style={{ display: "grid", gap: "1.5rem", maxWidth: 640 }}>
      <div>
        <Link href="/admin/inquiries" style={{ color: "#005987", fontSize: "0.9rem" }}>
          ← Back to inquiries
        </Link>
        <h1 style={{ margin: "0.25rem 0 0" }}>New inquiry</h1>
        <p style={{ margin: "0.25rem 0 0", color: "#6b7680", fontSize: "0.9rem" }}>
          Manually enter details from a Formspree email.
        </p>
      </div>
      <NewInquiryForm />
    </div>
  )
}
