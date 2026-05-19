import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getSessionView } from '@/modules/quiz/service'
import { submitAnswerAction, endSessionAction } from './actions'
import { FinishButton } from './finish-button'
import { MockExamTimer } from './mock-exam-timer'

type Props = {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ q?: string }>
}

export default async function QuizSessionPage({ params, searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const { sessionId } = await params
  const { q } = await searchParams
  const position = Math.max(0, parseInt(q ?? '0', 10) || 0)

  const view = await getSessionView(sessionId, session.user.id)

  if (view.status === 'Completed') redirect(`/quiz/${sessionId}/results`)

  const question = view.questions[position]
  if (!question) redirect(`/quiz/${sessionId}?q=0`)

  const isFirst = position === 0
  const isLast = position === view.totalCount - 1
  const allAnswered = view.answeredCount === view.totalCount

  const submitWithContext = submitAnswerAction.bind(
    null,
    sessionId,
    question.questionId,
    position,
  )

  const endWithContext = endSessionAction.bind(null, sessionId)

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">

        {/* Progress */}
        <div className="mb-6">
          <div className="mb-1 flex justify-between text-sm text-gray-500">
            <span>Question {position + 1} of {view.totalCount}</span>
            <div className="flex items-center gap-4">
              {view.timeLimitSec && (
                <MockExamTimer
                  sessionId={sessionId}
                  createdAtIso={view.createdAt}
                  timeLimitSec={view.timeLimitSec}
                />
              )}
              <span>{view.answeredCount} answered</span>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${(view.answeredCount / view.totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="mb-6 text-base font-medium text-gray-900 leading-relaxed">
            {question.questionText}
          </p>

          {question.answer ? (
            /* Already answered — show feedback */
            <div className="space-y-2">
              {question.options.map((opt) => {
                const isSelected = opt.key === question.answer!.selectedKey
                const isCorrect = opt.key === question.answer!.correctKey
                let cls =
                  'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm '
                if (isCorrect) cls += 'border-green-400 bg-green-50 text-green-800'
                else if (isSelected && !isCorrect) cls += 'border-red-400 bg-red-50 text-red-800'
                else cls += 'border-gray-200 text-gray-600'

                return (
                  <div key={opt.key} className={cls}>
                    <span className="font-semibold shrink-0">{opt.key}.</span>
                    <span>{opt.text}</span>
                  </div>
                )
              })}

              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-semibold mb-1">Explanation</p>
                <p>{question.answer.rationale}</p>
                {question.answer.pageReference && (
                  <p className="mt-1 text-blue-600 text-xs">Ref: {question.answer.pageReference}</p>
                )}
              </div>
            </div>
          ) : (
            /* Not yet answered — show form */
            <form action={submitWithContext} className="space-y-2">
              {question.options.map((opt) => (
                <label
                  key={opt.key}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm hover:border-blue-400 hover:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
                >
                  <input
                    type="radio"
                    name="selectedKey"
                    value={opt.key}
                    className="mt-0.5 accent-blue-600"
                    required
                  />
                  <span>
                    <span className="font-semibold">{opt.key}.</span> {opt.text}
                  </span>
                </label>
              ))}

              <button
                type="submit"
                className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Submit Answer
              </button>
            </form>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isFirst && (
              <a
                href={`/quiz/${sessionId}?q=${position - 1}`}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                ← Previous
              </a>
            )}
            {!isLast && (
              <a
                href={`/quiz/${sessionId}?q=${position + 1}`}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Next →
              </a>
            )}
          </div>

          <FinishButton
            unanswered={view.totalCount - view.answeredCount}
            action={endWithContext}
          />
        </div>

      </div>
    </main>
  )
}
