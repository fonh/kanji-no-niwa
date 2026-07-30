// Moteur de combat minimal (issue 07) — logique pure, zéro I/O, rng injecté.
//
// Choix d'implémentation (documenté au board) : module dédié plutôt qu'une
// extension de progression-engine.ts — le bloc « battle mode selection »
// qui y vivait était un prototype d'avant le PRD courant (poids obsolètes,
// garde grammaire < 5 au lieu de == 0, Math.random en dur) sans aucun
// consommateur ; il est supprimé au profit de ce module.
//
// Références :
// - PRD § Système de Combat — Barres de HP : vies N = max(2, ceil(q × 0.10)),
//   la N-ième erreur est fatale ; correction affichée puis question suivante.
// - PRD § Dresseurs de Route : pool = items étudiés, fenêtre des 50 derniers,
//   70 % fenêtre / 30 % historique complet (ratio annulé si < 50).
// - PRD § Pas de répétition de contenu : pool locale au combat sans remise,
//   remise si épuisée.
// - PRD § Modes indisponibles : gardes d'exclusion + redistribution
//   proportionnelle À CHAQUE tirage (pas en début de combat).
// - engine-contract § 8 : mélange des choix (à la construction ET à
//   l'affichage — l'affichage re-mélange dans BattleScreen).
//
// Les items étudiés du jalon 1 sont les kanji des leçons complétées
// (dérivés de completed_lessons[] + fichiers content/lessons/<zone>.json —
// même source de vérité que l'ordre pédagogique, aucune lecture SRS : le
// combat n'écrit NI ne lit l'état de maîtrise au jalon).

import { finalizeKana, isKanaText } from './kana-input'
import { primaryMeaning, primaryReading, type KanjiContentMap } from './lesson-quiz'
import type { GrammarOverlayPoint } from './content'

export type Rng = () => number

// ── Modes & poids (PRD § Profils de poids par type de combat) ─────────────────

/** Les 9 modes fondateurs. Les 13 modes additionnels (M10-M23) sont exclus
 * par les gardes tant que leurs données n'existent pas — la redistribution
 * proportionnelle rend leurs poids sans effet sur les ratios des modes
 * restants, ils ne sont donc pas encodés ici. */
export type QuestionMode =
  | 'sens'
  | 'lecture'
  | 'saisie'
  | 'composition'
  | 'grammaire'
  | 'conjugaison'
  | 'traduction'
  | 'disposition'
  | 'ecoute'

export type BattleType = 'route' | 'boss'

/** Modes réellement implémentés au jalon 1 — les seuls que le serveur peut
 * marquer disponibles (décision D4 du board). */
export const IMPLEMENTED_MODES: readonly QuestionMode[] = [
  'sens',
  'lecture',
  'saisie',
  'composition',
  'grammaire',
]

const MODE_ORDER: readonly QuestionMode[] = [
  'sens',
  'lecture',
  'saisie',
  'composition',
  'grammaire',
  'conjugaison',
  'traduction',
  'disposition',
  'ecoute',
]

/** Table PRD rééquilibrée 2026-07-21 (colonnes des 9 fondateurs). */
export const BATTLE_MODE_WEIGHTS: Record<BattleType, Record<QuestionMode, number>> = {
  route: {
    sens: 18,
    lecture: 15,
    saisie: 13,
    composition: 8,
    grammaire: 6,
    conjugaison: 6,
    traduction: 3,
    disposition: 4,
    ecoute: 6,
  },
  boss: {
    sens: 8,
    lecture: 8,
    saisie: 7,
    composition: 3,
    grammaire: 10,
    conjugaison: 10,
    traduction: 4,
    disposition: 18,
    ecoute: 6,
  },
}

/** Sélection pondérée avec gardes d'exclusion : seuls les modes marqués
 * disponibles participent, le poids des exclus est redistribué
 * proportionnellement (= renormalisation). Appelée À CHAQUE tirage. */
