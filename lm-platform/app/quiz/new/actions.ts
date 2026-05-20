'use server'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { createSession } from '@/modules/quiz/service'

export async function startQuizAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const rawMode = formData.get('mode')
  const mode = rawMode === 'mock-exam' ? 'mock-exam' as const : undefined

  const sectionIds = formData.getAll('sectionId').map(String).filter(Boolean)
  const count = parseInt(formData.get('count') as string, 10)

  if (!mode && (!count || count < 1 || count > 200)) {
    throw new Error('Invalid question count')
  }

  const { sessionId } = await createSession({
    userId: session.user.id,
    sectionIds: sectionIds.length > 0 ? sectionIds : undefined,
    count: count || 200,
    mode,
  })

  redirect(`/quiz/${sessionId}`)
}
