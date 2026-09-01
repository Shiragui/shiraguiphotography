import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getAdminProfile();

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/admin/login");
  }

  return (
    <div className="admin-shell">
      {profile ? (
        <header
          style={{
            borderBottom: "1px solid #e5e6e7",
            background: "#fff",
            padding: "1rem 1.5rem",
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <Link href="/admin" style={{ textDecoration: "none", fontWeight: 900, fontSize: "1.25rem" }}>
                Shira Gui <span style={{ color: "#005987" }}>Admin</span>
              </Link>
              <div style={{ color: "#6b7680", fontSize: "0.9rem" }}>{profile.email}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <AdminNav />
              <form action={signOut}>
                <button type="submit" className="admin-button admin-button-secondary">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
      ) : null}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem 3rem" }}>{children}</main>
    </div>
  );
}
