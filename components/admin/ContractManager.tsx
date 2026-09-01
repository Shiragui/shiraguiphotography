"use client"

import { useState } from "react"

export interface ContractData {
  id: string
  status: "draft" | "sent" | "viewed" | "signed"
  signer_name: string | null
  signed_at: string | null
  sign_token: string
  photo_release: boolean | null
  pdf_drive_id: string | null
}

interface ContractManagerProps {
  projectId: string
  clientEmail: string | null
  initialContract: ContractData | null
}

const STATUS_LABELS: Record<ContractData["status"], string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
}

const STATUS_COLORS: Record<ContractData["status"], string> = {
  draft: "#6b7680",
  sent: "#1d4ed8",
  viewed: "#b45309",
  signed: "#16a34a",
}

function StatusBadge({ status }: { status: ContractData["status"] }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: STATUS_COLORS[status] + "18",
        color: STATUS_COLORS[status],
        border: `1px solid ${STATUS_COLORS[status]}40`,
        borderRadius: 6,
        padding: "0.15rem 0.6rem",
        fontSize: "0.8rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function ContractManager({
  projectId,
  clientEmail,
  initialContract,
}: ContractManagerProps) {
  const [contract, setContract] = useState<ContractData | null>(initialContract)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const SITE_URL =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://shiraguiphotography.com"

  const signUrl = contract ? `${SITE_URL}/sign/${contract.sign_token}` : null

  async function createContract() {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/contract`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to create contract")
      } else {
        setContract(data)
        setSuccessMessage("Contract created.")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function sendContract() {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/contract/send`, {
        method: "POST",
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to send contract")
      } else {
        setContract((c) => c ? { ...c, status: "sent" } : c)
        setSuccessMessage("Contract sent to client.")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function deleteContract() {
    if (!window.confirm("Delete this draft contract? This cannot be undone.")) return
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/contract`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to delete contract")
      } else {
        setContract(null)
        setSuccessMessage(null)
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function copySignLink() {
    if (!signUrl) return
    await navigator.clipboard.writeText(signUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>

      {/* No contract yet */}
      {!contract && (
        <div style={{ display: "grid", gap: "0.6rem" }}>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#6b7680" }}>
            No contract has been created for this project.
          </p>
          <div>
            <button
              type="button"
              onClick={createContract}
              disabled={loading}
              className="admin-button"
              style={{ fontSize: "0.9rem" }}
            >
              {loading ? "Creating…" : "Create contract"}
            </button>
          </div>
        </div>
      )}

      {/* Draft state */}
      {contract && contract.status === "draft" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <StatusBadge status="draft" />
            <span style={{ fontSize: "0.85rem", color: "#6b7680" }}>
              Ready to send to client for signing.
            </span>
          </div>

          <div style={{ borderTop: "1px solid #e5e6e7", paddingTop: "1.25rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={sendContract}
              disabled={loading || !clientEmail}
              className="admin-button"
              style={{ fontSize: "0.9rem" }}
              title={!clientEmail ? "Client has no email address" : undefined}
            >
              {loading ? "Sending…" : "Send to client"}
            </button>
            <button
              type="button"
              onClick={deleteContract}
              disabled={loading}
              className="admin-button admin-button-secondary"
              style={{ fontSize: "0.9rem", color: "#b91c1c", borderColor: "#b91c1c" }}
            >
              Delete
            </button>
          </div>

          {!clientEmail && (
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#b45309" }}>
              The linked client has no email address. Add one to send the contract.
            </p>
          )}
        </>
      )}

      {/* Sent / Viewed state */}
      {contract && (contract.status === "sent" || contract.status === "viewed") && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <StatusBadge status={contract.status} />
            <span style={{ fontSize: "0.85rem", color: "#6b7680" }}>
              {contract.status === "viewed"
                ? "Client has viewed the contract."
                : "Awaiting client signature."}
            </span>
          </div>

          <div style={{ borderTop: "1px solid #e5e6e7", paddingTop: "1.25rem", display: "grid", gap: "0.5rem" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "#374151" }}>
              Signing link
            </p>
            <span
              style={{
                fontSize: "0.82rem",
                color: "#6b7680",
                wordBreak: "break-all",
                background: "#f5f6f7",
                padding: "0.5rem 0.75rem",
                borderRadius: 6,
                border: "1px solid #e5e6e7",
                fontFamily: "monospace",
              }}
            >
              {signUrl}
            </span>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={copySignLink}
                className="admin-button admin-button-secondary"
                style={{ fontSize: "0.85rem" }}
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
              <button
                type="button"
                onClick={sendContract}
                disabled={loading || !clientEmail}
                className="admin-button admin-button-secondary"
                style={{ fontSize: "0.85rem" }}
              >
                {loading ? "Sending…" : "Resend email"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Signed state */}
      {contract && contract.status === "signed" && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <StatusBadge status="signed" />
          </div>

          <div style={{ borderTop: "1px solid #e5e6e7", paddingTop: "1.25rem", display: "grid", gap: "0.6rem" }}>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Signed by</p>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#1a1a1a" }}>{contract.signer_name ?? "—"}</p>
              <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#6b7680" }}>{formatDate(contract.signed_at)}</p>
            </div>
            <div>
              <p style={{ margin: "0 0 2px", fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Photo release</p>
              <p style={{ margin: 0, fontSize: "0.9rem", color: contract.photo_release ? "#16a34a" : "#b91c1c", fontWeight: 500 }}>
                {contract.photo_release === null ? "—" : contract.photo_release ? "Yes — may use for promotional purposes" : "No — keep private"}
              </p>
            </div>
            {contract.pdf_drive_id && (
              <div style={{ paddingTop: "0.5rem" }}>
                <a
                  href={`/api/projects/${projectId}/contract/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-button admin-button-secondary"
                  style={{ fontSize: "0.85rem", display: "inline-block" }}
                >
                  View signed PDF
                </a>
              </div>
            )}
          </div>
        </>
      )}

      {/* Feedback */}
      {(error || successMessage) && (
        <div>
          {error && (
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#b91c1c" }}>{error}</p>
          )}
          {successMessage && (
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#16a34a" }}>{successMessage}</p>
          )}
        </div>
      )}
    </div>
  )
}