export function selectBattleMode(
  battleType: BattleType,
  availability: Partial<Record<QuestionMode, boolean>>,
  rng: Rng
): QuestionMode | null {
  const weights = BATTLE_MODE_WEIGHTS[battleType]
  const active = MODE_ORDER.filter(mode => availability[mode] === true && weights[mode] > 0)
  const total = active.reduce((sum, mode) => sum + weights[mode], 0)
  if (total <= 0) return null
  const roll = rng() * total
  let cumulative = 0
  for (const mode of active) {
    cumulative += weights[mode]
    if (roll < cumulative) return mode
  }
  return active[active.length - 1]
}

/** Catégorie de profil (PRD : Boss = Silver, 門弟, 師範, Rocket, Kimono,
 * légendaires…). Le registre map_trainers n'a pas encore de champ catégorie —
 * au jalon 1, seul Silver est un Boss ; heuristique documentée, à remplacer
 * par un champ de registre à l'échelle. */
export function battleTypeForTrainer(trainerId: string): BattleType {
  return trainerId.startsWith('silver_') ? 'boss' : 'route'
}

// ── Vies ──────────────────────────────────────────────────────────────────────

/** N = max(2, ceil(questions × 0.10)) — la N-ième erreur est fatale. */
export function livesFor(questions: number): number {
  return Math.max(2, Math.ceil(questions * 0.1))
}

// ── Items étudiés & pool de combat ────────────────────────────────────────────

/** Déplie completed_lessons[] (« <zone>#<seq> », ordre de complétion) en
 * kanji étudiés ordonnés du plus ancien au plus récent. */
export function studiedKanjiInOrder(
  completedLessons: string[],
  lessonsForZone: (zoneId: string) => { sequence_index: number; kanji_ids: string[] }[]
): string[] {
  const seen = new Set<string>()
  const items: string[] = []
  for (const entry of completedLessons) {
    const [zoneId, seq] = entry.split('#')
    const lesson = lessonsForZone(zoneId).find(l => l.sequence_index === Number(seq))
    if (!lesson) continue
    for (const kanji of lesson.kanji_ids) {
      if (!seen.has(kanji)) {
        seen.add(kanji)
        items.push(kanji)
      }
    }
  }
  return items
}

export const BATTLE_WINDOW_SIZE = 50
export const WINDOW_DRAW_PROBABILITY = 0.7

export interface BattlePool {
  /** Les 50 derniers items étudiés (tout le studiedSet si < 50). */
  window: string[]
  /** Le reste de l'historique (vide si < 50 items — ratio annulé). */
  history: string[]
}

export function getBattlePool(studiedItems: string[]): BattlePool {
  if (studiedItems.length <= BATTLE_WINDOW_SIZE) {
    return { window: [...studiedItems], history: [] }
  }
  return {
    window: studiedItems.slice(-BATTLE_WINDOW_SIZE),
    history: studiedItems.slice(0, -BATTLE_WINDOW_SIZE),
  }
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** Tirage sans remise dans la pool locale au combat : 70 % fenêtre / 30 %
 * historique quand les deux existent ; si `used` couvre toute la pool, elle
 * redevient disponible avec remise (PRD § Pas de répétition de contenu). */
export function drawBattleContent(
  pool: BattlePool,
  used: ReadonlySet<string>,
  rng: Rng
): string | null {
  if (pool.window.length + pool.history.length === 0) return null
  let windowLeft = pool.window.filter(item => !used.has(item))
  let historyLeft = pool.history.filter(item => !used.has(item))
  if (windowLeft.length === 0 && historyLeft.length === 0) {
    // remise : la pool entière redevient disponible
    windowLeft = [...pool.window]
    historyLeft = [...pool.history]
  }
  if (windowLeft.length === 0) return pick(historyLeft, rng)
  if (historyLeft.length === 0) return pick(windowLeft, rng)
  return rng() < WINDOW_DRAW_PROBABILITY ? pick(windowLeft, rng) : pick(historyLeft, rng)
}

// ── Normalisation des lectures ────────────────────────────────────────────────

/** Katakana → hiragana (décalage Unicode ; ー conservé). */
export function kataToHira(text: string): string {
  return text.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60))
}

interface ReadingSource {
  on?: string[]
  kun?: string[]
}

/** Toutes les lectures valides d'un item, en hiragana : on-yomi converties,
 * kun-yomi avec ET sans okurigana (`ひと.つ` → ひと + ひとつ), tirets ôtés.
 * Sert de garde anti-ambiguïté (Lecture) et de cible d'acceptation (Saisie —
 * « accepte on OU kun »). */
