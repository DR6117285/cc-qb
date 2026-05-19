'use server'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import type { CandidateType } from '@prisma/client'
import { updateCandidateType } from '@/modules/users/service'

const VALID_TYPES: CandidateType[] = ['Physician', 'Professional', 'Practitioner']

export async function updateCandidateTypeAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const raw = formData.get('candidateType') as string
  if (!VALID_TYPES.includes(raw as CandidateType)) {
    throw new Error('Invalid candidate type')
  }

  await updateCandidateType(session.user.id, raw as CandidateType)

  redirect('/profile')
}
