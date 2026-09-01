"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function NewInquiryForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [message, setMessage] = useState("")
  const [howFound, setHowFound] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, location, message, how_found: howFound }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to save"); return }
      router.push(`/admin/inquiries/${data.id}`)
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin-card" style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="admin-label" htmlFor="inq-name">Name *</label>
          <input id="inq-name" className="admin-input" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="admin-label" htmlFor="inq-email">Email *</label>
          <input id="inq-email" className="admin-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div>
          <label className="admin-label" htmlFor="inq-phone">Phone</label>
          <input id="inq-phone" className="admin-input" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="admin-label" htmlFor="inq-location">Location</label>
          <input id="inq-location" className="admin-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="City, venue, etc." />
        </div>
      </div>
      <div>
        <label className="admin-label" htmlFor="inq-message">Message</label>
        <textarea id="inq-message" className="admin-textarea" rows={4} value={message} onChange={e => setMessage(e.target.value)} />
      </div>
      <div>
        <label className="admin-label" htmlFor="inq-how">How they found you</label>
        <input id="inq-how" className="admin-input" value={howFound} onChange={e => setHowFound(e.target.value)} placeholder="Instagram, referral, Google…" />
      </div>
      {error && <p style={{ margin: 0, color: "#b91c1c", fontSize: "0.88rem" }}>{error}</p>}
      <div>
        <button type="submit" disabled={loading} className="admin-button">
          {loading ? "Saving…" : "Save inquiry"}
        </button>
      </div>
    </form>
  )
}
