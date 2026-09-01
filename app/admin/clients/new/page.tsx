import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile } from "@/lib/auth";
import { ClientForm } from "@/components/admin/ClientForm";

export default async function NewClientPage() {
  const profile = await getAdminProfile();
  if (!profile) redirect("/admin/login");

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 640 }}>
      <div>
        <Link href="/admin/clients" style={{ color: "#005987" }}>
          ← Back to clients
        </Link>
        <h1 style={{ marginBottom: 0 }}>New client</h1>
      </div>
      <ClientForm submitLabel="Create client" />
    </div>
  );
}
