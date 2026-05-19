import * as repo from './repository'
import type { CandidateType } from '@prisma/client'

export type UserProfile = {
  name: string | null
  email: string | null
  candidateType: CandidateType | null
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return repo.findUserProfile(userId)
}

export async function updateCandidateType(
  userId: string,
  candidateType: CandidateType,
): Promise<void> {
  return repo.updateCandidateType(userId, candidateType)
}