export function validReadingsOf(entry: ReadingSource): string[] {
  const readings = new Set<string>()
  for (const on of entry.on ?? []) {
    const h = kataToHira(on).replace(/[.\-]/g, '')
    if (h) readings.add(h)
  }
  for (const kun of entry.kun ?? []) {
    const clean = kun.replace(/-/g, '')
    const full = clean.replace(/\./g, '')
    const stem = clean.split('.')[0]
    if (full) readings.add(kataToHira(full))
    if (stem) readings.add(kataToHira(stem))
  }
  return Array.from(readings)
}

// ── Questions ─────────────────────────────────────────────────────────────────

export type BattleQuestion =
  | { mode: 'sens'; item: string; choices: string[]; correct_index: number }
  | { mode: 'lecture'; item: string; choices: string[]; correct_index: number }
  | {
      mode: 'grammaire'
      grammar_id: string
      cloze: string
      choices: string[]
      correct_index: number
    }
  | { mode: 'saisie'; item: string; prompt_en: string; accepted: string[] }
  | { mode: 'composition'; tiles: string[]; word: string; reading: string }

/** 3 distracteurs uniques ≠ correct, pool du combat d'abord (PRD § Sources
 * des distracteurs), complétés depuis le vivier global si la pool est trop
 * petite (début de partie). */
function drawDistractors(
  correct: string,
  poolValues: string[],
  globalValues: string[],
  reject: (candidate: string) => boolean,
  rng: Rng
): string[] {
  const drawn: string[] = []
  const take = (source: string[]) => {
    const candidates = Array.from(new Set(source)).filter(
      v => v !== '' && v !== correct && !drawn.includes(v) && !reject(v)
    )
    while (drawn.length < 3 && candidates.length > 0) {
      const [value] = candidates.splice(Math.floor(rng() * candidates.length), 1)
      drawn.push(value)
    }
  }
  take(poolValues)
  if (drawn.length < 3) take(globalValues)
  return drawn
}

/** Fisher-Yates — les choix stockés partent déjà mélangés (contrat § 8 :
 * l'affichage re-mélange en plus, jamais l'ordre stocké à l'écran). */
function shuffleChoices(correct: string, distractors: string[], rng: Rng) {
  const choices = [correct, ...distractors]
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[choices[i], choices[j]] = [choices[j], choices[i]]
  }
  return { choices, correct_index: choices.indexOf(correct) }
}

/** Sens : item en grand → 4 sens EN (keyword prioritaire, contrat § 7). */
export function buildSensQuestion(
  item: string,
  content: KanjiContentMap,
  poolItems: string[],
  rng: Rng
): BattleQuestion | null {
  const entry = content[item]
  if (!entry) return null
  const correct = primaryMeaning(entry)
  if (!correct) return null
  const poolMeanings = poolItems.filter(k => k !== item).map(k => content[k] ? primaryMeaning(content[k]) : '')
  const globalMeanings = Object.values(content).map(primaryMeaning)
  const distractors = drawDistractors(correct, poolMeanings, globalMeanings, () => false, rng)
  if (distractors.length < 3) return null
  return { mode: 'sens', item, ...shuffleChoices(correct, distractors, rng) }
}

/** Lecture : item en grand → 4 lectures hiragana. Garde anti-ambiguïté :
 * jamais un distracteur qui serait aussi une lecture valide de l'item. */
export function buildLectureQuestion(
  item: string,
  content: KanjiContentMap,
  poolItems: string[],
  rng: Rng
): BattleQuestion | null {
  const entry = content[item]
  if (!entry) return null
  const correct = kataToHira(primaryReading(entry))
  if (!correct) return null
  const valid = new Set(validReadingsOf(entry))
  const readingOf = (k: string) => (content[k] ? kataToHira(primaryReading(content[k])) : '')
  const poolReadings = poolItems.filter(k => k !== item).map(readingOf)
  const globalReadings = Object.values(content).map(e => kataToHira(primaryReading(e)))
  const distractors = drawDistractors(correct, poolReadings, globalReadings, c => valid.has(c), rng)
  if (distractors.length < 3) return null
  return { mode: 'lecture', item, ...shuffleChoices(correct, distractors, rng) }
}

