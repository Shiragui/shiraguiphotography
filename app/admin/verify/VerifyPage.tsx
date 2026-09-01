"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [resending, setResending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    sendCode()
  }, [])

  async function sendCode() {
    const res = await fetch("/api/admin/send-otp", { method: "POST" })
    if (res.ok) {
      setSent(true)
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setError("Failed to send code. Check Twilio configuration.")
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch("/api/admin/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Invalid code")
      setLoading(false)
      return
    }

    const next = searchParams.get("next") || "/admin"
    router.push(next)
    router.refresh()
  }

  async function onResend() {
    setResending(true)
    setError(null)
    setCode("")
    await sendCode()
    setResending(false)
  }

  return (
    <div style={{ maxWidth: 420, margin: "4rem auto" }}>
      <div className="admin-card" style={{ padding: "2rem" }}>
        <h1 style={{ marginTop: 0, fontSize: "2rem" }}>Verify it&apos;s you</h1>
        <p style={{ color: "#6b7680" }}>
          {sent
            ? "A 6-digit code was sent to your email."
            : "Sending code to your email…"}
        </p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
          <div>
            <label className="admin-label" htmlFor="code">Verification code</label>
            <input
              id="code"
              ref={inputRef}
              className="admin-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              autoComplete="one-time-code"
              required
              style={{ letterSpacing: "0.3em", fontSize: "1.4rem", textAlign: "center" }}
            />
          </div>

          {error ? <p style={{ color: "#b42318", margin: 0 }}>{error}</p> : null}

          <button className="admin-button" type="submit" disabled={loading || code.length < 6}>
            {loading ? "Verifying…" : "Verify"}
          </button>

          <button
            type="button"
            className="admin-button admin-button-secondary"
            onClick={onResend}
            disabled={resending}
            style={{ fontSize: "0.9rem" }}
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </form>
      </div>
    </div>
  )
}
