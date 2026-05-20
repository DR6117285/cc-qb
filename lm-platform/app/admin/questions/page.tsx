import { requireAdmin } from "@/lib/auth-utils"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import Filters from "./filters"
import { Suspense } from "react"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

type SearchParams = { section?: string; tag?: string; q?: string }

type Option = { key: string; text: string; isCorrect: boolean }

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()

  const { section, tag, q } = await searchParams

  const [sections, tags, questions] = await Promise.all([
    prisma.section.findMany({ orderBy: { id: "asc" } }),
    prisma.tag.findMany({ orderBy: { label: "asc" } }),
    prisma.question.findMany({
      where: {
        AND: [
          section ? { sectionId: section } : {},
          tag ? { tags: { some: { tag: { slug: tag } } } } : {},
          q ? { questionText: { contains: q, mode: "insensitive" } } : {},
        ],
      },
      include: { section: true },
      orderBy: { id: "asc" },
    }),
  ])

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Questions ({questions.length})</h1>

      <Suspense>
        <Filters sections={sections} tags={tags} />
      </Suspense>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border px-3 py-2 w-20">ID</th>
              <th className="border px-3 py-2 w-48">Section</th>
              <th className="border px-3 py-2">Question</th>
              <th className="border px-3 py-2 w-64">Correct Answer</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const correct = (q.options as Option[]).find((o) => o.isCorrect)
              return (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2 font-mono">{q.id}</td>
                  <td className="border px-3 py-2">{q.section.name}</td>
                  <td className="border px-3 py-2">
                    {q.questionText.slice(0, 80)}
                    {q.questionText.length > 80 ? "…" : ""}
                  </td>
                  <td className="border px-3 py-2 text-green-700 font-medium">
                    {correct ? `${correct.key}) ${correct.text}` : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {questions.length === 0 && (
          <p className="text-center text-gray-500 py-8">No questions match the current filters.</p>
        )}
      </div>
    </main>
  )
}
