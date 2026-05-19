'use server'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { submitAnswer, endSession, snapshotTimedScore } from '@/modules/quiz/service'

export async function submitAnswerAction(
  sessionId: string,
  questionId: string,
  position: number,
  formData: FormData,
) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const selectedKey = formData.get('selectedKey') as string
  if (!selectedKey) return

  await submitAnswer(sessionId, session.user.id, { questionId, selectedKey })

  redirect(`/quiz/${sessionId}?q=${position}`)
}

export async function endSessionAction(sessionId: string) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  await endSession(sessionId, session.user.id)

  redirect(`/quiz/${sessionId}/results`)
}

export async function snapshotTimedScoreAction(sessionId: string) {
  const session = await auth()
  if (!session?.user?.id) return null
  return snapshotTimedScore(sessionId, session.user.id)
}
