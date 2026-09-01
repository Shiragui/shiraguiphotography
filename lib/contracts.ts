import { randomBytes } from "crypto"

export function generateSignToken(): string {
  return randomBytes(32).toString("base64url")
}

export function renderContract(body: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
    body
  )
}
