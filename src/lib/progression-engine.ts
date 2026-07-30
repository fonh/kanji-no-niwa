export type TrainerRank = {
  level: number
  character: string
  rank: string
  minStudied: number
  maxStudied: number
}

const RANK_TABLE: TrainerRank[] = [
  { level: 1,  character: 'Gamin',          rank: 'NPC',                   minStudied: 0,    maxStudied: 49   },
  { level: 2,  character: 'Fillette',        rank: 'NPC',                   minStudied: 50,   maxStudied: 99   },
  { level: 3,  character: 'Attrapeur',       rank: 'Beginner Trainer',      minStudied: 100,  maxStudied: 149  },
  { level: 4,  character: 'Randonneur',      rank: 'Beginner Trainer',      minStudied: 150,  maxStudied: 199  },
  { level: 5,  character: 'Pêcheur',         rank: 'Beginner Trainer',      minStudied: 200,  maxStudied: 249  },
  { level: 6,  character: 'Campeur',         rank: 'Intermediate Trainer',  minStudied: 250,  maxStudied: 299  },
  { level: 7,  character: 'Marin',           rank: 'Intermediate Trainer',  minStudied: 300,  maxStudied: 369  },
  { level: 8,  character: 'Jongleur',        rank: 'Intermediate Trainer',  minStudied: 370,  maxStudied: 449  },
  { level: 9,  character: 'Sage',            rank: 'Advanced Trainer',      minStudied: 450,  maxStudied: 549  },
  { level: 10, character: 'Silver (Rival)',  rank: 'Rival',                 minStudied: 550,  maxStudied: 649  },
  { level: 11, character: 'Falkner',         rank: '師範 — Flying',         minStudied: 650,  maxStudied: 749  },
  { level: 12, character: 'Bugsy',           rank: '師範 — Bug',            minStudied: 750,  maxStudied: 849  },
  { level: 13, character: 'Whitney',         rank: '師範 — Normal',         minStudied: 850,  maxStudied: 949  },
  { level: 14, character: 'Morty',           rank: '師範 — Ghost',          minStudied: 950,  maxStudied: 1049 },
  { level: 15, character: 'Chuck',           rank: '師範 — Fighting',       minStudied: 1050, maxStudied: 1149 },
  { level: 16, character: 'Jasmine',         rank: '師範 — Steel',          minStudied: 1150, maxStudied: 1249 },
  { level: 17, character: 'Pryce',           rank: '師範 — Ice',            minStudied: 1250, maxStudied: 1349 },
  { level: 18, character: 'Clair',           rank: '師範 — Dragon',         minStudied: 1350, maxStudied: 1499 },
  { level: 19, character: 'Will',            rank: 'Elite Four — Psychic',  minStudied: 1500, maxStudied: 1649 },
  { level: 20, character: 'Koga',            rank: 'Elite Four — Poison',   minStudied: 1650, maxStudied: 1799 },
  { level: 21, character: 'Bruno',           rank: 'Elite Four — Fighting', minStudied: 1800, maxStudied: 1899 },
  { level: 22, character: 'Karen',           rank: 'Elite Four — Dark',     minStudied: 1900, maxStudied: 1999 },
  { level: 23, character: 'Lance',           rank: 'Champion of Johto',     minStudied: 2000, maxStudied: 2099 },
  { level: 24, character: 'Professor Elm',   rank: 'Pokémon Master',        minStudied: 2100, maxStudied: 2135 },
  { level: 25, character: 'Red',             rank: 'Legend',                minStudied: 2136, maxStudied: 2136 },
]

export function getTrainerRank(studiedCount: number): TrainerRank {
  for (let i = RANK_TABLE.length - 1; i >= 0; i--) {
    if (studiedCount >= RANK_TABLE[i].minStudied) {
      return RANK_TABLE[i]
    }
  }
  return RANK_TABLE[0]
}

export type KanjiInfo = {
  id: string
  jlptLevel: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | null
}

const JLPT_ORDER: Record<string, number> = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 }

