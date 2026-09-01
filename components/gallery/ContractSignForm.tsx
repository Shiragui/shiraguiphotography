"use client"

import { useState, useRef, useEffect, useCallback } from "react"

interface ContractSignFormProps {
  token: string
  contractBody: string
  projectName: string
  clientName: string
}

function todayString() {
  const d = new Date()
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

function formatDateDisplay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function ContractSignForm({
  token,
  contractBody,
  projectName,
  clientName,
}: ContractSignFormProps) {
  const [sigMode, setSigMode] = useState<"drawn" | "typed">("drawn")
  const [signerName, setSignerName] = useState("")
  const [clientDate, setClientDate] = useState(todayString)
  const [photoRelease, setPhotoRelease] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signed, setSigned] = useState<{
    name: string
    date: string
    photoRelease: boolean
    pdfBase64: string | null
  } | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  // Scale canvas to device pixel ratio for crisp rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 2.2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [sigMode])

  function getPos(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    drawing.current = true
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!drawing.current) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasDrawn(true)
  }

  function endDraw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    drawing.current = false
  }

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
    setHasDrawn(false)
  }, [])

  function getSignatureImage(): string | null {
    if (sigMode === "typed") return null
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) return null
    return canvas.toDataURL("image/png")
  }

  async function handleSign() {
    const name = signerName.trim()
    if (!name) {
      setError("Please enter your full name.")
      return
    }
    if (sigMode === "drawn" && !hasDrawn) {
      setError("Please draw your signature above, or switch to typed mode.")
      return
    }

    setSubmitting(true)
    setError(null)

    const signatureImage = getSignatureImage()

    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signer_name: name,
          signature_image: signatureImage,
          signature_type: sigMode,
          client_date: clientDate,
          photo_release: photoRelease,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
      } else {
        setSigned({
          name,
          date: clientDate,
          photoRelease,
          pdfBase64: data.pdf ?? null,
        })
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  function downloadPdf(base64: string, name: string) {
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const blob = new Blob([bytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${name.replace(/\s+/g, "_")}_contract.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "0.5rem",
    border: "none",
    borderBottom: active ? "2px solid #1a1a1a" : "2px solid transparent",
    background: "none",
    fontSize: "0.85rem",
    fontWeight: active ? 600 : 400,
    color: active ? "#1a1a1a" : "#9ca3af",
    cursor: "pointer",
    fontFamily: "'Georgia', serif",
    transition: "all 0.15s",
  })

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        padding: "2rem 1rem 4rem",
        fontFamily: "'Georgia', serif",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.2em", color: "#888", textTransform: "uppercase" }}>
            Shira Gui Photography
          </p>
        </div>

        {/* Card */}
        <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden" }}>

          {/* Card header */}
          <div style={{ padding: "1.75rem 2rem 1.5rem", borderBottom: "1px solid #eee" }}>
            <h1 style={{ margin: "0 0 0.25rem", fontSize: "1.35rem", fontWeight: 400, color: "#1a1a1a" }}>
              Photography Services Agreement
            </h1>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>
              {projectName}{clientName ? ` · ${clientName}` : ""}
            </p>
          </div>

          {/* Contract body */}
          <div style={{ padding: "1.5rem 2rem" }}>
            <div
              style={{
                maxHeight: "50vh",
                overflowY: "auto",
                background: "#f9f9f9",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "1.25rem 1.5rem",
                fontSize: "0.85rem",
                lineHeight: 1.75,
                color: "#374151",
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
              }}
            >
              {contractBody}
            </div>
          </div>

          {/* Signature section */}
          <div style={{ padding: "1.5rem 2rem 2rem", borderTop: "1px solid #eee" }}>
            {!signed ? (
              <div style={{ display: "grid", gap: "1.25rem" }}>

                <p style={{ margin: 0, fontSize: "0.9rem", color: "#374151", lineHeight: 1.6 }}>
                  Review the agreement above, then complete the fields below to sign.
                </p>

                {/* Full name */}
                <div style={{ display: "grid", gap: "0.35rem" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6b7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Full name
                  </label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => { setSignerName(e.target.value); setError(null) }}
                    placeholder="Your full legal name"
                    disabled={submitting}
                    style={{
                      padding: "0.65rem 0.875rem",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: "1rem",
                      color: "#1a1a1a",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                      fontFamily: "'Georgia', serif",
                    }}
                  />
                </div>

                {/* Date */}
                <div style={{ display: "grid", gap: "0.35rem" }}>
                  <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6b7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    Date
                  </label>
                  <input
                    type="date"
                    value={clientDate}
                    onChange={(e) => setClientDate(e.target.value)}
                    disabled={submitting}
                    style={{
                      padding: "0.65rem 0.875rem",
                      borderRadius: 8,
                      border: "1px solid #d1d5db",
                      fontSize: "0.95rem",
                      color: "#1a1a1a",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                      fontFamily: "'Georgia', serif",
                    }}
                  />
                </div>

                {/* Signature pad */}
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6b7280", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      Signature
                    </label>
                    {/* Draw / Type toggle */}
                    <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                      <button type="button" onClick={() => setSigMode("drawn")} style={tabStyle(sigMode === "drawn")}>Draw</button>
                      <button type="button" onClick={() => setSigMode("typed")} style={tabStyle(sigMode === "typed")}>Type</button>
                    </div>
                  </div>

                  {sigMode === "drawn" ? (
                    <div style={{ display: "grid", gap: "0.4rem" }}>
                      <div
                        style={{
                          position: "relative",
                          border: "1px solid #d1d5db",
                          borderRadius: 8,
                          background: "#fafafa",
                          height: 120,
                          overflow: "hidden",
                          touchAction: "none",
                        }}
                      >
                        <canvas
                          ref={canvasRef}
                          style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
                          onMouseDown={startDraw}
                          onMouseMove={draw}
                          onMouseUp={endDraw}
                          onMouseLeave={endDraw}
                          onTouchStart={startDraw}
                          onTouchMove={draw}
                          onTouchEnd={endDraw}
                        />
                        {!hasDrawn && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              pointerEvents: "none",
                              color: "#c4c9d4",
                              fontSize: "0.85rem",
                              fontStyle: "italic",
                            }}
                          >
                            Draw your signature here
                          </div>
                        )}
                      </div>
                      {hasDrawn && (
                        <div>
                          <button
                            type="button"
                            onClick={clearCanvas}
                            style={{
                              background: "none",
                              border: "none",
                              fontSize: "0.8rem",
                              color: "#9ca3af",
                              cursor: "pointer",
                              padding: 0,
                              textDecoration: "underline",
                            }}
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      style={{
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        background: "#fafafa",
                        height: 80,
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: "1.25rem",
                        paddingRight: "1.25rem",
                      }}
                    >
                      {signerName.trim() ? (
                        <span
                          style={{
                            fontFamily: "'Georgia', serif",
                            fontStyle: "italic",
                            fontSize: "1.6rem",
                            color: "#1a1a1a",
                          }}
                        >
                          {signerName}
                        </span>
                      ) : (
                        <span style={{ color: "#c4c9d4", fontSize: "0.85rem", fontStyle: "italic" }}>
                          Your name will appear here
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Photo release */}
                <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "1rem 1.125rem" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer", userSelect: "none" }}>
                    <input
                      type="checkbox"
                      checked={photoRelease}
                      onChange={e => setPhotoRelease(e.target.checked)}
                      disabled={submitting}
                      style={{ marginTop: "0.2rem", width: 16, height: 16, cursor: "pointer", accentColor: "#1a1a1a", flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "0.88rem", color: "#374151", lineHeight: 1.55 }}>
                      <strong>Photo release (optional):</strong> I give Shira Gui Photography permission to use my photographs on her website, Instagram{" "}
                      <span style={{ color: "#6b7280" }}>(@shiraguiphotography)</span>, and other promotional materials. Declining will not affect my session.
                    </span>
                  </label>
                </div>

                {error && (
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#b91c1c" }}>{error}</p>
                )}

                <button
                  type="button"
                  onClick={handleSign}
                  disabled={submitting || !signerName.trim() || (sigMode === "drawn" && !hasDrawn)}
                  style={{
                    background: (submitting || !signerName.trim() || (sigMode === "drawn" && !hasDrawn)) ? "#9ca3af" : "#1a1a1a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "0.75rem 1.5rem",
                    fontSize: "0.9rem",
                    letterSpacing: "0.05em",
                    cursor: (submitting || !signerName.trim() || (sigMode === "drawn" && !hasDrawn)) ? "not-allowed" : "pointer",
                    fontFamily: "'Georgia', serif",
                    width: "100%",
                  }}
                >
                  {submitting ? "Signing…" : "I agree and sign"}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "1rem 0", display: "grid", gap: "0.75rem" }}>
                <div>
                  <p style={{ margin: "0 0 0.4rem", fontSize: "0.8rem", color: "#16a34a", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Contract Signed
                  </p>
                  <p style={{ margin: "0 0 0.2rem", fontSize: "1.05rem", color: "#1a1a1a" }}>
                    Thank you, <strong>{signed.name}</strong>.
                  </p>
                  <p style={{ margin: "0 0 0.2rem", fontSize: "0.85rem", color: "#6b7280" }}>
                    Signed on {formatDateDisplay(signed.date)}.
                  </p>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "#9ca3af" }}>
                    Photo release: {signed.photoRelease ? "Yes — photos may be used for promotional purposes." : "No — photos will be kept private."}
                  </p>
                </div>
                {signed.pdfBase64 && (
                  <button
                    type="button"
                    onClick={() => downloadPdf(signed.pdfBase64!, signed.name)}
                    style={{
                      background: "#1a1a1a",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "0.6rem 1.25rem",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      fontFamily: "'Georgia', serif",
                      display: "inline-block",
                      margin: "0 auto",
                    }}
                  >
                    Download signed contract (PDF)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
