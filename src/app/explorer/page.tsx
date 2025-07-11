import { redirect } from "next/navigation"

export default function ExplorerPage() {
  // Redirect to home if accessed without search ID
  redirect("/")
}