export function getAvailableKanji(
  studiedSet: string[],
  allKanji: KanjiInfo[],
  componentGraph: Record<string, string[]>
): string[] {
  const studied = new Set(studiedSet)
  const available = allKanji.filter(k => {
    if (studied.has(k.id)) return false
    const components = componentGraph[k.id] ?? []
    return components.every(c => studied.has(c))
  })
  return available.sort((a, b) => {
    const pa = a.jlptLevel !== null ? (JLPT_ORDER[a.jlptLevel] ?? 5) : 6
    const pb = b.jlptLevel !== null ? (JLPT_ORDER[b.jlptLevel] ?? 5) : 6
    return pa - pb
  }).map(k => k.id)
}

export type Lesson = {
  id: string
  title: string
  bodyMarkdown: string
  johtoZone: string
  kanjiIds: string[]
  quizQuestions: unknown[]
}

// ── Battle mode selection ─────────────────────────────────────────────────────

export type QuestionMode =
  | 'sens'
  | 'lecture'
  | 'ecriture'
  | 'composition'
  | 'grammaire'
  | 'conjugaison'
  | 'traduction'
  | 'disposition'

export type BattleType = 'route' | 'boss'

export const BATTLE_WEIGHTS: Record<BattleType, Record<QuestionMode, number>> = {
  route: {
    sens: 0.28,
    lecture: 0.22,
    ecriture: 0.18,
    composition: 0.10,
    grammaire: 0.07,
    conjugaison: 0.07,
    traduction: 0.03,
    disposition: 0.05,
  },
  boss: {
    sens: 0.12,
    lecture: 0.12,
    ecriture: 0.10,
    composition: 0.05,
    grammaire: 0.13,
    conjugaison: 0.13,
    traduction: 0.05,
    disposition: 0.30,
  },
}

/**
 * Picks a question mode using weighted random selection.
 * Modes with no eligible content (grammar not yet encountered, no Disposition
 * sentences matching the player's studied set) have their weight redistributed
 * proportionally to the remaining modes.
 */
export function selectQuestionMode(
  battleType: BattleType,
  encounteredGrammarCount: number,
  hasDispositionSentences: boolean
): QuestionMode {
  const weights = { ...BATTLE_WEIGHTS[battleType] }

  if (encounteredGrammarCount < 5) {
    weights.grammaire = 0
    weights.conjugaison = 0
  }
  if (!hasDispositionSentences) {
    weights.disposition = 0
  }

  const total = Object.values(weights).reduce((s, w) => s + w, 0)
  const modes = Object.keys(weights) as QuestionMode[]
  for (const mode of modes) weights[mode] /= total

  const roll = Math.random()
  let cumulative = 0
  for (const mode of modes) {
    cumulative += weights[mode]
    if (roll < cumulative) return mode
  }
  return modes[0]
}

/**
 * Returns the sentence chunks in a random order (Fisher-Yates shuffle).
 * The caller validates the answer by comparing surface_form sequences.
 */
