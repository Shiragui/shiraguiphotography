import { NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/auth"
import { createServiceClient } from "@/lib/supabase/service"
import { getFileStream } from "@/lib/drive"
import { Readable } from "stream"

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdminProfile()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()

  const { data: contract, error } = await supabase
    .from("contracts")
    .select("pdf_drive_id, signer_name, signed_at")
    .eq("project_id", id)
    .maybeSingle()

  if (error || !contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 })
  }

  if (!contract.pdf_drive_id) {
    return NextResponse.json({ error: "No PDF available for this contract" }, { status: 404 })
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
  const safeName = (contract.signer_name ?? "contract").replace(/\s+/g, "_")
  const filename = `${safeName}_contract_${safeDate}.pdf`

  const webStream = Readable.toWeb(driveStream) as ReadableStream

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  })
}
