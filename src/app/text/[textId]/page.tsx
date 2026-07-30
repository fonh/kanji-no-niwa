// Fenêtre de lecture — route dédiée /text/<text_id> (issue 08).
//
// Même choix de routage que le Book Screen (issue 05, documenté au board) :
// une route plein écran plutôt qu'un overlay — MapClient reste minimal (une
// redirection) et la page serveur assemble tout (le client ne lit jamais
// content/). Accès : le texte doit être RÉELLEMENT débloqué pour ce joueur
// (unlocked_texts[], posé par un Effect de dialogue ou par l'émission moteur
// d'interactWithNpc) — l'URL ne contourne jamais le gate unlock_text.

import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getTextById } from '@/lib/content'
import { getPlayerState } from '@/lib/player-state'
import { documentKindForText } from '@/lib/text-quiz'
import TextReader from '../TextReader'

interface Props {
  params: Promise<{ textId: string }>
}

export default async function TextPage({ params }: Props) {
  const { textId } = await params
  const session = await auth()
  if (!session?.user) redirect('/')

  const text = getTextById(textId)
  if (!text) notFound()

  const state = await getPlayerState(session.user.id)
  if (!state.unlocked_texts.includes(textId)) redirect('/map')

  return (
    <TextReader
      data={{
        textId: text.text_id,
        titleJp: text.title.jp,
        jpText: text.jp_text,
        enText: text.en_text,
        docKind: documentKindForText(text.text_id, text.found_object_ref),
        questions: text.questions.map(q => ({
          promptJp: q.prompt.jp,
          options: q.options,
          correctIndex: q.correct_index,
          answerSpan: q.answer_span,
        })),
      }}
    />
  )
}
