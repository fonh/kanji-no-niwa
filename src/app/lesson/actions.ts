'use server'

// Complétion d'une leçon (issue 05) — LA server action qui fait entrer un
// kanji dans studiedSet (PRD § Timing des nouvelles cartes) :
//   1. re-validation serveur (seule la leçon en tête, déverrouillée, se
//      complète — ne jamais faire confiance au client) ;
//   2. 2 cartes par kanji (facettes sens/lecture), FSRS init ts-fsrs, dues
//      au prochain minuit local du joueur (fuseau passé par le client,
//      horodatage de l'écriture côté serveur) ;
//   3. advance_quest sur la quête implicite lessons-<zone_id> + ajout à
//      completed_lessons[] ;
//   4. upsert grammar_encounters (first_seen) si la leçon porte un point.
// Idempotente de bout en bout : rejouer une leçon complétée ne réécrit rien
// (cartes en on conflict do nothing, Effects déjà idempotents, relecture
// sans quiz côté UI).

import { requireUserId } from '@/lib/auth'
import { sql } from '@/lib/db'
import { applyEffect } from '@/lib/condition-effect'
import { getLessonsForZone, getQuestStepsIndex } from '@/lib/content'
import { getPlayerState, savePlayerState } from '@/lib/player-state'
import {
  buildNewCards,
  lessonId,
  lessonQuestId,
  lessonStepId,
  nextMorningDue,
  resolveLessonInteraction,
  withLessonQuestSteps,
} from '@/lib/lessons'

export interface CompleteLessonResult {
  completed: boolean
}

export async function completeLesson(
  zoneId: string,
  sequenceIndex: number,
  /** Date.getTimezoneOffset() du client — borné côté serveur (lessons.ts). */
  tzOffsetMinutes: number
): Promise<CompleteLessonResult> {
  const userId = await requireUserId()
  const lessons = getLessonsForZone(zoneId)
  const lesson = lessons.find(l => l.sequence_index === sequenceIndex)
  if (!lesson) return { completed: false }

  const state = await getPlayerState(userId)
  const id = lessonId(zoneId, sequenceIndex)
  // Relecture d'une leçon déjà complétée : no-op (aucun quiz côté UI, et
  // même si l'action est rappelée, rien n'est réécrit)
  if (state.completed_lessons.includes(id)) return { completed: true }

  const now = new Date()
  const questSteps = withLessonQuestSteps(getQuestStepsIndex(), zoneId, lessons)
  const ctx = { questSteps, now }

  // Re-validation : la règle leçon-ou-blocage doit désigner EXACTEMENT
  // cette leçon comme disponible pour ce joueur
  const resolution = resolveLessonInteraction(lesson.npc_ref, lessons, state, ctx)
  if (resolution.kind !== 'lesson' || resolution.lesson.sequence_index !== sequenceIndex) {
    return { completed: false }
  }

  // 1. Cartes SRS — dues à partir du lendemain (jamais le jour même)
  const dueAt = nextMorningDue(now, tzOffsetMinutes)
  for (const card of buildNewCards(lesson.kanji_ids, now, dueAt)) {
    await sql`
      insert into cards (user_id, kanji_id, card_type, item_type, item_id, facet, fsrs_state, next_review_at)
      values (
        ${userId}, ${card.item_id}, ${card.card_type}, ${card.item_type},
        ${card.item_id}, ${card.facet}, ${JSON.stringify(card.fsrs_state)},
        ${card.next_review_at}
      )
      on conflict (user_id, item_type, item_id, facet) do nothing
    `
  }

  // 2. Progression : quête implicite + completed_lessons[]
  let next = applyEffect(
    { type: 'advance_quest', quest_id: lessonQuestId(zoneId), step_id: lessonStepId(sequenceIndex) },
    state,
    ctx
  )
  if (!next.completed_lessons.includes(id)) {
    next = { ...next, completed_lessons: [...next.completed_lessons, id] }
  }
  if (next !== state) await savePlayerState(userId, next)

  // 3. Grammaire rencontrée (first_seen — la grammaire ne rejoint pas le SRS)
  if (lesson.grammar_id) {
    await sql`
      insert into grammar_encounters (user_id, grammar_id)
      values (${userId}, ${lesson.grammar_id})
      on conflict (user_id, grammar_id) do nothing
    `
  }

  return { completed: true }
}
