// Règle leçon-ou-blocage + complétion + Carnet de leçons (issue 05) —
// logique pure, zéro I/O.
//
// Sémantique de référence : CONTEXT.md « Lesson NPC » / « Book Screen » /
// « Lesson Book », PRD § Leçons (« Ordre des leçons imposé », « Coupure
// aller-retour — mécanisme »).
//
// Le modèle : chaque zone porte une quête IMPLICITE `lessons-<zone_id>` dont
// les steps suivent les sequence_index du fichier content/lessons/<zone>.json
// (aucun fichier content/quests/ n'existe pour elle — ses steps sont dérivés
// ici et fusionnés dans le QuestStepsIndex via withLessonQuestSteps). L'étape
// courante = la dernière leçon complétée ; la « tête de la queue » est la
// suivante. À l'interaction avec un PNJ `role: lesson` :
//  - sa leçon n'est pas en tête (hors d'ordre)      → blocked (toujours) ;
//  - en tête mais unlock_conditions non remplies    → dialogue_ref ordinaire ;
//  - en tête et déverrouillée                       → écran-livre ;
//  - plus aucune leçon dans la zone / PNJ sans leçon → dialogue_ref ordinaire
//    (la relecture d'une leçon complétée passe par le Carnet, pas par le PNJ).

import { createEmptyCard } from 'ts-fsrs'
import {
  evalConditions,
  type EvalContext,
  type PlayerState,
  type QuestStepsIndex,
} from './condition-effect'
import type { LessonEntry } from './content'

// ── Identifiants de la quête implicite ────────────────────────────────────────

/** Quête implicite d'ordre des leçons d'une zone (PRD § Ordre des leçons). */
export function lessonQuestId(zoneId: string): string {
  return `lessons-${zoneId}`
}

/** Step de la quête implicite pour la leçon `sequence_index`. */
export function lessonStepId(sequenceIndex: number): string {
  return `lesson-${sequenceIndex}`
}

/** Entrée de user_map_state.completed_lessons[] pour une leçon. */
export function lessonId(zoneId: string, sequenceIndex: number): string {
  return `${zoneId}#${sequenceIndex}`
}

/** Steps ordonnés de la quête implicite, dérivés du fichier de leçons. */
export function lessonQuestSteps(lessons: LessonEntry[]): string[] {
  return [...lessons]
    .sort((a, b) => a.sequence_index - b.sequence_index)
    .map(lesson => lessonStepId(lesson.sequence_index))
}

/** QuestStepsIndex enrichi de la quête implicite de la zone (sans muter
 * l'index passé — il vient du cache module de content.ts). */
export function withLessonQuestSteps(
  index: QuestStepsIndex,
  zoneId: string,
  lessons: LessonEntry[]
): QuestStepsIndex {
  return { ...index, [lessonQuestId(zoneId)]: lessonQuestSteps(lessons) }
}

// ── Règle leçon-ou-blocage ────────────────────────────────────────────────────

/** La leçon en tête de la queue `lessons-<zone_id>` (la prochaine à jouer),
 * ou null si la zone est finie. Piloté par npc_quest_progress (source de
 * vérité de l'ordre), pas par completed_lessons[]. */
export function nextLessonInZone(lessons: LessonEntry[], state: PlayerState): LessonEntry | null {
  const sorted = [...lessons].sort((a, b) => a.sequence_index - b.sequence_index)
  if (sorted.length === 0) return null
  const progress = state.quest_progress[lessonQuestId(sorted[0].zone_id)]
  if (!progress) return sorted[0]
  const steps = lessonQuestSteps(sorted)
  const current = steps.indexOf(progress.current_step)
  return sorted[current + 1] ?? null
}

export type LessonResolution =
  | { kind: 'lesson'; lesson: LessonEntry }
  /** Hors d'ordre — ligne de blocage en boîte de dialogue (cône : push-back). */
  | { kind: 'blocked' }
  /** Le PNJ sert son dialogue_ref ordinaire (state_rules habituelles). */
  | { kind: 'fallback_dialogue' }

/** La règle moteur dérivée, à l'interaction avec un PNJ `role: lesson`
 * (CONTEXT.md « Lesson NPC ») — aucun champ nouveau, tout se lit dans
 * la progression existante. */
export function resolveLessonInteraction(
  npcRef: string,
  zoneLessons: LessonEntry[],
  state: PlayerState,
  ctx: EvalContext
): LessonResolution {
  const own = zoneLessons.filter(lesson => lesson.npc_ref === npcRef)
  if (own.length === 0) return { kind: 'fallback_dialogue' }

  const head = nextLessonInZone(zoneLessons, state)
  // Zone finie : le PNJ redevient un PNJ ordinaire (relecture via le Carnet)
  if (!head) return { kind: 'fallback_dialogue' }
  // Hors d'ordre : bloque toujours, même si la tête (d'un autre PNJ) est
  // elle-même verrouillée par ses unlock_conditions
  if (head.npc_ref !== npcRef) return { kind: 'blocked' }
  // Tête verrouillée par ses propres unlock_conditions (coupure
  // aller-retour d'Elm) : retombe sur le dialogue ordinaire, PAS un blocage
  if (!evalConditions(head.unlock_conditions ?? [], state, ctx)) {
    return { kind: 'fallback_dialogue' }
  }
  return { kind: 'lesson', lesson: head }
}

