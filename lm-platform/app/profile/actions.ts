'use server'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { CandidateType } from '@prisma/client'

const VALID_TYPES: CandidateType[] = ['Physician', 'Professional', 'Practitioner']

export async function updateCandidateTypeAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const raw = formData.get('candidateType') as string
  if (!VALID_TYPES.includes(raw as CandidateType)) {
    throw new Error('Invalid candidate type')
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { candidateType: raw as CandidateType },
  })

  redirect('/profile')
}
