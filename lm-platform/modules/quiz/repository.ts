import { prisma } from '@/lib/prisma'
import type { QuizSession, QuizAnswer, UserQuestionProgress, CandidateType } from '@prisma/client'

export type CreateSessionInput = {
  userId: string
  questionIds: string[]
  timeLimitSec?: number
}

export async function createSession(input: CreateSessionInput): Promise<QuizSession> {
  return prisma.quizSession.create({
    data: {
      userId: input.userId,
      totalCount: input.questionIds.length,
      timeLimitSec: input.timeLimitSec ?? null,
      questions: {
        create: input.questionIds.map((questionId, position) => ({ questionId, position })),
      },
    },
  })
}

export async function findSession(sessionId: string): Promise<QuizSession | null> {
  return prisma.quizSession.findUnique({ where: { id: sessionId } })
}

export async function findUserCandidateType(userId: string): Promise<CandidateType | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { candidateType: true },
  })
  return user?.candidateType ?? null
}

export async function findSessionQuestion(
  sessionId: string,
  questionId: string,
): Promise<{ questionId: string; position: number } | null> {
  return prisma.quizSessionQuestion.findUnique({
    where: { sessionId_questionId: { sessionId, questionId } },
  })
}

export async function findAnswer(
  sessionId: string,
  questionId: string,
): Promise<QuizAnswer | null> {
  return prisma.quizAnswer.findUnique({
    where: { sessionId_questionId: { sessionId, questionId } },
  })
}

export type CreateAnswerInput = {
  sessionId: string
  questionId: string
  selectedKey: string
  isCorrect: boolean
  timeSpentSec?: number
}

export async function createAnswerAndUpsertProgress(
  input: CreateAnswerInput,
  userId: string,
): Promise<QuizAnswer> {
  const [answer] = await prisma.$transaction([
    prisma.quizAnswer.create({
      data: {
        sessionId: input.sessionId,
        questionId: input.questionId,
        selectedKey: input.selectedKey,
        isCorrect: input.isCorrect,
        timeSpentSec: input.timeSpentSec ?? null,
      },
    }),
    prisma.userQuestionProgress.upsert({
      where: { userId_questionId: { userId, questionId: input.questionId } },
      create: {
        userId,
        questionId: input.questionId,
        timesAnswered: 1,
        timesCorrect: input.isCorrect ? 1 : 0,
      },
      update: {
        timesAnswered: { increment: 1 },
        timesCorrect: { increment: input.isCorrect ? 1 : 0 },
      },
    }),
  ])
  return answer
}

export async function countAnswers(sessionId: string): Promise<number> {
  return prisma.quizAnswer.count({ where: { sessionId } })
}

export async function countCorrectAnswers(sessionId: string): Promise<number> {
  return prisma.quizAnswer.count({ where: { sessionId, isCorrect: true } })
}

export async function completeSession(
  sessionId: string,
  score: number,
): Promise<QuizSession> {
  return prisma.quizSession.update({
    where: { id: sessionId },
    data: { status: 'Completed', score, completedAt: new Date() },
  })
}

export async function findSessionQuestionIds(sessionId: string): Promise<string[]> {
  const rows = await prisma.quizSessionQuestion.findMany({
    where: { sessionId },
    orderBy: { position: 'asc' },
    select: { questionId: true },
  })
  return rows.map((r) => r.questionId)
}

export type RawSessionQuestion = {
  position: number
  questionId: string
  questionText: string
  options: unknown
  rationale: string
  pageReference: string | null
  answer: { selectedKey: string; isCorrect: boolean } | null
}

export async function findSessionQuestionsWithAnswers(
  sessionId: string,
): Promise<RawSessionQuestion[]> {
  const sessionQuestions = await prisma.quizSessionQuestion.findMany({
    where: { sessionId },
    orderBy: { position: 'asc' },
    select: { questionId: true, position: true },
  })

  const questionIds = sessionQuestions.map((sq) => sq.questionId)

  const [questions, answers] = await Promise.all([
    prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, questionText: true, options: true, rationale: true, pageReference: true },
    }),
    prisma.quizAnswer.findMany({
      where: { sessionId, questionId: { in: questionIds } },
      select: { questionId: true, selectedKey: true, isCorrect: true },
    }),
  ])

  const questionMap = new Map(questions.map((q) => [q.id, q]))
  const answerMap = new Map(answers.map((a) => [a.questionId, a]))

  return sessionQuestions.map((sq) => {
    const q = questionMap.get(sq.questionId)!
    const a = answerMap.get(sq.questionId) ?? null
    return {
      position: sq.position,
      questionId: sq.questionId,
      questionText: q.questionText,
      options: q.options,
      rationale: q.rationale,
      pageReference: q.pageReference,
      answer: a ? { selectedKey: a.selectedKey, isCorrect: a.isCorrect } : null,
    }
  })
}
