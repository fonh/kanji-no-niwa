'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'

// Doesn't redirect itself — a server action that both writes and redirects
// is awkward to call from a client try/catch (the redirect throws internally
// and would be swallowed by the caller's `catch`). The client navigates on
// success instead.
export async function saveTrainerName(name: string) {
  const session = await auth()
  if (!session?.user) redirect('/')

  const trimmed = name.trim()
  if (!trimmed) return

  await sql`update users set trainer_name = ${trimmed} where id = ${session.user.id}`
}
