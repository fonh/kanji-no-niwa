import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import FukudaIntroClient from './FukudaIntroClient'

export default async function FukudaIntroPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: dialogue } = await supabase
    .from('dialogues')
    .select('body_markdown')
    .eq('trigger_type', 'onboarding')
    .eq('trigger_ref', 'intro')
    .single()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('id, title')
    .limit(1)
    .single()

  return (
    <FukudaIntroClient
      dialogueText={dialogue?.body_markdown ?? ''}
      firstLessonId={lesson?.id ?? ''}
    />
  )
}
