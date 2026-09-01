"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ClientOption = { id: string; name: string };

type ProjectFormProps = {
  clients: ClientOption[];
  initial?: {
    client_id: string;
    name: string;
    project_type?: string | null;
    session_date?: string | null;

    notes?: string | null;
  };
  projectId?: string;
  submitLabel?: string;
};

export function ProjectForm({
  clients,
  initial,
  projectId,
  submitLabel = "Save project",
}: ProjectFormProps) {
  const router = useRouter();
  const [clientId, setClientId] = useState(initial?.client_id || clients[0]?.id || "");
  const [name, setName] = useState(initial?.name || "");
  const [projectType, setProjectType] = useState(initial?.project_type || "");
  const [sessionDate, setSessionDate] = useState(initial?.session_date || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = projectId ? `/api/projects/${projectId}` : "/api/projects";
    const method = projectId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        name,
        project_type: projectType,
        session_date: sessionDate || null,
        notes,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    router.push("/admin/projects");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="admin-card" style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
      <div>
        <label className="admin-label" htmlFor="client_id">
          Client
        </label>
        <select
          id="client_id"
          className="admin-select"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
        >
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="admin-label" htmlFor="project_name">
          Project name
        </label>
        <input
          id="project_name"
          className="admin-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="admin-label" htmlFor="project_type">
          Project type
        </label>
        <input
          id="project_type"
          className="admin-input"
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
          placeholder="Graduation, headshots, wedding..."
        />
      </div>
      <div>
        <label className="admin-label" htmlFor="session_date">
          Session date
        </label>
        <input
          id="session_date"
          className="admin-input"
          type="date"
          value={sessionDate || ""}
          onChange={(e) => setSessionDate(e.target.value)}
        />
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
      <button className="admin-button" type="submit" disabled={loading || clients.length === 0}>
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
