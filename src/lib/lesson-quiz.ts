// Mini-quiz de fin de leçon (issue 05) — logique pure, rng injecté.
//
// PRD § Leçons « Mini-quiz » : 1 question par kanji enseigné (mode Sens OU
// Lecture, tiré au sort par kanji) + 1 question Grammaire si la leçon porte
// un point. Distracteurs = tirage global dans kanji-content (aucun besoin de
// studiedSet). Jamais de Saisie/Disposition/Écoute ici. Le quiz est une
// formalité, pas une porte : mauvaise réponse → on recommence la question
// (géré par l'UI), aucune conséquence hors de l'écran.
//
// engine-contract § 7 : `keyword` prioritaire sur meanings[0].
// engine-contract § 8 : l'ordre stocké ne reflète jamais la bonne réponse —
// les choix sont mélangés ici (rng) ET re-mélangés à l'affichage.

import type { GrammarOverlayPoint } from './content'

// ── Contenu kanji (src/data/kanji-content.json, LECTURE seule) ────────────────

export interface KanjiLessonExample {
  jp: string
  en: string
  audio_ref?: string | null
  source?: string
}

export interface KanjiContentEntry {
  jlpt?: string | null
  grade?: number | null
  meanings: string[]
  on: string[]
  kun: string[]
  /** Mot-clé anglais éditorialisé — prioritaire sur meanings[0] (§ 7). */
  keyword?: string | null
  /** Emoji du concept, nullable — jamais de match forcé. */
  icon_ref?: string | null
  audio?: string | null
  etymology?: string
  mnemonic?: string
  lesson_examples?: KanjiLessonExample[]
}

export type KanjiContentMap = Record<string, KanjiContentEntry>

type MeaningSource = Pick<KanjiContentEntry, 'meanings' | 'keyword'>
type ReadingSource = Pick<KanjiContentEntry, 'on' | 'kun'>

/** Mot-clé affiché/testé : keyword prioritaire, fallback meanings[0]. */
export function primaryMeaning(entry: MeaningSource): string {
  return entry.keyword ?? entry.meanings[0] ?? ''
}

/** Lecture principale : on[0] (katakana), sinon kun[0] débarrassée de son
 * okurigana (`ひと.つ` → ひとつ, `ひと-` → ひと). */
export function primaryReading(entry: ReadingSource): string {
  const raw = entry.on[0] ?? entry.kun[0] ?? ''
  return raw.replace(/[.\-]/g, '')
}

// ── Questions ─────────────────────────────────────────────────────────────────

export interface LessonQuizQuestion {
  kind: 'sens' | 'lecture' | 'grammaire'
  /** Le kanji (sens/lecture) ou la phrase à trou jp_cloze (grammaire). */
  prompt: string
  /** 4 choix ; choices[correct_index] est la bonne réponse. L'UI re-mélange
   * l'ordre affiché à chaque tentative (contrat § 8). */
  choices: string[]
  correct_index: number
}

type Rng = () => number

/** 3 distracteurs uniques ≠ correct, tirés au hasard dans le pool global. */
function drawDistractors(correct: string, pool: string[], rng: Rng): string[] {
  const candidates = Array.from(new Set(pool)).filter(v => v !== '' && v !== correct)
  const drawn: string[] = []
  while (drawn.length < 3 && candidates.length > 0) {
    const [value] = candidates.splice(Math.floor(rng() * candidates.length), 1)
    drawn.push(value)
  }
  return drawn
}

/** Fisher-Yates avec rng injecté — les choix stockés partent déjà mélangés. */
function shuffleChoices(correct: string, distractors: string[], rng: Rng) {
  const choices = [correct, ...distractors]
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[choices[i], choices[j]] = [choices[j], choices[i]]
  }
  return { choices, correct_index: choices.indexOf(correct) }
}

export interface QuizLesson {
  kanji_ids: string[]
  grammar_id?: string
}

/** Construit le mini-quiz d'une leçon. `grammarPoint` = le point de l'overlay
 * de zone si la leçon en porte un (null sinon). */
export function buildLessonQuiz(
  lesson: QuizLesson,
  content: KanjiContentMap,
  grammarPoint: GrammarOverlayPoint | null,
  rng: Rng = Math.random
): LessonQuizQuestion[] {
  const allEntries = Object.values(content)
  const meaningPool = allEntries.map(primaryMeaning)
  const readingPool = allEntries.map(primaryReading)

  const questions: LessonQuizQuestion[] = lesson.kanji_ids.map(kanjiId => {
    const entry = content[kanjiId]
    const kind: 'sens' | 'lecture' = rng() < 0.5 ? 'sens' : 'lecture'
    const correct = kind === 'sens' ? primaryMeaning(entry) : primaryReading(entry)
    const pool = kind === 'sens' ? meaningPool : readingPool
    const { choices, correct_index } = shuffleChoices(
      correct,
      drawDistractors(correct, pool, rng),
      rng
    )
    return { kind, prompt: kanjiId, choices, correct_index }
  })

  if (grammarPoint && grammarPoint.selected_examples.length > 0) {
    const example =
      grammarPoint.selected_examples[
        Math.floor(rng() * grammarPoint.selected_examples.length)
      ]
    const { choices, correct_index } = shuffleChoices(
      example.point_answer,
      example.distractors.slice(0, 3),
      rng
    )
    questions.push({ kind: 'grammaire', prompt: example.jp_cloze, choices, correct_index })
  }

  return questions
}
