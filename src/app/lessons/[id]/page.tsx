import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { sql } from '@/lib/db'
import LessonClient, { type Lesson } from './LessonClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LessonPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/')

  const [row] = await sql`
    select id, title, body_markdown, johto_zone, kanji_ids, quiz_questions
    from lessons where id = ${id}
  `

  if (!row) notFound()

  const lesson: Lesson = {
    id: row.id,
    title: row.title,
    body_markdown: row.body_markdown,
    johto_zone: row.johto_zone,
    kanji_ids: row.kanji_ids,
    quiz_questions: row.quiz_questions,
  }

  return <LessonClient lesson={lesson} />
}
