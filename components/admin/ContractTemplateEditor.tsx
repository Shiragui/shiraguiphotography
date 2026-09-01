"use client"

import { useState } from "react"

const VARIABLES = [
  "{{client_name}}",
  "{{project_type}}",
  "{{session_date}}",
  "{{date_today}}",
]

interface ContractTemplateEditorProps {
  initialBody: string
}

export function ContractTemplateEditor({ initialBody }: ContractTemplateEditorProps) {
  const [body, setBody] = useState(initialBody)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)

  async function handleSave() {
    setSaving(true)
    setStatus(null)
    try {
      const res = await fetch("/api/contracts/template", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus({ ok: false, message: data.error ?? "Failed to save" })
      } else {
        setStatus({ ok: true, message: "Template saved." })
      }
    } catch {
      setStatus({ ok: false, message: "Something went wrong" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-card" style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
      <div>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "#6b7680", fontWeight: 500 }}>
          Available variables
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {VARIABLES.map((v) => (
            <code
              key={v}
              style={{
                background: "#f0f4ff",
                border: "1px solid #c7d7f9",
                color: "#374191",
                padding: "0.2rem 0.5rem",
                borderRadius: 4,
                fontSize: "0.82rem",
                fontFamily: "monospace",
                cursor: "pointer",
              }}
              title="Click to copy"
              onClick={() => navigator.clipboard.writeText(v)}
            >
              {v}
            </code>
          ))}
          <span style={{ fontSize: "0.78rem", color: "#9ca3af", alignSelf: "center" }}>
            (click to copy)
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gap: "0.4rem" }}>
        <label className="admin-label" htmlFor="contract-body">
          Contract body
        </label>
        <textarea
          id="contract-body"
          className="admin-textarea"
          value={body}
          onChange={(e) => { setBody(e.target.value); setStatus(null) }}
          style={{
            minHeight: 400,
            fontFamily: "monospace",
            fontSize: "0.85rem",
            lineHeight: 1.6,
            resize: "vertical",
          }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="admin-button"
        >
          {saving ? "Saving…" : "Save template"}
        </button>
        {status && (
          <span style={{ fontSize: "0.85rem", color: status.ok ? "#16a34a" : "#b91c1c" }}>
            {status.message}
          </span>
        )}
      </div>
    </div>
  )
}
