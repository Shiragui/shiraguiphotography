import { Suspense } from "react";
import AdminLoginPage from "./AdminLoginPage";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading...</div>}>
      <AdminLoginPage />
    </Suspense>
  );
}
