import NextAuth, { type DefaultSession } from 'next-auth'
import Google from 'next-auth/providers/google'
import { sql } from '@/lib/db'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  trustHost: true, // required behind Vercel's proxy
  callbacks: {
    // Without a database adapter, Auth.js deliberately assigns `user.id` a
    // fresh random UUID on every sign-in (see @auth/core's oauth callback —
    // "the user's id is intentionally not set based on the profile id").
    // `profile.sub` is Google's actual stable subject claim and is what
    // `users.id` in Postgres must stay pinned to across sign-ins/devices.
    async signIn({ profile }) {
      if (!profile?.sub) return false
      await sql`insert into users (id) values (${profile.sub}) on conflict (id) do nothing`
      return true
    },
    async jwt({ token, account, profile }) {
      if (account && profile?.sub) token.sub = profile.sub
      return token
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
  },
})

// Every Server Action needs the session-derived user id, never a
// client-supplied one (Neon has no Row-Level-Security to fall back on — see
// docs/adr/0005-data-storage-neon-authjs.md). Centralized here so that check
// can't be pasted wrong or forgotten in a new action.
export async function requireUserId() {
  const session = await auth()
  if (!session?.user) throw new Error('Not authenticated')
  return session.user.id
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
    } & DefaultSession['user']
  }
}
