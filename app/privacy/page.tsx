import { redirect } from "next/navigation"

export default function PrivacyRedirect() {
  redirect("/policies/privacy-policy")
  return null
}
