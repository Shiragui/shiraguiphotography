import { NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api-auth"
import { createServiceClient } from "@/lib/supabase/service"
import { generateSignToken, renderContract } from "@/lib/contracts"

type Params = { params: Promise<{ id: string }> }

function formatSessionDate(dateStr: string | null): string {
  if (!dateStr) return "TBD"
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function formatToday(): string {
  const d = new Date()
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

export async function GET(_request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("project_id", id)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json(null)
    }

    return NextResponse.json(data)
  })
}

export async function POST(_request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params
    const supabase = createServiceClient()

    // Fetch project with client info
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, project_type, session_date, client_id, clients(name)")
      .eq("id", id)
      .maybeSingle()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Fetch default template
    const { data: template, error: templateError } = await supabase
      .from("contract_templates")
      .select("body")
      .eq("is_default", true)
      .maybeSingle()

    if (templateError || !template) {
      return NextResponse.json({ error: "No default template found" }, { status: 404 })
    }

    const clientData = Array.isArray(project.clients) ? project.clients[0] : project.clients
    const clientName = clientData?.name ?? "Client"

    const renderedBody = renderContract(template.body, {
      client_name: clientName,
      project_type: project.project_type ?? "Photography Session",
      session_date: formatSessionDate(project.session_date),
      date_today: formatToday(),
    })

    const signToken = generateSignToken()

    const { data: contract, error: insertError } = await supabase
      .from("contracts")
      .insert({
        project_id: id,
        client_id: project.client_id,
        body: renderedBody,
        sign_token: signToken,
        status: "draft",
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(contract, { status: 201 })
  })
}

export async function DELETE(_request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params
    const supabase = createServiceClient()

    const { data: contract, error: fetchError } = await supabase
      .from("contracts")
      .select("id, status")
      .eq("project_id", id)
      .maybeSingle()

    if (fetchError || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    if (contract.status !== "draft") {
      return NextResponse.json({ error: "Only draft contracts can be deleted" }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from("contracts")
      .delete()
      .eq("id", contract.id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  })
}
