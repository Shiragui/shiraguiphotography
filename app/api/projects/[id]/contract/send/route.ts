import { NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/api-auth"
import { createServiceClient } from "@/lib/supabase/service"
import { sendContractEmail } from "@/lib/email"

type Params = { params: Promise<{ id: string }> }

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shiraguiphotography.com"

export async function POST(_request: Request, { params }: Params) {
  return withAdminAuth(async () => {
    const { id } = await params
    const supabase = createServiceClient()

    // Fetch contract + project + client
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id, sign_token, status")
      .eq("project_id", id)
      .maybeSingle()

    if (contractError || !contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, client_id, clients(name, email)")
      .eq("id", id)
      .maybeSingle()

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const clientData = Array.isArray(project.clients) ? project.clients[0] : project.clients

    if (!clientData?.email) {
      return NextResponse.json({ error: "Client has no email address" }, { status: 400 })
    }

    const signUrl = `${SITE_URL}/sign/${contract.sign_token}`

    const result = await sendContractEmail({
      toEmail: clientData.email,
      clientName: clientData.name,
      projectName: project.name,
      signUrl,
    })

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    // Update status to 'sent'
    const { error: updateError } = await supabase
      .from("contracts")
      .update({ status: "sent" })
      .eq("id", contract.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  })
}
