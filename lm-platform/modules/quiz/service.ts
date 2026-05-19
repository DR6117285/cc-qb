import { prisma } from '@/lib/prisma'
import { selectQuestions, selectWeightedQuestions, MOCK_EXAM_WEIGHTS, scaleWeights } from './selection'
import * as repo from './repository'
import type { QuestionOption, QuestionWithOptions } from './types'

export type QuestionView = {
  position: number
  questionId: string
  questionText: string
  options: QuestionOption[]
  answer: {
    selectedKey: string
    isCorrect: boolean
    correctKey: string
    rationale: string
    pageReference: string | null
  } | null
}

export type SessionView = {
  sessionId: string
  status: 'InProgress' | 'Completed'
  totalCount: number
  answeredCount: number
  createdAt: string        // ISO string — safe to pass as a React prop
  timeLimitSec: number | null
  timedScore: number | null
  timedAt: string | null   // ISO string
  questions: QuestionView[]
}

export async function getSessionView(sessionId: string, userId: string): Promise<SessionView> {
  const session = await repo.findSession(sessionId)
  if (!session) throw new Error('Session not found')
  if (session.userId !== userId) throw new Error('Forbidden')

  const raw = await repo.findSessionQuestionsWithAnswers(sessionId)

  const questions: QuestionView[] = raw.map((r) => {
    const options = r.options as QuestionOption[]
    const correctKey = options.find((o) => o.isCorrect)?.key ?? ''
    return {
      position: r.position,
      questionId: r.questionId,
      questionText: r.questionText,
      options,
      answer: r.answer
        ? { ...r.answer, correctKey, rationale: r.rationale, pageReference: r.pageReference }
        : null,
    }
  })

  return {
    sessionId,
    status: session.status as 'InProgress' | 'Completed',
    totalCount: session.totalCount,
    answeredCount: questions.filter((q) => q.answer !== null).length,
    createdAt: session.createdAt.toISOString(),
    timeLimitSec: session.timeLimitSec ?? null,
    timedScore: session.timedScore ?? null,
    timedAt: session.timedAt ? session.timedAt.toISOString() : null,
    questions,
  }
}

export type CreateSessionInput = {
  userId: string
  sectionId?: string
  count: number
  mode?: 'mock-exam'
}

export type SubmitAnswerInput = {
  questionId: string
  selectedKey: string
  timeSpentSec?: number
}

export type AnswerResult = {
  isCorrect: boolean
  correctKey: string
  rationale: string
  pageReference: string | null
  isLastQuestion: boolean
}

export type SessionResult = {
  score: number
  totalCount: number
}

export async function createSession(input: CreateSessionInput): Promise<{ sessionId: string }> {
  if (input.mode === 'mock-exam') {
    const candidateType = await repo.findUserCandidateType(input.userId)
    const target = candidateType === 'Physician' ? 150 : 120

    const scaledWeights = scaleWeights(MOCK_EXAM_WEIGHTS, target)

    const rawQuestions = await prisma.question.findMany({
      select: {
        id: true,
        questionText: true,
        rationale: true,
        pageReference: true,
        sectionId: true,
        options: true,
      },
    })

    const candidates: QuestionWithOptions[] = rawQuestions.map((q) => ({
      ...q,
      options: q.options as QuestionOption[],
    }))

    const selected = selectWeightedQuestions(candidates, scaledWeights)

    const session = await repo.createSession({
      userId: input.userId,
      questionIds: selected.map((q) => q.id),
      timeLimitSec: 14400,
    })

    return { sessionId: session.id }
  }

  const where = input.sectionId ? { sectionId: input.sectionId } : {}

  const rawQuestions = await prisma.question.findMany({
    where,
    select: {
      id: true,
      questionText: true,
      rationale: true,
      pageReference: true,
      sectionId: true,
      options: true,
    },
  })

  const candidates: QuestionWithOptions[] = rawQuestions.map((q) => ({
    ...q,
    options: q.options as QuestionOption[],
  }))

  if (candidates.length < input.count) {
    throw new Error(
      `Not enough questions: requested ${input.count}, available ${candidates.length}`,
    )
  }

  const selected = selectQuestions(candidates, { count: input.count, weighting: 'uniform' })

  const session = await repo.createSession({
    userId: input.userId,
    questionIds: selected.map((q) => q.id),
  })

  return { sessionId: session.id }
}

export async function submitAnswer(
  sessionId: string,
  userId: string,
  input: SubmitAnswerInput,
): Promise<AnswerResult> {
  const session = await repo.findSession(sessionId)
  if (!session) throw new Error('Session not found')
  if (session.userId !== userId) throw new Error('Forbidden')
  if (session.status === 'Completed') throw new Error('Session already completed')

  const sessionQuestion = await repo.findSessionQuestion(sessionId, input.questionId)
  if (!sessionQuestion) throw new Error('Question does not belong to this session')

  const existing = await repo.findAnswer(sessionId, input.questionId)
  if (existing) throw new Error('Question already answered')

  const question = await prisma.question.findUnique({
    where: { id: input.questionId },
    select: { options: true, rationale: true, pageReference: true },
  })
  if (!question) throw new Error('Question not found')

  const options = question.options as QuestionOption[]
  const correctKey = options.find((o) => o.isCorrect)?.key
  if (!correctKey) throw new Error('Question has no correct answer')

  const isCorrect = input.selectedKey === correctKey

  await repo.createAnswerAndUpsertProgress(
    {
      sessionId,
      questionId: input.questionId,
      selectedKey: input.selectedKey,
      isCorrect,
      timeSpentSec: input.timeSpentSec,
    },
    userId,
  )

  const answeredCount = await repo.countAnswers(sessionId)
  const isLastQuestion = answeredCount === session.totalCount

  return {
    isCorrect,
    correctKey,
    rationale: question.rationale,
    pageReference: question.pageReference,
    isLastQuestion,
  }
}

export async function endSession(
  sessionId: string,
  userId: string,
): Promise<SessionResult> {
  const session = await repo.findSession(sessionId)
  if (!session) throw new Error('Session not found')
  if (session.userId !== userId) throw new Error('Forbidden')
  if (session.status === 'Completed') {
    return { score: session.score ?? 0, totalCount: session.totalCount }
  }

  const score = await repo.countCorrectAnswers(sessionId)
  await repo.completeSession(sessionId, score)

  return { score, totalCount: session.totalCount }
}
