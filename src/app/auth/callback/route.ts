import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure a users row exists
      await supabase.from('users').upsert({ id: data.user.id }, { onConflict: 'id', ignoreDuplicates: true })

      const { data: profile } = await supabase
        .from('users')
        .select('trainer_name')
        .eq('id', data.user.id)
        .single()

      if (!profile?.trainer_name) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`)
}
