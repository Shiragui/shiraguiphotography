"use client"

import { useState } from "react"

interface Email {
  id: string
  subject: string
  body: string
  to_email: string
  sent_at: string
}

interface Props {
  toEmail: string
  defaultSubject: string
  inquiryId?: string
  clientId?: string
  projectId?: string
  initialEmails: Email[]
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

export function EmailThread({ toEmail, defaultSubject, inquiryId, clientId, projectId, initialEmails }: Props) {
  const [emails, setEmails] = useState<Email[]>(initialEmails)
  const [subject, setSubject] = useState(defaultSubject)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_email: toEmail,
          subject: subject.trim(),
          message: message.trim(),
          inquiry_id: inquiryId ?? null,
          client_id: clientId ?? null,
          project_id: projectId ?? null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to send"); return }
      setEmails(prev => [{
        id: data.email.id,
        subject: subject.trim(),
        body: message.trim(),
        to_email: toEmail,
        sent_at: data.email.sent_at,
      }, ...prev])
      setMessage("")
    } catch {
      setError("Something went wrong")
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af" }}>
        Sending to <strong style={{ color: "#374151" }}>{toEmail}</strong>
        {" · "}Replies go to your email as usual
      </p>

      {/* Compose */}
      <form onSubmit={send} style={{ display: "grid", gap: "0.6rem" }}>
        <input
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Subject"
          required
          style={{ padding: "0.5rem 0.75rem", borderRadius: 6, border: "1px solid #d1d5db", fontSize: "0.9rem", color: "#111" }}
        />
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Write your message…"
          rows={5}
          required
          style={{ padding: "0.65rem 0.75rem", borderRadius: 6, border: "1px solid #d1d5db", fontSize: "0.9rem", resize: "vertical", color: "#111", fontFamily: "inherit" }}
        />
        {error && <p style={{ margin: 0, fontSize: "0.85rem", color: "#b91c1c" }}>{error}</p>}
        <div>
          <button type="submit" disabled={sending || !message.trim()} className="admin-button" style={{ fontSize: "0.9rem" }}>
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </form>

      {/* Thread history */}
      {emails.length > 0 && (
        <div style={{ borderTop: "1px solid #e5e6e7", paddingTop: "1rem", display: "grid", gap: "0.5rem" }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#9ca3af", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Sent ({emails.length})
          </p>
          {emails.map(email => (
            <div
              key={email.id}
              style={{ background: "#f8f9fa", borderRadius: 8, overflow: "hidden", border: "1px solid #e5e6e7" }}
            >
              <button
                type="button"
                onClick={() => setExpanded(expanded === email.id ? null : email.id)}
                style={{
                  width: "100%", textAlign: "left", background: "none", border: "none",
                  padding: "0.75rem 1rem", cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {email.subject}
                  </p>
                  {expanded !== email.id && (
                    <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#6b7680", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {email.body}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: "0.75rem", color: "#9ca3af", flexShrink: 0 }}>{formatTime(email.sent_at)}</span>
              </button>
              {expanded === email.id && (
                <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid #e5e6e7" }}>
                  <p style={{ margin: "0.75rem 0 0", fontSize: "0.9rem", color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                    {email.body}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
