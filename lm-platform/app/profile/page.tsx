import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { updateCandidateTypeAction } from './actions'

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, candidateType: true },
  })

  const candidateType = user?.candidateType ?? null

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-md px-4">
        <div className="rounded-2xl bg-white p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
            {user?.email && (
              <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            )}
          </div>

          <form action={updateCandidateTypeAction} className="space-y-5">
            <div>
              <label htmlFor="candidateType" className="mb-1 block text-sm font-medium text-gray-700">
                Candidate type
              </label>
              <p className="mb-2 text-xs text-gray-500">
                This determines how many questions appear in your mock exam (150 for Physicians, 120 for others).
              </p>
              <select
                id="candidateType"
                name="candidateType"
                defaultValue={candidateType ?? ''}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="" disabled>Select your candidate type</option>
                <option value="Physician">Physician (MD/DO) — 150 questions</option>
                <option value="Professional">Professional (Masters/PhD) — 120 questions</option>
                <option value="Practitioner">Practitioner (Degree level) — 120 questions</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
