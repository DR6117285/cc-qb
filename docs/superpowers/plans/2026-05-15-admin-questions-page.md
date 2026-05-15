# Admin Questions Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a role-protected `/admin/questions` page with section, tag, and free-text filters over the 916 seeded questions.

**Architecture:** Add a `Role` enum to the User model, expose it via the Auth.js session callback, and guard the admin page with a `requireAdmin()` server utility. The page is a Next.js RSC that reads URL search params, queries Prisma directly, and renders a table. Filters are a client component submitting a GET form.

**Tech Stack:** Next.js 16 App Router, Auth.js v5, Prisma 7, PostgreSQL (Railway), TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `lm-platform/prisma/schema.prisma` | Modify | Add `Role` enum + `role` field on `User` |
| `lm-platform/lib/auth-utils.ts` | Create | `requireAdmin()` server utility |
| `lm-platform/auth.ts` | Modify | Session callback to expose `role`; type augmentation |
| `lm-platform/app/admin/questions/filters.tsx` | Create | Client component — GET filter form |
| `lm-platform/app/admin/questions/page.tsx` | Create | RSC — auth check, Prisma query, table render |

---

## Task 1: Add Role enum to Prisma schema and migrate

**Files:**
- Modify: `lm-platform/prisma/schema.prisma`

- [ ] **Step 1: Add Role enum and field to schema**

Open `lm-platform/prisma/schema.prisma`. Add the enum after the `VerificationToken` model and add the `role` field to `User`:

```prisma
enum Role {
  Admin
  User
}
```

Add to the `User` model (after `createdAt`):
```prisma
role Role @default(User)
```

The full `User` model should look like:
```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  role          Role      @default(User)
  accounts      Account[]
  sessions      Session[]
}
```

- [ ] **Step 2: Run migration**

From `lm-platform/`:
```bash
npx prisma migrate dev --name add-user-role
```

Expected output:
```
✔ Generated Prisma Client
The following migration(s) have been created and applied from your prisma/schema file:
migrations/
  └─ 20260515xxxxxx_add_user_role/
    └─ migration.sql
```

- [ ] **Step 3: Set your user to Admin in Railway**

Open Prisma Studio (`npx prisma studio`) or run this SQL in Railway's query console:

```sql
UPDATE users SET role = 'Admin' WHERE email = 'saqibahmad@doctors.net.uk';
```

Verify: `SELECT email, role FROM users;` — should show `Admin` for your row.

- [ ] **Step 4: Commit**

```bash
git add lm-platform/prisma/schema.prisma lm-platform/prisma/migrations/
git commit -m "feat: add Role enum to User model"
```

---

## Task 2: Extend Auth.js session to expose role

**Files:**
- Modify: `lm-platform/auth.ts`

- [ ] **Step 1: Update auth.ts with session callback and type augmentation**

Replace the entire contents of `lm-platform/auth.ts` with:

```typescript
import NextAuth, { DefaultSession } from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

declare module "next-auth" {
  interface Session {
    user: {
      role: "Admin" | "User"
    } & DefaultSession["user"]
  }
  interface User {
    role: "Admin" | "User"
  }
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
  callbacks: {
    session({ session, user }) {
      session.user.role = user.role as "Admin" | "User"
      return session
    },
  },
})
```

- [ ] **Step 2: Verify dev server compiles without errors**

```bash
# In lm-platform/
npm run dev
```

Expected: `✓ Ready` with no TypeScript errors in the terminal.

- [ ] **Step 3: Commit**

```bash
git add lm-platform/auth.ts
git commit -m "feat: expose user role in Auth.js session"
```

---

## Task 3: Create requireAdmin() utility

**Files:**
- Create: `lm-platform/lib/auth-utils.ts`

- [ ] **Step 1: Create lib directory and utility**

```bash
mkdir -p lm-platform/lib
```

Create `lm-platform/lib/auth-utils.ts`:

```typescript
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== "Admin") {
    redirect("/")
  }
  return session
}
```

