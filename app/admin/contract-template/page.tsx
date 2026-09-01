import { redirect } from "next/navigation"
import { getAdminProfile } from "@/lib/auth"
import { createServiceClient } from "@/lib/supabase/service"
import { ContractTemplateEditor } from "@/components/admin/ContractTemplateEditor"

export default async function ContractTemplatePage() {
  const profile = await getAdminProfile()
  if (!profile) redirect("/admin/login")

  const supabase = createServiceClient()

  const { data: template } = await supabase
    .from("contract_templates")
    .select("id, name, body")
    .eq("is_default", true)
    .maybeSingle()

  return (
    <div style={{ display: "grid", gap: "1rem", maxWidth: 800 }}>
      <div>
        <h1 style={{ marginBottom: "0.25rem" }}>Contract template</h1>
        <p style={{ margin: 0, color: "#6b7680", fontSize: "0.9rem" }}>
          Edit the default contract template. Use{" "}
          <code style={{ background: "#f0f0f0", padding: "0.1rem 0.3rem", borderRadius: 4 }}>
            {"{{variable}}"}
          </code>{" "}
          placeholders — they are substituted when a contract is created for a project.
        </p>
      </div>
      <ContractTemplateEditor initialBody={template?.body ?? ""} />
    </div>
  )
}
