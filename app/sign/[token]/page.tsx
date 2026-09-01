import { createServiceClient } from "@/lib/supabase/service"
import { ContractSignForm } from "@/components/gallery/ContractSignForm"

type Params = { params: Promise<{ token: string }> }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default async function SignContractPage({ params }: Params) {
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
      sign_token,
      projects(name),
      clients(name)
    `)
    .eq("sign_token", token)
    .maybeSingle()

  // If not found
  if (error || !contract) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#fff", fontFamily: "'Georgia', serif" }}>
          <p style={{ fontSize: "1.1rem", color: "#888", letterSpacing: "0.05em" }}>
            Contract not found
          </p>
          <p style={{ color: "#555", fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Please check the link in your email.
          </p>
        </div>
      </div>
    )
  }

  // If draft — not yet sent
  if (contract.status === "draft") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center", color: "#fff", fontFamily: "'Georgia', serif" }}>
          <p style={{ fontSize: "1.1rem", color: "#888", letterSpacing: "0.05em" }}>
            This contract hasn&apos;t been sent yet.
          </p>
          <p style={{ color: "#555", fontSize: "0.9rem", marginTop: "0.5rem" }}>
            Your photographer will send it when it&apos;s ready.
          </p>
        </div>
      </div>
    )
  }

  const projectData = Array.isArray(contract.projects) ? contract.projects[0] : contract.projects
  const clientData = Array.isArray(contract.clients) ? contract.clients[0] : contract.clients
  const projectName = projectData?.name ?? "Your Session"
  const clientName = clientData?.name ?? "Client"

  // If already signed — show confirmation, no form
  if (contract.status === "signed") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: "100%",
            textAlign: "center",
            fontFamily: "'Georgia', serif",
          }}
        >
          <p
            style={{
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              color: "#888",
              textTransform: "uppercase",
              marginBottom: "2rem",
            }}
          >
            Shira Gui Photography
          </p>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "2.5rem",
            }}
          >
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "#16a34a", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Contract Signed
            </p>
            <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.4rem", fontWeight: 400, color: "#1a1a1a" }}>
              Photography Services Agreement
            </h1>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.9rem", color: "#888" }}>
              {projectName}
            </p>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#374151", lineHeight: 1.6 }}>
              This contract was signed by{" "}
              <strong>{contract.signer_name}</strong>
              {contract.signed_at ? ` on ${formatDate(contract.signed_at)}` : ""}.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Mark as viewed if currently 'sent' (server-side, no await needed for render)
  if (contract.status === "sent") {
    supabase.from("contracts").update({ status: "viewed" }).eq("id", contract.id)
  }

  // sent or viewed — show signing form
  return (
    <ContractSignForm
      token={token}
      contractBody={contract.body}
      projectName={projectName}
      clientName={clientName}
    />
  )
}
