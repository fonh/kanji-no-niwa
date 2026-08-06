// Book Screen — route dédiée /lesson/<zone>/<seq> (issue 05).
//
// Choix de routage (documenté au board) : une route plein écran plutôt qu'un
// overlay dans MapClient — l'écran-livre est un écran dédié (PRD § Leçons),
// la route garde MapClient minimal (une redirection au lieu d'un état de
// plus) et donne gratuitement la reprise « page 1 » après interruption
// (aucun curseur stocké : recharger la route repart du début).
//
// La page serveur assemble tout (contenu + quiz) : le client ne lit jamais
// content/ ni src/data/kanji-content.json.

import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import {
  getGrammarPoint,
  getGrammarSourceEntry,
  getLessonsForZone,
  getQuestStepsIndex,
} from '@/lib/content'
import { buildGrammarPage, buildKanjiPages } from '@/lib/lesson-book'
import { buildLessonQuiz, type KanjiContentMap } from '@/lib/lesson-quiz'
import { isLessonCompleted, resolveLessonInteraction, withLessonQuestSteps } from '@/lib/lessons'
import { getPlayerState } from '@/lib/player-state'
import kanjiContent from '@/data/kanji-content.json'
import BookScreen from '../../BookScreen'

interface Props {
  params: Promise<{ zone: string; seq: string }>
}

export default async function LessonPage({ params }: Props) {
  const { zone, seq } = await params
  const session = await auth()
  if (!session?.user) redirect('/')

  const sequenceIndex = Number(seq)
  const lessons = getLessonsForZone(zone)
  const lesson = lessons.find(l => l.sequence_index === sequenceIndex)
  if (!lesson) notFound()

  const state = await getPlayerState(session.user.id)
  const ctx = {
    questSteps: withLessonQuestSteps(getQuestStepsIndex(), zone, lessons),
    now: new Date(),
  }

  // Accès : relecture d'une leçon complétée (sans quiz), ou EXACTEMENT la
  // leçon que la règle leçon-ou-blocage désigne comme disponible — tout le
  // reste retourne à la carte (l'URL ne contourne jamais l'ordre).
  const completed = isLessonCompleted(lesson, state)
  if (!completed) {
    const resolution = resolveLessonInteraction(lesson.npc_ref, lessons, state, ctx)
    if (resolution.kind !== 'lesson' || resolution.lesson.sequence_index !== sequenceIndex) {
      redirect('/map')
    }
  }

  const content = kanjiContent as KanjiContentMap
  const point = lesson.grammar_id ? getGrammarPoint(zone, lesson.grammar_id) : null
  const grammar = point ? buildGrammarPage(point, getGrammarSourceEntry(point)) : null

  return (
    <BookScreen
      lesson={{
        zoneId: zone,
        sequenceIndex,
        kanjiPages: buildKanjiPages(lesson.kanji_ids, content),
        grammar,
        quiz: completed ? null : buildLessonQuiz(lesson, content, point),
      }}
    />
  )
}
