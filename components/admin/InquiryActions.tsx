"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Props {
  inquiryId: string
  status: string
  clientId: string | null
}

export function InquiryActions({ inquiryId, status, clientId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<"convert" | "archive" | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function convert() {
    setLoading("convert")
    setError(null)
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}/convert`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to convert"); return }
      router.push(`/admin/projects/new?client=${data.clientId}`)
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  async function archive() {
    setLoading("archive")
    setError(null)
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      })
      if (!res.ok) { setError("Failed to archive"); return }
      router.refresh()
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  if (status === "converted" && clientId) {
    return (
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <Link href={`/admin/clients/${clientId}`} className="admin-button">
          View client →
        </Link>
        <Link href={`/admin/projects/new?client=${clientId}`} className="admin-button admin-button-secondary">
          New project
        </Link>
      </div>
    )
  }

  if (status === "archived") {
    return <p style={{ margin: 0, color: "#6b7680", fontSize: "0.88rem" }}>This inquiry has been archived.</p>
  }

  return (
    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
      <button
        type="button"
        onClick={convert}
        disabled={loading !== null}
        className="admin-button"
      >
        {loading === "convert" ? "Converting…" : "Convert to client"}
      </button>
      <button
        type="button"
        onClick={archive}
        disabled={loading !== null}
        style={{ background: "none", border: "none", color: "#9ca3af", fontSize: "0.88rem", cursor: "pointer", padding: 0 }}
      >
        {loading === "archive" ? "Archiving…" : "Archive"}
      </button>
      {error && <span style={{ fontSize: "0.85rem", color: "#b91c1c" }}>{error}</span>}
    </div>
  )
}