/** Saisie : prompt = sens EN (phase d'acquisition — la graduation vers le
 * prompt kanji attendra la maîtrise FSRS, hors jalon), réponse = lecture
 * tapée (KanaInput), on OU kun acceptés. */
export function buildSaisieQuestion(item: string, content: KanjiContentMap): BattleQuestion | null {
  const entry = content[item]
  if (!entry) return null
  const prompt = primaryMeaning(entry)
  const accepted = validReadingsOf(entry)
  if (!prompt || accepted.length === 0) return null
  return { mode: 'saisie', item, prompt_en: prompt, accepted }
}

/** Validation Saisie : finalise la frappe (résout le n en suspens), refuse
 * tout résidu latin, normalise katakana → hiragana. */
export function isSaisieCorrect(rawInput: string, accepted: string[]): boolean {
  const finalized = finalizeKana(rawInput)
  if (!isKanaText(finalized)) return false
  return accepted.includes(kataToHira(finalized))
}

// ── Composition ───────────────────────────────────────────────────────────────

const TWO_KANJI = /^[一-鿿々]{2}$/

export interface LexiconWord {
  word: string
  reading: string
}

export interface CompositionLexicon {
  /** Mots cibles tirables : exactement 2 kanji, avec lecture. */
  targets: LexiconWord[]
  /** Toutes les séquences de 2 kanji connues comme mots — garde d'unicité
   * (« aucune autre paire ni ordre ne doit former un mot »). Vérifiée contre
   * le lexique fichier disponible (JLPT + mots d'exemples de kanji-content) ;
   * la table `words` complète prendra le relais à l'ingestion en base. */
  validPairs: Set<string>
}

export function buildCompositionLexicon(
  words: LexiconWord[],
  extraWords: string[] = []
): CompositionLexicon {
  const targets = words.filter(w => TWO_KANJI.test(w.word) && w.word[0] !== w.word[1])
  const validPairs = new Set(targets.map(w => w.word))
  for (const word of extraWords) {
    if (TWO_KANJI.test(word)) validPairs.add(word)
  }
  return { targets, validPairs }
}

/** Garde d'exclusion du mode : existe-t-il au moins un mot composable avec
 * la pool ? (indépendant de `used` — la remise réactive les paires). */
export function hasComposableTarget(poolItems: string[], lexicon: CompositionLexicon): boolean {
  const pool = new Set(poolItems)
  return lexicon.targets.some(t => pool.has(t.word[0]) && pool.has(t.word[1]))
}

const COMPOSITION_TARGET_ATTEMPTS = 12
const COMPOSITION_TILE_ATTEMPTS = 24

/** 4 tiles dont EXACTEMENT 2 forment un mot valide unique (dans un seul
 * ordre) — vérifié contre le lexique au tirage (PRD § 9 Modes). */
export function buildCompositionQuestion(
  poolItems: string[],
  lexicon: CompositionLexicon,
  usedPairs: ReadonlySet<string>,
  rng: Rng
): BattleQuestion | null {
  const pool = new Set(poolItems)
  const candidates = lexicon.targets.filter(
    t => pool.has(t.word[0]) && pool.has(t.word[1]) && !usedPairs.has(t.word)
  )
  if (candidates.length === 0) return null

  for (let t = 0; t < COMPOSITION_TARGET_ATTEMPTS && candidates.length > 0; t++) {
    const [target] = candidates.splice(Math.floor(rng() * candidates.length), 1)
    const [a, b] = [target.word[0], target.word[1]]
    const distractorPool = poolItems.filter(k => k !== a && k !== b)
    if (distractorPool.length < 2) continue
    for (let i = 0; i < COMPOSITION_TILE_ATTEMPTS; i++) {
      const d1 = pick(distractorPool, rng)
      const d2 = pick(distractorPool, rng)
      if (d1 === d2) continue
      const tiles = [a, b, d1, d2]
      let validCount = 0
      for (const x of tiles) {
        for (const y of tiles) {
          if (x !== y && lexicon.validPairs.has(x + y)) validCount++
        }
      }
      if (validCount !== 1) continue
      // mélange des tiles à la construction (l'affichage re-mélange en plus)
      for (let k = tiles.length - 1; k > 0; k--) {
        const j = Math.floor(rng() * (k + 1))
        ;[tiles[k], tiles[j]] = [tiles[j], tiles[k]]
      }
      return { mode: 'composition', tiles, word: target.word, reading: target.reading }
    }
  }
  return null
}

