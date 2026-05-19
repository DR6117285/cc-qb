import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getSessionView } from '@/modules/quiz/service'

type Props = {
  params: Promise<{ sessionId: string }>
}

export default async function QuizResultsPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const { sessionId } = await params
  const view = await getSessionView(sessionId, session.user.id)

  const correct = view.questions.filter((q) => q.answer?.isCorrect).length
  const total = view.totalCount
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0

  const scoreColor =
    pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4 space-y-6">

        {/* Score card */}
        <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
          <p className="text-sm font-medium text-gray-500 mb-1">Your Score</p>
          <p className={`text-6xl font-bold ${scoreColor}`}>{pct}%</p>
          <p className="mt-2 text-gray-600 text-sm">{correct} / {total} correct</p>

          {view.timedScore !== null && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 text-left space-y-1">
              <p>
                <span className="font-medium">Timed score</span>{' '}
                <span className="text-gray-500">(within 4 hours):</span>{' '}
                <span className="font-semibold">{view.timedScore} / {total}</span>
              </p>
              <p>
                <span className="font-medium">Final score</span>{' '}
                <span className="text-gray-500">(all answers):</span>{' '}
                <span className="font-semibold">{correct} / {total}</span>
              </p>
            </div>
          )}

          <div className="mt-6 h-3 w-full rounded-full bg-gray-200">
            <div
              className={`h-3 rounded-full transition-all ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <a
            href="/quiz/new"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Start New Quiz
          </a>
        </div>

        {/* Question breakdown */}
        <div className="space-y-3">
          {view.questions.map((q) => {
            const answered = q.answer !== null
            const correct = q.answer?.isCorrect ?? false

            return (
              <div
                key={q.questionId}
                className="rounded-xl bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 shrink-0 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-white ${
                      !answered ? 'bg-gray-400' : correct ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  >
                    {!answered ? '–' : correct ? '✓' : '✗'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 font-medium leading-snug">
                      {q.questionText}
                    </p>

                    {q.answer && (
                      <div className="mt-3 space-y-1">
                        {q.options.map((opt) => {
                          const isSelected = opt.key === q.answer!.selectedKey
                          const isCorrect = opt.key === q.answer!.correctKey
                          let cls = 'text-xs px-3 py-1.5 rounded-lg border '
                          if (isCorrect) cls += 'border-green-300 bg-green-50 text-green-800'
                          else if (isSelected) cls += 'border-red-300 bg-red-50 text-red-800'
                          else cls += 'border-transparent text-gray-500'

                          return (
                            <div key={opt.key} className={cls}>
                              <span className="font-semibold">{opt.key}.</span> {opt.text}
                            </div>
                          )
                        })}

                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                          <span className="font-semibold">Explanation: </span>
                          {q.answer.rationale}
                          {q.answer.pageReference && (
                            <span className="ml-2 text-gray-400">({q.answer.pageReference})</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </main>
  )
}
