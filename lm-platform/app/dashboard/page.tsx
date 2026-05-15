import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/api/auth/signin")
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-xl">Welcome, {session.user?.name}</p>
    </main>
  )
}
