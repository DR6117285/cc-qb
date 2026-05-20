import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getOverallStats, getSectionScores, getRecentSessions } from '@/modules/analytics/service'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/api/auth/signin')

  const userId = session.user.id

  const [stats, sectionScores, recentSessions] = await Promise.all([
    getOverallStats(userId),
    getSectionScores(userId),
    getRecentSessions(userId),
  ])

  if (stats.totalAnswered === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-2xl bg-white p-10 shadow-sm text-center max-w-sm">
          <p className="text-lg font-semibold text-gray-800 mb-2">No data yet</p>
          <p className="text-sm text-gray-500 mb-6">Complete a quiz to see your progress here.</p>
          <a
            href="/quiz/new"
            className="inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Start a Quiz
          </a>
        </div>
      </main>
    )
  }

  const accuracyPct = Math.round(stats.overallAccuracy * 100)

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-5 shadow-sm text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Overall Accuracy</p>
            <p className={`text-3xl font-bold ${accuracyPct >= 70 ? 'text-green-600' : accuracyPct >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {accuracyPct}%
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Questions Answered</p>
            <p className="text-3xl font-bold text-gray-800">{stats.totalAnswered}</p>
          </div>
          <div className="rounded-xl bg-white p-5 shadow-sm text-center">
            <p className="text-xs font-medium text-gray-500 mb-1">Sessions This Week</p>
            <p className="text-3xl font-bold text-gray-800">{stats.sessionsThisWeek}</p>
          </div>
        </div>

        {/* Two-column panel */}
        <div className="grid grid-cols-2 gap-4">

          {/* Section breakdown */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Section Breakdown</h2>
            {sectionScores.length === 0 ? (
              <p className="text-sm text-gray-400">No section data yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left pb-2 font-medium">Section</th>
                    <th className="text-right pb-2 font-medium">Attempted</th>
                    <th className="text-right pb-2 font-medium">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sectionScores.map((s) => {
                    const pct = Math.round(s.accuracy * 100)
                    const dot = pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    return (
                      <tr key={s.sectionId}>
                        <td className="py-2 text-gray-700 pr-2">{s.sectionName}</td>
                        <td className="py-2 text-right text-gray-500">{s.questionsAttempted}</td>
                        <td className="py-2 text-right">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
                            <span className="text-gray-700">{pct}%</span>
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent sessions */}
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Recent Sessions</h2>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-gray-400">No completed sessions yet.</p>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((s) => {
                  const barColor =
                    s.accuracyPct >= 70
                      ? 'bg-green-500'
                      : s.accuracyPct >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  const date = s.completedAt.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })
                  return (
                    <div key={s.sessionId}>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{date}</span>
                        <span>{s.score}/{s.totalCount} · {s.accuracyPct}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-100">
                        <div
                          className={`h-2 rounded-full ${barColor}`}
                          style={{ width: `${s.accuracyPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* Nav */}
        <div className="flex gap-3">
          <a href="/quiz/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Start Quiz
          </a>
        </div>

      </div>
    </main>
  )
}
