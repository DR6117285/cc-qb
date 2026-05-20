"use client"

import { useSearchParams } from "next/navigation"
import { useRef } from "react"

type Props = {
  sections: { id: string; name: string }[]
  tags: { slug: string; label: string }[]
}

export default function Filters({ sections, tags }: Props) {
  const searchParams = useSearchParams()
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} method="GET" className="flex flex-wrap gap-3 mb-6">
      <select
        name="section"
        defaultValue={searchParams.get("section") ?? ""}
        onChange={() => formRef.current?.submit()}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="">All sections</option>
        {sections.map((s) => (
          <option key={s.id} value={s.id}>
            {s.id} — {s.name}
          </option>
        ))}
      </select>

      <select
        name="tag"
        defaultValue={searchParams.get("tag") ?? ""}
        onChange={() => formRef.current?.submit()}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="">All tags</option>
        {tags.map((t) => (
          <option key={t.slug} value={t.slug}>
            {t.label}
          </option>
        ))}
      </select>

      <input
        name="q"
        type="search"
        defaultValue={searchParams.get("q") ?? ""}
        placeholder="Search question text…"
        className="border rounded px-2 py-1 text-sm w-64"
      />

      <button type="submit" className="border rounded px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200">
        Search
      </button>
    </form>
  )
}
