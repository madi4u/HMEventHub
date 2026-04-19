import { redirect } from "next/navigation"

// Middleware handles auth — redirect directly to app
export default function LoginPage() {
  redirect('/events')
}
