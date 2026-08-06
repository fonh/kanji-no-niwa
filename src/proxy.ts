import { NextResponse, type NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function proxy(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Unauthenticated → sign-in page
  if (!session?.user && pathname !== '/' && !pathname.startsWith('/api/auth')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Authenticated on sign-in page → onboarding (no trainer name yet) or the
  // map. Only queried here, once, on the single "just landed on /" transition
  // — not on every request.
  if (session?.user && pathname === '/') {
    const [profile] = await sql`select trainer_name from users where id = ${session.user.id}`
    const dest = profile?.trainer_name ? '/map' : '/onboarding'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)'],
}
