import { redirect } from "next/navigation"

export default function TermsRedirect() {
  redirect("/policies/terms-of-service")
  return null
}
