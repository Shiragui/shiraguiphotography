"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this project?")) return;
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      alert("Could not delete project.");
      return;
    }
    router.push("/admin/projects");
    router.refresh();
  }

  return (
    <button type="button" className="admin-button admin-button-secondary" onClick={onDelete} disabled={loading}>
      {loading ? "Deleting..." : "Delete project"}
    </button>
  );
}
