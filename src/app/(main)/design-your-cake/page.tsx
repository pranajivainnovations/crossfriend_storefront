import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function DesignYourCakeRedirectPage() {
  redirect("/ai-cake-studio")
}
