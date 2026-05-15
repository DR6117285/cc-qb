# Phase 0 — Foundation

**Goal**: Auth + DB deployed on Railway. You can log in at your live URL and see your name.
**Time estimate**: Week 1

## Steps

```bash
# 1. Scaffold
npx create-next-app@latest lm-platform --typescript --tailwind --app
cd lm-platform

# 2. Install core deps
npm install prisma @prisma/client
npm install next-auth@beta
npm install zod

# 3. Init Prisma
npx prisma init

# 4. Railway setup
railway login
railway new
railway add postgres   # adds DATABASE_URL to env

# 5. Schema — User + Account only (Auth.js tables)
# Edit prisma/schema.prisma — see 01-database-schema.md for User model
npx prisma migrate dev --name init

# 6. Configure Auth.js
# app/api/auth/[...nextauth]/route.ts
# Use Google provider + SESSION_SECRET

# 7. Protected dashboard
# app/dashboard/page.tsx — RSC, redirect to /login if no session

# 8. Deploy
git push   # Railway auto-deploys
```

## Auth.js Minimal Config

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
})

export const { GET, POST } = handlers
```

## Environment Variables (Railway + local .env)

```
DATABASE_URL=           # from Railway postgres addon
NEXTAUTH_SECRET=        # generate with: openssl rand -base64 32
NEXTAUTH_URL=           # https://your-app.railway.app
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Done When

- [ ] `railway up` shows green
- [ ] Google login works at `/api/auth/signin`
- [ ] `/dashboard` shows "Welcome [your name]"
- [ ] `prisma studio` shows User table

**Do not proceed to Phase 1 until all four checks pass.**
