// Session SRS quotidienne (issue 06) — la page serveur assemble la file du
// jour via buildSessionQueue (src/app/study/session.ts, extrait de cette page
// à la revue M3 pour être partagé avec l'action continueSession : la file du
// jour peut être rechargée en cours de session quand une carte もういちど
// redevient due).
//
// Le fuseau du client arrive en query (?tz=, minutes Date.getTimezoneOffset),
// borné côté serveur par progression-engine ; défaut 0 en accès direct.

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { buildSessionQueue } from './session'
import StudyClient from './StudyClient'

interface Props {
  searchParams: Promise<{ tz?: string }>
}

export default async function StudyPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user) redirect('/')
  const userId = session.user.id

  const { tz } = await searchParams
  const tzOffsetMinutes = Number.parseInt(tz ?? '', 10) || 0
  const { cards, reviewedToday } = await buildSessionQueue(userId, tzOffsetMinutes)

  return <StudyClient cards={cards} reviewedToday={reviewedToday} />
}
