"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ClientFormProps = {
  initial?: {
    name: string;
    email: string;
    phone?: string | null;
    notes?: string | null;
  };
  clientId?: string;
  submitLabel?: string;
};

export function ClientForm({ initial, clientId, submitLabel = "Save client" }: ClientFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = clientId ? `/api/clients/${clientId}` : "/api/clients";
    const method = clientId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, notes }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    router.push(clientId ? `/admin/clients/${clientId}` : `/admin/clients/${data.client.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="admin-card" style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
      <div>
        <label className="admin-label" htmlFor="name">
          Name
        </label>
        <input id="name" className="admin-input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="admin-label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          className="admin-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="admin-label" htmlFor="phone">
          Phone
        </label>
        <input id="phone" className="admin-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <label className="admin-label" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          className="admin-textarea"
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error ? <p style={{ color: "#b42318", margin: 0 }}>{error}</p> : null}
      <button className="admin-button" type="submit" disabled={loading}>
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