// ── Grammaire (QCM au jalon 1) ────────────────────────────────────────────────

/** Cloze QCM depuis l'overlay de zone : jp_cloze + point_answer +
 * distractors[] du fichier. Au jalon 1 la question reste en QCM quel que
 * soit times_drawn (la graduation QCM→saisie par point viendra avec le
 * clavier de grammaire) — times_drawn est déjà compté pour qu'elle démarre
 * juste à l'échelle. */
export function buildGrammarQuestion(
  point: GrammarOverlayPoint,
  rng: Rng
): BattleQuestion | null {
  if (point.selected_examples.length === 0) return null
  const example = point.selected_examples[Math.floor(rng() * point.selected_examples.length)]
  const distractors = example.distractors.slice(0, 3)
  if (distractors.length < 3) return null
  return {
    mode: 'grammaire',
    grammar_id: point.grammar_id,
    cloze: example.jp_cloze,
    ...shuffleChoices(example.point_answer, distractors, rng),
  }
}

// ── Script de combat (assemblage pur, appelé par la server action) ────────────

/** Mots d'exemples de kanji-content (2 kanji) — viennent grossir la garde
 * d'unicité de Composition, jamais les cibles (pas tous JLPT). */
export function exampleWordsOf(content: KanjiContentMap): string[] {
  const words: string[] = []
  for (const entry of Object.values(content)) {
    for (const example of entry.examples ?? []) {
      if (TWO_KANJI.test(example.word)) words.push(example.word)
    }
  }
  return words
}

export interface BattleScriptConfig {
  battleType: BattleType
  questionCount: number
  /** Kanji étudiés, du plus ancien au plus récent (studiedKanjiInOrder). */
  studiedItems: string[]
  content: KanjiContentMap
  /** Points de grammaire DÉJÀ rencontrés (grammar_encounters), avec leurs
   * exemples d'overlay. Vide → mode Grammaire exclu par la garde. */
  grammarPoints: GrammarOverlayPoint[]
  /** null → mode Composition exclu par la garde. */
  lexicon: CompositionLexicon | null
  rng?: Rng
}

export interface BattleScript {
  lives: number
  questions: BattleQuestion[]
  /** grammar_id de chaque question grammaire tirée, dans l'ordre — la
   * server action incrémente times_drawn/last_drawn_at avec. */
  grammarDrawn: string[]
}

