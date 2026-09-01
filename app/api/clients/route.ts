import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api-auth";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  return withAdminAuth(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clients: data });
  });
}

export async function POST(request: Request) {
  return withAdminAuth(async () => {
    const body = await request.json();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("clients")
      .insert({
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        notes: body.notes || null,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ client: data }, { status: 201 });
  });
}