export function getDispositionChunks(chunks: string[]): string[] {
  const arr = [...chunks]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function getLessonQueue(
  availableKanji: string[],
  completedLessons: string[],
  allLessons: Lesson[],
  queuedKanji: string[]
): Lesson[] {
  const available = new Set(availableKanji)
  const queued = new Set(queuedKanji)
  const eligible = allLessons.filter(
    lesson =>
      !completedLessons.includes(lesson.id) &&
      lesson.kanjiIds.every(k => available.has(k))
  )
  const hasQueued = (lesson: Lesson) => lesson.kanjiIds.some(k => queued.has(k))
  return [...eligible.filter(hasQueued), ...eligible.filter(l => !hasQueued(l))]
}

// ── Boucle quotidienne SRS (issue 06) ─────────────────────────────────────────
//
// PRD § Boucle Quotidienne / § Système SRS. Le « jour » bascule à minuit,
// heure locale de l'appareil (offset client borné ±14 h, même approche que
// nextMorningDue de lessons.ts) ; toute ÉCRITURE qui matérialise le statut
// (daily_status, reviews.reviewed_at) est horodatée serveur. Le gate SRS
// n'est jamais une Condition (invariant de monotonie, PRD 02-D4) : l'issue
// 10 lit getDailySRSStatus.

/** Plafond de rattrapage : en backlog, le ✓ du jour s'obtient après 200
 * cartes notées ce jour calendaire local (PRD 03-D1). */
export const DAILY_CATCH_UP_CAP = 200

/** Offset client borné à ±14 h (fuseaux réels : UTC-12..+14). */
const MAX_TZ_OFFSET_MINUTES = 14 * 60

function clampTzOffset(tzOffsetMinutes: number): number {
  return Math.max(-MAX_TZ_OFFSET_MINUTES, Math.min(MAX_TZ_OFFSET_MINUTES, tzOffsetMinutes))
}

/** Jour calendaire local 'YYYY-MM-DD' du joueur. `tzOffsetMinutes` vient du
 * client (Date.getTimezoneOffset() : UTC − local, en minutes). */
export function localDayKey(serverNow: Date, tzOffsetMinutes: number): string {
  const offset = clampTzOffset(tzOffsetMinutes)
  const local = new Date(serverNow.getTime() - offset * 60_000)
  const y = local.getUTCFullYear()
  const m = String(local.getUTCMonth() + 1).padStart(2, '0')
  const d = String(local.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Le minuit local qui a ouvert le jour courant, sur l'axe serveur (borne
 * basse des reviews « d'aujourd'hui »). */
export function localDayStart(serverNow: Date, tzOffsetMinutes: number): Date {
  const offset = clampTzOffset(tzOffsetMinutes)
  const local = new Date(serverNow.getTime() - offset * 60_000)
  const localMidnightMs = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
  return new Date(localMidnightMs + offset * 60_000)
}

export interface DailySRSStatus {
  /** File du jour vidée OU plafond de rattrapage atteint ce jour local
   * (OU ✓ déjà posé dans daily_status — acquis jusqu'à la bascule). */
  sessionDone: boolean
  /** Cartes encore dues maintenant (en rattrapage plafonné : le reste du
   * backlog, qui s'étale sur les jours suivants). */
  cardsPending: number
  /** Cartes notées ce jour calendaire local. */
  reviewedToday: number
}

/** Statut SRS du jour — fonction pure (PRD § Implémentation :
 * getDailySRSStatus(srsReviews, dueCards, today)). L'issue 10 s'en sert
 * pour le gate d'entrée en nouvelle zone. */
export function getDailySRSStatus(
  srsReviews: { reviewed_at: string | Date }[],
  dueCards: { next_review_at: string | Date }[],
  today: { serverNow: Date; tzOffsetMinutes: number },
  /** ✓ déjà écrit dans daily_status pour ce jour : reste acquis même si de
   * nouvelles cartes deviennent éligibles entre-temps (PRD pt 4). */
  checkedToday = false
): DailySRSStatus {
  const { serverNow, tzOffsetMinutes } = today
  const todayKey = localDayKey(serverNow, tzOffsetMinutes)
  const reviewedToday = srsReviews.filter(
    r => localDayKey(new Date(r.reviewed_at), tzOffsetMinutes) === todayKey
  ).length
  const cardsPending = dueCards.filter(c => new Date(c.next_review_at) <= serverNow).length
  const sessionDone = checkedToday || cardsPending === 0 || reviewedToday >= DAILY_CATCH_UP_CAP
  return { sessionDone, cardsPending, reviewedToday }
}

/** File du jour : cartes dues + nouvelles cartes MÉLANGÉES en une seule file
 * (pas de bloc « reviews d'abord », PRD 03-D6), tronquée au quota restant du
 * plafond de rattrapage (200 − déjà notées ce jour). Fisher-Yates, rng
 * injectable pour les tests. Ne mute pas l'entrée. */
export function buildDailyQueue<T>(
  dueCards: T[],
  reviewedToday: number,
  rng: () => number = Math.random
): T[] {
  const arr = [...dueCards]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.slice(0, Math.max(0, DAILY_CATCH_UP_CAP - reviewedToday))
}

/** Préface Carte Mot (engine-contract § 8) : la toute première review d'un
 * mot (aucune review existante pour AUCUNE facette de ce mot) affiche
 * d'abord sa Carte Mot — état dérivé, aucune colonne nouvelle. Inactif au
 * jalon 1 (aucune carte word), mais le code le prévoit. */
export function needsWordCardPreface(
  card: { item_type: string; item_id: string },
  reviewedWordIds: ReadonlySet<string>
): boolean {
  return card.item_type === 'word' && !reviewedWordIds.has(card.item_id)
}
