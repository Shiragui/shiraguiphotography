import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type AdminProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin";
};

export async function getAdminProfile(): Promise<AdminProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") return null;

  return profile as AdminProfile;
}

export async function requireAdminProfile() {
  const profile = await getAdminProfile();
  if (!profile) {
    throw new Error("UNAUTHORIZED");
  }
  return profile;
}

export async function ensureAdminProfileForUser(user: {
  id: string;
  email?: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const userEmail = user.email?.toLowerCase();

  if (!adminEmail || !userEmail || userEmail !== adminEmail) {
    return null;
  }

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.role === "admin") {
    return existing as AdminProfile;
  }

  const { data: created, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email!,
        role: "admin",
      },
      { onConflict: "id" }
    )
    .select("id, email, full_name, role")
    .single();

  if (error || !created) return null;
  return created as AdminProfile;
}
