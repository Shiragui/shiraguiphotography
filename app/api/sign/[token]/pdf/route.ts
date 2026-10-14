import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getFileStream, nodeToWebStream, safeContentDispositionFilename } from "@/lib/drive"

type Params = { params: Promise<{ token: string }> }

// Public — no login required. Possession of the sign token is the access
// control here, same as the rest of the public sign/gallery flow.
export async function GET(_request: Request, { params }: Params) {
  const { token } = await params
  const supabase = createServiceClient()

  const { data: contract, error } = await supabase
    .from("contracts")
    .select("status, signer_name, signed_at, pdf_drive_id")
    .eq("sign_token", token)
    .maybeSingle()

  if (error || !contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 })
  }

  if (contract.status !== "signed" || !contract.pdf_drive_id) {
    return NextResponse.json({ error: "Signed PDF not available for this contract" }, { status: 404 })
  }

  let driveStream
  try {
    driveStream = await getFileStream(contract.pdf_drive_id)
  } catch (err) {
    console.error(`Failed to fetch contract PDF from Drive (file ${contract.pdf_drive_id}):`, err)
    return NextResponse.json({ error: "This contract's PDF could not be loaded from storage" }, { status: 502 })
  }

  const safeDate = contract.signed_at
    ? new Date(contract.signed_at).toISOString().slice(0, 10)
    : "signed"
  const safeName = safeContentDispositionFilename(contract.signer_name ?? "contract")
  const filename = `${safeName}_contract_${safeDate}.pdf`

  const webStream = nodeToWebStream(driveStream)

  return new NextResponse(webStream as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  })
}