- [ ] **Step 2: Commit**

```bash
git add lm-platform/lib/auth-utils.ts
git commit -m "feat: add requireAdmin server utility"
```

---

## Task 4: Build filters client component

**Files:**
- Create: `lm-platform/app/admin/questions/filters.tsx`

This component renders a `<form method="GET">` with three inputs. On submit the browser navigates to the same URL with updated search params — no JS needed, but the `"use client"` directive is needed for controlled inputs.

- [ ] **Step 1: Create filters.tsx**

Create `lm-platform/app/admin/questions/filters.tsx`:

```typescript
"use client"

import { useRouter, useSearchParams } from "next/navigation"
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
```

- [ ] **Step 2: Commit**

```bash
git add lm-platform/app/admin/questions/filters.tsx
git commit -m "feat: add admin questions filter component"
```

---

## Task 5: Build admin questions page RSC

**Files:**
- Create: `lm-platform/app/admin/questions/page.tsx`

- [ ] **Step 1: Create page.tsx**

Create `lm-platform/app/admin/questions/page.tsx`:

```typescript
import { requireAdmin } from "@/lib/auth-utils"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import Filters from "./filters"
import { Suspense } from "react"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

type SearchParams = { section?: string; tag?: string; q?: string }

type Option = { key: string; text: string; isCorrect: boolean }

export default async function AdminQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()

  const { section, tag, q } = await searchParams

  const [sections, tags, questions] = await Promise.all([
    prisma.section.findMany({ orderBy: { id: "asc" } }),
    prisma.tag.findMany({ orderBy: { label: "asc" } }),
    prisma.question.findMany({
      where: {
        AND: [
          section ? { sectionId: section } : {},
          tag ? { tags: { some: { tag: { slug: tag } } } } : {},
          q ? { questionText: { contains: q, mode: "insensitive" } } : {},
        ],
      },
      include: { section: true },
      orderBy: { id: "asc" },
    }),
  ])

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Questions ({questions.length})</h1>

      <Suspense>
        <Filters sections={sections} tags={tags} />
      </Suspense>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border px-3 py-2 w-20">ID</th>
              <th className="border px-3 py-2 w-48">Section</th>
              <th className="border px-3 py-2">Question</th>
              <th className="border px-3 py-2 w-64">Correct Answer</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => {
              const correct = (q.options as Option[]).find((o) => o.isCorrect)
              return (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2 font-mono">{q.id}</td>
                  <td className="border px-3 py-2">{q.section.name}</td>
                  <td className="border px-3 py-2">
                    {q.questionText.slice(0, 80)}
                    {q.questionText.length > 80 ? "…" : ""}
                  </td>
                  <td className="border px-3 py-2 text-green-700 font-medium">
                    {correct ? `${correct.key}) ${correct.text}` : "—"}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {questions.length === 0 && (
          <p className="text-center text-gray-500 py-8">No questions match the current filters.</p>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add lm-platform/app/admin/questions/page.tsx
git commit -m "feat: add admin questions page RSC"
```

---

## Task 6: Verify end-to-end

- [ ] **Step 1: Start dev server**

```bash
cd lm-platform && npm run dev
```

- [ ] **Step 2: Visit /admin/questions while signed in as Admin**

Navigate to `http://localhost:3000/admin/questions`.

Expected: Table showing 916 questions, section column populated, correct answer in green.

- [ ] **Step 3: Test filters**

- Select a section from the dropdown — table should filter and URL should update (e.g. `?section=01`)
- Select a tag — table filters further
- Type in search box and click Search — filters by question text

- [ ] **Step 4: Test role protection**

Sign out, then navigate to `http://localhost:3000/admin/questions` directly.

Expected: Redirected to `/api/auth/signin` (by proxy.ts — not authenticated).

If signed in as a non-admin user (not possible right now but worth noting): redirect to `/`.

- [ ] **Step 5: Push to remote**

```bash
git push origin master
```
