import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { generateContractPdf } from "@/lib/contract-pdf"
import { getOrCreateProjectFolder, uploadFileToDrive } from "@/lib/drive"
import { sendContractSignedNotification } from "@/lib/email"
import { Readable } from "stream"

type Params = { params: Promise<{ token: string }> }

export async function GET(_request: Request, { params }: Params) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: contract, error } = await supabase
    .from("contracts")
    .select(`
      id,
      body,
      status,
      signer_name,
      signed_at,
      project_id,
      client_id,
      projects(name),
      clients(name)
    `)
    .eq("sign_token", token)
    .maybeSingle()

  if (error || !contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 })
  }

  if (contract.status === "draft") {
    return NextResponse.json({ error: "This contract has not been sent yet" }, { status: 403 })
  }

  // Mark as viewed if currently 'sent'
  if (contract.status === "sent") {
    await supabase
      .from("contracts")
      .update({ status: "viewed" })
      .eq("id", contract.id)
  }

  const projectData = Array.isArray(contract.projects) ? contract.projects[0] : contract.projects
  const clientData = Array.isArray(contract.clients) ? contract.clients[0] : contract.clients

  return NextResponse.json({
    id: contract.id,
    body: contract.body,
    status: contract.status === "sent" ? "viewed" : contract.status,
    signer_name: contract.signer_name,
    signed_at: contract.signed_at,
    project_name: projectData?.name ?? null,
    client_name: clientData?.name ?? null,
  })
}

export async function POST(request: Request, { params }: Params) {
  const { token } = await params
  const supabase = createServiceClient()

  const body = await request.json()
  const signerName: string = (body.signer_name ?? "").trim()
  const photoRelease: boolean = body.photo_release === true
  const signatureImage: string | null = body.signature_image ?? null
  const signatureType: "drawn" | "typed" = body.signature_type === "drawn" ? "drawn" : "typed"
  const clientDate: string = (body.client_date ?? new Date().toISOString().slice(0, 10))

  if (!signerName) {
    return NextResponse.json({ error: "Signer name is required" }, { status: 400 })
  }

  // Reject oversized signature images (canvas PNG should be well under 200KB)
  if (signatureImage && signatureImage.length > 200_000) {
    return NextResponse.json({ error: "Signature image too large" }, { status: 400 })
  }

  const { data: contract, error: fetchError } = await supabase
    .from("contracts")
    .select(`
      id,
      status,
      body,
      project_id,
      projects(name),
      clients(name)
    `)
    .eq("sign_token", token)
    .maybeSingle()

  if (fetchError || !contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 })
  }

  if (contract.status !== "sent" && contract.status !== "viewed") {
    return NextResponse.json(
      { error: "This contract cannot be signed in its current state" },
      { status: 400 }
    )
  }

  const signedAt = new Date().toISOString()

  const { error: updateError } = await supabase
    .from("contracts")
    .update({
      status: "signed",
      signer_name: signerName,
      signed_at: signedAt,
      photo_release: photoRelease,
      signature_image: signatureImage,
      signature_type: signatureType,
      client_date: clientDate,
    })
    .eq("id", contract.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Generate PDF
  let pdfBase64: string | null = null
  try {
    const projectData = Array.isArray(contract.projects) ? contract.projects[0] : contract.projects
    const clientData = Array.isArray(contract.clients) ? contract.clients[0] : contract.clients

    const dateToday = new Date(signedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const pdfBytes = await generateContractPdf({
      contractBody: contract.body,
      projectName: projectData?.name ?? "",
      clientName: clientData?.name ?? signerName,
      clientDate: clientDate,
      signerName,
      signatureImage,
      signatureType,
      dateToday,
    })

    pdfBase64 = Buffer.from(pdfBytes).toString("base64")

    // Upload to Google Drive (non-blocking for response, but await for file ID)
    try {
      const projectId = contract.project_id
      const folderId = await getOrCreateProjectFolder(projectId, projectData?.name ?? projectId)
      const filename = `contract_${signerName.replace(/\s+/g, "_")}_${clientDate}.pdf`
      const stream = Readable.from(Buffer.from(pdfBytes))
      const driveId = await uploadFileToDrive(stream, filename, "application/pdf", folderId)
      await supabase
        .from("contracts")
        .update({ pdf_drive_id: driveId })
        .eq("id", contract.id)
    } catch {
      // Drive upload failure is non-fatal — client still gets PDF
    }
  } catch {
    // PDF generation failure is non-fatal — contract is still signed
  }

  // Notify admin
  try {
    const projectData = Array.isArray(contract.projects) ? contract.projects[0] : contract.projects
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shiraguiphotography.com"
    await sendContractSignedNotification({
      signerName,
      projectName: projectData?.name ?? "Unknown project",
      signedAt,
      photoRelease,
      adminProjectUrl: `${siteUrl}/admin/projects/${contract.project_id}/edit`,
    })
  } catch { /* non-fatal */ }

  return NextResponse.json({ ok: true, pdf: pdfBase64 })
}
