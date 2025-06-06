import { redirect } from "next/navigation"

export default function HomePage() {
  redirect("/policies")
  // This component will not render anything as the redirect happens on the server.
  // However, Next.js requires a default export for a page component.
  return null
}
