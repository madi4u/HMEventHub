import { redirect } from "next/navigation"

// Auth is handled by auth.hundm.cloud — middleware redirects automatically
export default function LoginPage() {
  const authUrl = process.env.AUTH_SERVICE_URL ?? "https://auth.hundm.cloud"
  redirect(`${authUrl}/login`)
}
