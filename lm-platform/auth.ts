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
      session.user.id = user.id
      session.user.role = user.role as "Admin" | "User"
      return session
    },
  },
})
