import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params;
    const supabase = await createClient();

    const [{ data: client, error: clientError }, { data: projects, error: projectsError }] =
      await Promise.all([
        supabase.from("clients").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("projects")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false }),
      ]);

    if (clientError || projectsError) {
      return NextResponse.json(
        { error: clientError?.message || projectsError?.message },
        { status: 500 }
      );
    }

    if (!client) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ client, projects });
  });
}

export async function PATCH(request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clients")
      .update({
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        notes: body.notes || null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ client: data });
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  });
}
