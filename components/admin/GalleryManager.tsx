"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface GalleryManagerProps {
  projectId: string
  galleryToken: string
  initialDownloadCode: string | null
  clientEmail: string | null
}

function generateDownloadCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export function GalleryManager({
  projectId,
  galleryToken,
  initialDownloadCode,
  clientEmail,
}: GalleryManagerProps) {
  const router = useRouter()

  const [downloadCode, setDownloadCode] = useState<string>(initialDownloadCode ?? "")
  const [codeGenerating, setCodeGenerating] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)

  const [emailInput, setEmailInput] = useState(clientEmail ?? "")
  const [includeDownloadCode, setIncludeDownloadCode] = useState(true)
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const galleryUrl = `${typeof window !== "undefined" ? window.location.origin : "https://shiraguiphotography.com"}/gallery/${galleryToken}`

  async function saveCode(code: string | null) {
    const res = await fetch(`/api/projects/${projectId}/gallery`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ download_code: code }),
    })
    if (!res.ok) throw new Error((await res.json()).error ?? "Failed to save code")
  }

  async function generateCode() {
    setCodeGenerating(true)
    setCodeError(null)
    try {
      const code = generateDownloadCode()
      await saveCode(code)
      setDownloadCode(code)
      router.refresh()
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : "Failed to generate code")
    } finally {
      setCodeGenerating(false)
    }
  }

  async function sendGallery() {
    const emails = emailInput.split(",").map((e) => e.trim()).filter(Boolean)
    if (emails.length === 0) {
      setSendStatus({ ok: false, message: "Enter at least one email address" })
      return
    }
    setSending(true)
    setSendStatus(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/send-gallery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails, includeDownloadCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSendStatus({ ok: false, message: data.error ?? "Failed to send" })
      } else {
        setSendStatus({ ok: true, message: `✓ Sent to ${(data.sentTo as string[]).join(", ")}` })
      }
    } catch {
      setSendStatus({ ok: false, message: "Something went wrong" })
    } finally {
      setSending(false)
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(galleryUrl)
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>

      {/* Gallery link */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <span
          style={{
            fontSize: "0.85rem",
            color: "#6b7680",
            wordBreak: "break-all",
            background: "#f5f6f7",
            padding: "0.6rem 0.8rem",
            borderRadius: 8,
            border: "1px solid #e5e6e7",
          }}
        >
          {galleryUrl}
        </span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <a
            href={galleryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-button"
            style={{ fontSize: "0.9rem", textDecoration: "none" }}
          >
            View gallery ↗
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="admin-button admin-button-secondary"
            style={{ fontSize: "0.9rem" }}
          >
            Copy link
          </button>
        </div>
      </div>

      {/* Download code */}
      <div style={{ borderTop: "1px solid #e5e6e7", paddingTop: "1.25rem", display: "grid", gap: "0.6rem" }}>
        <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "#374151" }}>Download code</p>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "#6b7680" }}>
          Clients enter this code to unlock photo downloads.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "monospace",
            fontSize: "1.3rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "#1a1a1a",
            background: "#f0f4ff",
            padding: "0.35rem 0.75rem",
            borderRadius: 6,
          }}>
            {downloadCode}
          </span>
          <button
            type="button"
            onClick={generateCode}
            disabled={codeGenerating}
            className="admin-button admin-button-secondary"
            style={{ fontSize: "0.85rem" }}
          >
            {codeGenerating ? "Saving…" : "Regenerate"}
          </button>
        </div>
        {codeError && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#b91c1c" }}>{codeError}</p>
        )}
      </div>

      {/* Send email */}
      <div style={{ borderTop: "1px solid #e5e6e7", paddingTop: "1.25rem", display: "grid", gap: "0.6rem" }}>
        <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600, color: "#374151" }}>Send gallery email</p>
        <p style={{ margin: 0, fontSize: "0.82rem", color: "#6b7680" }}>
          Separate multiple addresses with commas.
        </p>
        <input
          type="text"
          value={emailInput}
          onChange={(e) => { setEmailInput(e.target.value); setSendStatus(null) }}
          placeholder="client@email.com, partner@email.com"
          style={{ padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid #d1d5db", fontSize: "0.9rem" }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={includeDownloadCode}
            onChange={e => setIncludeDownloadCode(e.target.checked)}
            style={{ width: 15, height: 15, cursor: "pointer" }}
          />
          <span style={{ fontSize: "0.85rem", color: "#374151" }}>Include download code</span>
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={sendGallery}
            disabled={sending || !emailInput.trim()}
            className="admin-button"
            style={{ fontSize: "0.9rem" }}
          >
            {sending ? "Sending…" : "Send"}
          </button>
          {sendStatus && (
            <span style={{ fontSize: "0.85rem", color: sendStatus.ok ? "#16a34a" : "#b91c1c" }}>
              {sendStatus.message}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
