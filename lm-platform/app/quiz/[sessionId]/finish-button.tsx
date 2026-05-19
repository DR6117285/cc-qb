'use client'

type Props = {
  unanswered: number
  action: () => Promise<void>
}

export function FinishButton({ unanswered, action }: Props) {
  const hasUnanswered = unanswered > 0

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (hasUnanswered) {
      const ok = confirm(
        `You have ${unanswered} unanswered question${unanswered !== 1 ? 's' : ''}. Finish anyway?`,
      )
      if (!ok) e.preventDefault()
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {hasUnanswered && (
        <p className="text-xs text-amber-600">
          {unanswered} question{unanswered !== 1 ? 's' : ''} unanswered
        </p>
      )}
      <form action={action}>
        <button
          type="submit"
          onClick={handleClick}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Finish Quiz
        </button>
      </form>
    </div>
  )
}
