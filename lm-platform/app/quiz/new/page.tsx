import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { startQuizAction } from './actions'
import { getUserProfile } from '@/modules/users/service'

export default async function NewQuizPage() {
  const session = await auth()
  if (!session) redirect('/api/auth/signin')

  const userProfile = session.user.id ? await getUserProfile(session.user.id) : null
  const mockExamCount = userProfile?.candidateType === 'Physician' ? 150 : 120

  const sections = await prisma.section.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-sm">
        <div>
          <h1 className="mb-1 text-2xl font-semibold text-gray-900">Start a Quiz</h1>
          <p className="text-sm text-gray-500">Choose a section and question count</p>
        </div>

        <form action={startQuizAction} className="space-y-5">
          <div>
            <label htmlFor="sectionId" className="mb-1 block text-sm font-medium text-gray-700">
              Section
            </label>
            <select
              id="sectionId"
              name="sectionId"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All sections</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="count" className="mb-1 block text-sm font-medium text-gray-700">
              Number of questions
            </label>
            <input
              id="count"
              name="count"
              type="number"
              min={1}
              max={200}
              defaultValue={10}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Quiz
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400">
            <span className="bg-white px-2">or</span>
          </div>
        </div>

        <form action={startQuizAction}>
          <input type="hidden" name="mode" value="mock-exam" />
          <button
            type="submit"
            className="w-full rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start Mock Exam
            <span className="ml-2 text-xs font-normal text-gray-400">
              {mockExamCount} questions · 4 hours · board-weighted
            </span>
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          Wrong count?{' '}
          <a href="/profile" className="text-blue-500 hover:underline">
            Update your candidate type
          </a>
        </p>
      </div>
    </main>
  )
}
