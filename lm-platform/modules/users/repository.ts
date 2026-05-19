import { prisma } from '@/lib/prisma'
import type { CandidateType } from '@prisma/client'

export async function findUserProfile(userId: string): Promise<{
  name: string | null
  email: string | null
  candidateType: CandidateType | null
} | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, candidateType: true },
  })
}

export async function updateCandidateType(
  userId: string,
  candidateType: CandidateType,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { candidateType },
  })
}
