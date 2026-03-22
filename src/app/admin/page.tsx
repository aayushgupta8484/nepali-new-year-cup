import { createServerClient } from "@/lib/supabase/server"

type Tournament = {
  id: string
  name: string
  year: number
  slug: string
  status: string
}

export default async function AdminPage() {
  const supabase = await createServerClient()

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name, year, slug, status")
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tournaments</h1>
        <a
          href="/admin/tournaments/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create New
        </a>
      </div>
      <ul className="space-y-2">
        {(tournaments ?? []).map((t: Tournament) => (
          <li
            key={t.id}
            className="flex items-center justify-between p-4 bg-white border rounded-md"
          >
            <a
              href={`/admin/tournaments/${t.slug}`}
              className="font-medium hover:underline"
            >
              {t.name}
            </a>
            <span className="text-sm text-gray-500">{t.status}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
