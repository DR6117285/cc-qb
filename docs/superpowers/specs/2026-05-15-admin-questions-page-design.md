# Design: Admin Questions Page

**Date:** 2026-05-15  
**Status:** Approved

## Goal

Build a protected `/admin/questions` page for the Lifestyle Medicine platform. Only users with `role = Admin` can access it. The page displays all 916 questions in a filterable table.

---

## Schema Change

Add a `Role` enum and `role` field to the `User` model:

```prisma
enum Role {
  Admin
  User
}

model User {
  // ...existing fields...
  role Role @default(User)
}
```

Migration name: `add-user-role`

After migrating, manually set the admin user's row to `Admin` in Railway via Prisma Studio or SQL.

---

## Role Protection

### `lib/auth-utils.ts`
Server-only utility. Exports `requireAdmin()`:
- Calls `auth()` from Auth.js
- Checks `session.user.role === "Admin"`
- Redirects to `/` if not admin or not authenticated

### `auth.ts` changes
Extend the Auth.js session callback to include `role` from the database user record. Augment the `Session` type via `declare module "next-auth"` so TypeScript knows `session.user.role` exists.

---

## Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Add `Role` enum + `role` field on `User` |
| `lib/auth-utils.ts` | `requireAdmin()` server utility |
| `auth.ts` | Session callback to expose `role` |
| `app/admin/questions/page.tsx` | RSC — admin check, Prisma query, table render |
| `app/admin/questions/filters.tsx` | Client component — filter form (GET submit) |

---

## Data Flow

```
Request
  → proxy.ts (auth check — redirect to sign-in if unauthenticated)
  → app/admin/questions/page.tsx
      → requireAdmin() (redirect to / if not Admin role)
      → read searchParams: { section?, tag?, q? }
      → Prisma query with AND filters
      → render table + filters.tsx
```

---

## Filters

Three filters, all URL search params:

| Param | UI | Prisma clause |
|-------|----|---------------|
| `section` | Dropdown (01–10 + All) | `sectionId: section` |
| `tag` | Dropdown (all tag slugs + All) | `tags: { some: { tag: { slug: tag } } }` |
| `q` | Text input | `questionText: { contains: q, mode: 'insensitive' }` |

Filters combine with `AND`. `filters.tsx` is a client component with a `<form method="GET">` — no JS required for submission.

---

## Table Columns

| Column | Value |
|--------|-------|
| ID | `question.id` |
| Section | `question.section.name` |
| Question | First 80 chars of `questionText` |
| Answer | Correct option text, highlighted green |

---

## Constraints

- No pagination in Phase 1 (916 rows is acceptable for a single admin)
- No edit/delete actions — read-only browse
- Filters are server-side only (no client-side JS filtering)
