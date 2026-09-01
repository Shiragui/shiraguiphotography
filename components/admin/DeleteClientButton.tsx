"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteClientButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this client and all associated projects?")) return;
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      alert("Could not delete client.");
      return;
    }
    router.push("/admin/clients");
    router.refresh();
  }

  return (
    <button type="button" className="admin-button admin-button-secondary" onClick={onDelete} disabled={loading}>
      {loading ? "Deleting..." : "Delete client"}
    </button>
  );
}
