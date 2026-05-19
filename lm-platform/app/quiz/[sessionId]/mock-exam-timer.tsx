'use client'

import { useEffect, useState } from 'react'
import { snapshotTimedScoreAction, endSessionAction } from './actions'

type Props = {
  sessionId: string
  createdAtIso: string
  timeLimitSec: number
}

type Modal = {
  timedScore: number
  answeredCount: number
  totalCount: number
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function MockExamTimer({ sessionId, createdAtIso, timeLimitSec }: Props) {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [modal, setModal] = useState<Modal | null>(null)
  const [continuing, setContinuing] = useState(false)

  useEffect(() => {
    const expiresAt = new Date(createdAtIso).getTime() + timeLimitSec * 1000

    let id: ReturnType<typeof setInterval>

    const tick = () => {
      const diff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
      setRemaining(diff)
      if (diff === 0) {
        clearInterval(id)
        snapshotTimedScoreAction(sessionId).then((result) => {
          if (result) setModal(result)
        })
      }
    }

    tick()
    id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [sessionId, createdAtIso, timeLimitSec])

  if (continuing || remaining === null) return null

  return (
    <>
      <span
        className={`text-sm font-mono tabular-nums ${
          remaining < 300 ? 'text-red-600 font-semibold' : 'text-gray-500'
        }`}
      >
        {formatTime(remaining)} remaining
      </span>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="rounded-2xl bg-white p-8 shadow-xl w-full max-w-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Time&apos;s up</h2>
            <p className="text-sm text-gray-600 mb-1">
              You answered {modal.answeredCount} of {modal.totalCount} questions.
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Timed score:{' '}
              <span className="font-semibold text-gray-900">
                {modal.timedScore} / {modal.totalCount}
              </span>
            </p>
            <p className="text-sm text-gray-700 mb-6">
              Would you like to continue and finish the remaining questions without a timer?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setContinuing(true)}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Continue
              </button>
              <button
                onClick={async () => { await endSessionAction(sessionId) }}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                End Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
