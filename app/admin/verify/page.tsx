import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getAdminProfile } from "@/lib/auth"
import { Suspense } from "react"
import VerifyPage from "./VerifyPage"

export default async function Page() {
  const profile = await getAdminProfile()
  if (!profile) redirect("/admin/login")

  const cookieStore = await cookies()
  if (cookieStore.get("sg_2fa")?.value === "1") redirect("/admin")

  return (
    <Suspense>
      <VerifyPage />
    </Suspense>
  )
}
