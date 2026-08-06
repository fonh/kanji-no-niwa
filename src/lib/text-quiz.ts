// Quiz des textes progressifs (issue 08) — logique pure, zéro I/O.
//
// PRD § Textes Progressifs :
//  - quiz obligatoire retry-jusqu'à-correct : une mauvaise réponse rejoue la
//    MÊME question, jamais de skip ;
//  - `text_completions.score` = % de questions réussies en PREMIÈRE tentative
//    (seule définition qui ait un sens sous retry-jusqu'à-correct) ;
//  - doré (`gold_at`) = une passe intégralement sans faute, première lecture
//    OU relecture (quiz remélangé) ;
//  - scaffolding : après un 2ᵉ échec sur une question portant `answer_span`,
//    le passage correspondant est surligné dans le texte.
//
// La progression est un objet JSON-sérialisable : la fenêtre de lecture la
// range dans sessionStorage pour que la réouverture DANS la même session
// reprenne à la question courante (décision jalon 1 — aucun état persisté
// serveur, voir le commentaire de TextReader).

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AnswerSpan {
  start: number
  end: number
}

export interface TextQuizProgress {
  questionCount: number
  /** Question courante (== questionCount quand le quiz est fini). */
  questionIndex: number
  /** Échecs sur la question courante (déclenche le scaffolding à 2). */
  failsOnCurrent: number
  /** Une entrée par question passée : réussie en première tentative ? */
  firstTryCorrect: boolean[]
  done: boolean
}

// ── Progression retry-jusqu'à-correct ────────────────────────────────────────

export function startTextQuiz(questionCount: number): TextQuizProgress {
  return {
    questionCount,
    questionIndex: 0,
    failsOnCurrent: 0,
    firstTryCorrect: [],
    done: questionCount === 0,
  }
}

/** Une réponse à la question courante. Bonne → question suivante ; mauvaise →
 * la MÊME question (retry). Inerte (même objet) une fois le quiz fini. */
export function answerTextQuestion(p: TextQuizProgress, correct: boolean): TextQuizProgress {
  if (p.done) return p
  if (!correct) {
    return { ...p, failsOnCurrent: p.failsOnCurrent + 1 }
  }
  const firstTryCorrect = [...p.firstTryCorrect, p.failsOnCurrent === 0]
  const questionIndex = p.questionIndex + 1
  return {
    ...p,
    questionIndex,
    failsOnCurrent: 0,
    firstTryCorrect,
    done: questionIndex >= p.questionCount,
  }
}

/** Score première-tentative (0..100, arrondi). 100 par convention sur un quiz
 * vide — jamais NaN. */
export function quizScore(p: TextQuizProgress): number {
  if (p.firstTryCorrect.length === 0) return 100
  const right = p.firstTryCorrect.filter(Boolean).length
  return Math.round((100 * right) / p.firstTryCorrect.length)
}

/** Doré : la passe entière s'est jouée sans AUCUNE erreur (y compris les
 * retries — une question ratée puis réussie casse le doré). */
export function isFlawless(p: TextQuizProgress): boolean {
  return p.done && p.failsOnCurrent === 0 && p.firstTryCorrect.every(Boolean)
}

/** Scaffolding : à partir du 2ᵉ échec sur la question courante, si elle porte
 * un answer_span. */
export function shouldScaffold(
  p: TextQuizProgress,
  span: AnswerSpan | null | undefined
): boolean {
  return span != null && p.failsOnCurrent >= 2
}

// ── Surlignage du passage ────────────────────────────────────────────────────

export interface HighlightParts {
  before: string
  highlighted: string
  after: string
}

/** Découpe le jp_text BRUT (lectures inline comprises — les answer_span du
 * contenu sont indexés dessus et tombent sur des frontières de segments,
 * vérifié sur les fichiers réels) en trois parties rendables séparément. */
export function splitForHighlight(jp: string, span: AnswerSpan): HighlightParts {
  const start = Math.max(0, Math.min(span.start, jp.length))
  const end = Math.max(start, Math.min(span.end, jp.length))
  return {
    before: jp.slice(0, start),
    highlighted: jp.slice(start, end),
    after: jp.slice(end),
  }
}

// ── Reprise dans la même session ─────────────────────────────────────────────

/** Valide un blob (sessionStorage) contre le quiz courant ; null si corrompu
 * ou si le nombre de questions ne correspond plus. */
export function restoreTextQuiz(raw: unknown, questionCount: number): TextQuizProgress | null {
  if (typeof raw !== 'object' || raw === null) return null
  const p = raw as Record<string, unknown>
  if (
    p.questionCount !== questionCount ||
    typeof p.questionIndex !== 'number' ||
    typeof p.failsOnCurrent !== 'number' ||
    typeof p.done !== 'boolean' ||
    !Array.isArray(p.firstTryCorrect) ||
    !p.firstTryCorrect.every(v => typeof v === 'boolean')
  ) {
    return null
  }
  if (
    p.questionIndex < 0 ||
    p.questionIndex > questionCount ||
    p.failsOnCurrent < 0 ||
    p.firstTryCorrect.length !== p.questionIndex
  ) {
    return null
  }
  return {
    questionCount,
    questionIndex: p.questionIndex,
    failsOnCurrent: p.failsOnCurrent,
    firstTryCorrect: p.firstTryCorrect as boolean[],
    done: p.done,
  }
}

// ── Type de document (texture de la fenêtre de lecture) ──────────────────────

export type DocumentKind = 'letter' | 'sign' | 'scroll'

/** Aucun champ de type de document n'existe dans les fichiers texte (format
 * vérifié) : le type est DÉDUIT du text_id / found_object_ref — lettre
 * (mail, letter, note), panneau (sign, inscription, kanban), parchemin
 * (défaut : livres, légendes, rouleaux). À remplacer par un vrai champ de
 * contenu si la passe contenu en ajoute un. */
export function documentKindForText(
  textId: string,
  foundObjectRef?: string | null
): DocumentKind {
  const haystack = `${textId} ${foundObjectRef ?? ''}`
  if (/sign|inscription|kanban/.test(haystack)) return 'sign'
  if (/mail|letter|note/.test(haystack)) return 'letter'
  return 'scroll'
}