export function buildBattleScript(config: BattleScriptConfig): BattleScript {
  const { battleType, questionCount, studiedItems, content, grammarPoints, lexicon } = config
  const rng = config.rng ?? Math.random
  const pool = getBattlePool(studiedItems)

  const usedItems = new Set<string>()
  const usedPairs = new Set<string>()
  const usedGrammar = new Set<string>()
  const questions: BattleQuestion[] = []
  const grammarDrawn: string[] = []

  const grammarAvailable = grammarPoints.some(p => p.selected_examples.length > 0)
  const compositionAvailable =
    lexicon !== null && hasComposableTarget(studiedItems, lexicon)

  for (let i = 0; i < questionCount; i++) {
    // Gardes évaluées et redistribution appliquée À CE tirage
    const disabled = new Set<QuestionMode>()
    let question: BattleQuestion | null = null

    while (question === null) {
      const availability: Partial<Record<QuestionMode, boolean>> = {
        sens: studiedItems.length > 0 && !disabled.has('sens'),
        lecture: studiedItems.length > 0 && !disabled.has('lecture'),
        saisie: studiedItems.length > 0 && !disabled.has('saisie'),
        composition: compositionAvailable && !disabled.has('composition'),
        grammaire: grammarAvailable && !disabled.has('grammaire'),
      }
      const mode = selectBattleMode(battleType, availability, rng)
      if (mode === null) {
        throw new Error('battle: no question mode available (empty studied set?)')
      }

      switch (mode) {
        case 'sens':
        case 'lecture':
        case 'saisie': {
          const item = drawBattleContent(pool, usedItems, rng)
          if (item === null) {
            disabled.add(mode)
            break
          }
          question =
            mode === 'sens'
              ? buildSensQuestion(item, content, studiedItems, rng)
              : mode === 'lecture'
                ? buildLectureQuestion(item, content, studiedItems, rng)
                : buildSaisieQuestion(item, content)
          if (question === null) disabled.add(mode)
          else {
            // sans remise partagé entre Sens/Lecture/Saisie (PRD V-5) ; si la
            // pool était épuisée, drawBattleContent a déjà fait la remise —
            // on repart d'un `used` vide pour garder la rotation.
            if (usedItems.size >= pool.window.length + pool.history.length) usedItems.clear()
            usedItems.add(item)
          }
          break
        }
        case 'composition': {
          if (lexicon === null) {
            disabled.add('composition')
            break
          }
          if (
            usedPairs.size > 0 &&
            buildCompositionQuestion(studiedItems, lexicon, usedPairs, rng) === null
          ) {
            // toutes les paires composables tirées → remise (PRD)
            usedPairs.clear()
          }
          question = buildCompositionQuestion(studiedItems, lexicon, usedPairs, rng)
          if (question === null) disabled.add('composition')
          else if (question.mode === 'composition') usedPairs.add(question.word)
          break
        }
        case 'grammaire': {
          let candidates = grammarPoints.filter(
            p => p.selected_examples.length > 0 && !usedGrammar.has(p.grammar_id)
          )
          if (candidates.length === 0) {
            usedGrammar.clear() // remise
            candidates = grammarPoints.filter(p => p.selected_examples.length > 0)
          }
          if (candidates.length === 0) {
            disabled.add('grammaire')
            break
          }
          const point = pick(candidates, rng)
          question = buildGrammarQuestion(point, rng)
          if (question === null) disabled.add('grammaire')
          else {
            usedGrammar.add(point.grammar_id)
            grammarDrawn.push(point.grammar_id)
          }
          break
        }
        default:
          disabled.add(mode)
      }
    }

    questions.push(question)
  }

  return { lives: livesFor(questionCount), questions, grammarDrawn }
}

// ── Déroulé du combat (client, jamais persisté) ───────────────────────────────

export interface BattleProgress {
  totalQuestions: number
  lives: number
  livesLost: number
  /** Nombre de questions déjà répondues (= index de la question courante). */
  index: number
  correctCount: number
  outcome: 'ongoing' | 'victory' | 'defeat'
}

export function startProgress(totalQuestions: number, lives: number): BattleProgress {
  return { totalQuestions, lives, livesLost: 0, index: 0, correctCount: 0, outcome: 'ongoing' }
}

/** Une réponse : mauvaise → vie perdue (la N-ième erreur est fatale, même
 * sur la dernière question) ; toutes les questions passées avec au moins
 * une vie → victoire. Après la fin, no-op. */
export function applyAnswer(progress: BattleProgress, correct: boolean): BattleProgress {
  if (progress.outcome !== 'ongoing') return progress
  const livesLost = progress.livesLost + (correct ? 0 : 1)
  const index = progress.index + 1
  const correctCount = progress.correctCount + (correct ? 1 : 0)
  const outcome: BattleProgress['outcome'] =
    livesLost >= progress.lives ? 'defeat' : index >= progress.totalQuestions ? 'victory' : 'ongoing'
  return { ...progress, livesLost, index, correctCount, outcome }
}

export function accuracyOf(progress: BattleProgress): number {
  return progress.index === 0 ? 0 : progress.correctCount / progress.index
}

/** Barre adverse : 1/questions par bonne réponse (visuel pur). */
export function opponentHpFraction(progress: BattleProgress): number {
  return Math.max(0, 1 - progress.correctCount / progress.totalQuestions)
}

/** Barre joueur : 1/N par erreur, à 0 = défaite. */
export function playerHpFraction(progress: BattleProgress): number {
  return Math.max(0, 1 - progress.livesLost / progress.lives)
}
