import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "@/components/admin/ClientForm";

type Params = { params: Promise<{ id: string }> };

export default async function EditClientPage({ params }: Params) {
  const profile = await getAdminProfile();
  if (!profile) redirect("/admin/login");

  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();

  if (!client) notFound();

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 640 }}>
      <div>
        <Link href={`/admin/clients/${client.id}`} style={{ color: "#005987" }}>
          ← Back to client
        </Link>
        <h1 style={{ marginBottom: 0 }}>Edit client</h1>
      </div>
      <ClientForm
        clientId={client.id}
        initial={{
          name: client.name,
          email: client.email,
          phone: client.phone,
          notes: client.notes,
        }}
      />
    </div>
  );
}
