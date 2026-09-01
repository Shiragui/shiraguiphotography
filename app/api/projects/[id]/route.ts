import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("projects")
      .update({
        client_id: body.client_id,
        name: body.name,
        project_type: body.project_type || null,
        session_date: body.session_date || null,
        status: body.status,
        notes: body.notes || null,
      })
      .eq("id", id)
      .select("*, clients(id, name, email)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ project: data });
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase.from("projects").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  });
}