/** Une leçon déjà complétée (relecture sans quiz). */
export function isLessonCompleted(lesson: LessonEntry, state: PlayerState): boolean {
  return state.completed_lessons.includes(lessonId(lesson.zone_id, lesson.sequence_index))
}

// ── Timing des nouvelles cartes (PRD § Système SRS) ───────────────────────────

/** Offset client borné à ±14 h (fuseaux réels : UTC-12..+14). */
const MAX_TZ_OFFSET_MINUTES = 14 * 60

/** Due des nouvelles cartes : « à partir du lendemain, jamais le jour même »
 * — le prochain minuit LOCAL du joueur (le jour bascule à minuit local,
 * PRD § Jour calendaire). `tzOffsetMinutes` vient du client
 * (Date.getTimezoneOffset() : UTC − local, en minutes) ; l'horodatage de
 * l'écriture reste serveur. */
export function nextMorningDue(serverNow: Date, tzOffsetMinutes: number): Date {
  const offset = Math.max(-MAX_TZ_OFFSET_MINUTES, Math.min(MAX_TZ_OFFSET_MINUTES, tzOffsetMinutes))
  // Heure locale du joueur projetée sur l'axe UTC (pour lire Y/M/D locaux)
  const localMs = serverNow.getTime() - offset * 60_000
  const local = new Date(localMs)
  const nextLocalMidnightMs = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate() + 1
  )
  return new Date(nextLocalMidnightMs + offset * 60_000)
}

// ── Création des cartes SRS ───────────────────────────────────────────────────

export interface NewSrsCard {
  item_type: 'kanji'
  item_id: string
  facet: 'sens' | 'lecture'
  /** Colonne legacy card_type, gardée remplie pour les consommateurs
   * existants (page /study) tant que la bascule n'est pas finie. */
  card_type: 'meaning' | 'reading'
  /** Carte ts-fsrs New (jamais reviewée), due au lendemain matin. */
  fsrs_state: unknown
  next_review_at: string
}

const FACETS: { facet: 'sens' | 'lecture'; card_type: 'meaning' | 'reading' }[] = [
  { facet: 'sens', card_type: 'meaning' },
  { facet: 'lecture', card_type: 'reading' },
]

/** 2 cartes par kanji (facettes sens/lecture), FSRS init via ts-fsrs, dues
 * à `dueAt` (lendemain matin — jamais le jour même). La complétion de la
 * leçon est le moment où le kanji devient « étudié ». */
export function buildNewCards(kanjiIds: string[], now: Date, dueAt: Date): NewSrsCard[] {
  return kanjiIds.flatMap(kanjiId =>
    FACETS.map(({ facet, card_type }) => ({
      item_type: 'kanji' as const,
      item_id: kanjiId,
      facet,
      card_type,
      fsrs_state: createEmptyCard(dueAt),
      next_review_at: dueAt.toISOString(),
    }))
  )
}

// ── Carnet de leçons (menu START → レッスン, issue 09) ────────────────────────

export type LessonBookStatus = 'completed' | 'next' | 'locked' | 'masked'

export interface LessonBookLine {
  sequence_index: number
  status: LessonBookStatus
  /** Groupe de kanji — visible UNIQUEMENT une fois la leçon complétée
   * (pas de pré-teaching : le contenu ne se révèle qu'à la leçon). */
  kanji_ids: string[] | null
  /** Icône grammaire — visible uniquement si complétée. */
  grammar_id: string | null
  /** Qui donne la prochaine leçon (états next/locked) — jamais son contenu. */
  npc_ref: string | null
}

export interface LessonBookChapter {
  zone_id: string
  completed: number
  total: number
  lines: LessonBookLine[]
}

/** Table des matières du Carnet — lecture seule, zéro donnée nouvelle
 * (CONTEXT.md « Lesson Book »). L'appelant fournit les zones visitées dans
 * l'ordre du voyage avec leurs leçons (getLessonsForZone) ; ici on ne fait
 * que dériver les états depuis la progression existante. */
export function getLessonBook(
  zones: { zone_id: string; lessons: LessonEntry[] }[],
  state: PlayerState,
  ctx: EvalContext
): LessonBookChapter[] {
  return zones.map(({ zone_id, lessons }) => {
    const sorted = [...lessons].sort((a, b) => a.sequence_index - b.sequence_index)
    const head = nextLessonInZone(sorted, state)
    const lines: LessonBookLine[] = sorted.map(lesson => {
      if (isLessonCompleted(lesson, state)) {
        return {
          sequence_index: lesson.sequence_index,
          status: 'completed',
          kanji_ids: lesson.kanji_ids,
          grammar_id: lesson.grammar_id ?? null,
          npc_ref: lesson.npc_ref,
        }
      }
      if (head && lesson.sequence_index === head.sequence_index) {
        const unlocked = evalConditions(lesson.unlock_conditions ?? [], state, ctx)
        return {
          sequence_index: lesson.sequence_index,
          status: unlocked ? 'next' : 'locked',
          kanji_ids: null,
          grammar_id: null,
          npc_ref: lesson.npc_ref,
        }
      }
      return {
        sequence_index: lesson.sequence_index,
        status: 'masked',
        kanji_ids: null,
        grammar_id: null,
        npc_ref: null,
      }
    })
    return {
      zone_id,
      completed: lines.filter(l => l.status === 'completed').length,
      total: lines.length,
      lines,
    }
  })
}
