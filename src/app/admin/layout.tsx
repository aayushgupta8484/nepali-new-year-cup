import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-lg font-semibold">Admin</h2>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <a
            href="/admin"
            className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
          >
            Tournaments
          </a>
          <a
            href="/admin/tournaments/new"
            className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
          >
            Create New
          </a>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
