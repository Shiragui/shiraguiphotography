import { NextResponse } from "next/server";
import { requireAdminProfile } from "@/lib/auth";

export async function withAdminAuth(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    await requireAdminProfile();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handler();
}
