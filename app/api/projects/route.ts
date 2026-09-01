import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";
import { generateGalleryToken, generateDownloadCode } from "@/lib/gallery";

export async function GET() {
  return withAdminAuth(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*, clients(id, name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ projects: data });
  });
}

export async function POST(request: Request) {
  return withAdminAuth(async () => {
    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("projects")
      .insert({
        client_id: body.client_id,
        name: body.name,
        project_type: body.project_type || null,
        session_date: body.session_date || null,
        status: body.status || "inquiry",
        notes: body.notes || null,
        gallery_token: generateGalleryToken(),
        gallery_enabled: true,
        download_code: generateDownloadCode(),
      })
      .select("*, clients(id, name, email)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ project: data }, { status: 201 });
  });
}
