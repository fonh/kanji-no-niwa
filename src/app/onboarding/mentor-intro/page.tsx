import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import MentorIntroClient from './MentorIntroClient'

export default async function MentorIntroPage() {
  const session = await auth()
  if (!session?.user) redirect('/')

  const [[dialogue], [lesson]] = await Promise.all([
    sql`
      select body_markdown from dialogues
      where trigger_type = 'onboarding' and trigger_ref = 'intro'
    `,
    sql`select id, title from lessons limit 1`,
  ])

  return (
    <MentorIntroClient
      dialogueText={dialogue?.body_markdown ?? ''}
      firstLessonId={lesson?.id ?? ''}
    />
  )
}
