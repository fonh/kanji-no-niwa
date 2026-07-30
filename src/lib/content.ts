// Loader contenu — point d'entrée unique, côté serveur, des JSON de
// `content/` (issue 02 ; réutilisé par les issues 03/05/08).
//
// Décision d'architecture du jalon 1 (board des issues) : le contenu est servi
// depuis les fichiers versionnés, jamais ingéré en base — Neon ne porte que la
// progression joueur. Lecture synchrone + cache module : les fichiers sont
// immuables pendant la vie du process (redéployés avec le code).

import { readFileSync, readdirSync } from 'fs'
import path from 'path'
import type { Condition, Effect, StateRule } from './condition-effect'

// ── Types des fichiers réels ──────────────────────────────────────────────────

export interface BilingualText {
  jp: string
  en: string
}

/** Une entrée de pages[] : page de texte ordinaire, ou entrée à `kind`
 * spécial (companion_choice, instant_response, conversation_turn) — le
 * routage de ces kinds appartient à l'issue 03. */
export interface DialoguePageEntry {
  jp?: string
  en?: string
  kind?: string
  [key: string]: unknown
}

export interface DialogueState {
  pages: DialoguePageEntry[]
  effects?: Effect[]
}

export interface DialogueFile {
  npc_id?: string
  trainer_id?: string
  name: BilingualText | string
  zone_id?: string
  state_rules: StateRule[]
  dialogue_states: Record<string, DialogueState>
}

export interface QuestStep {
  step_id: string
  label: BilingualText
  target_zone_id?: string
}

export interface QuestFile {
  quest_id: string
  name: BilingualText
  zone_ids: string[]
  steps: QuestStep[]
}

export interface MapNpcEntry {
  npc_id: string
  zone_id: string
  name: string
  tile_x: number
  tile_y: number
  trigger_type: string
  dialogue_ref?: string
  role?: string
  kind?: string
  facing?: string
  sight_range?: number
  sight_auto_result?: string
  repeats?: boolean
  unlock_conditions?: Condition[]
}

export interface MapTrainerEntry {
  trainer_id: string
  zone_id: string
  name: string
  tile_x: number
  tile_y: number
  facing: string
  sight_range: number
  trigger_type: string
  sight_auto_result?: string
  repeats?: boolean
  role?: string
  battle_length?: number
  dialogue_ref: string
  unlock_conditions?: Condition[]
}

export interface MapObstacleEntry {
  obstacle_id: string
  zone_id: string
  tile_x: number
  tile_y: number
  unlock_conditions: Condition[]
}

export interface LessonEntry {
  zone_id: string
  npc_ref: string
  sequence_index: number
  kanji_ids: string[]
  grammar_id?: string
  unlock_conditions?: Condition[]
}

// ── Lecture + cache ───────────────────────────────────────────────────────────

const CONTENT_ROOT = path.join(process.cwd(), 'content')

const jsonCache = new Map<string, unknown>()

/** Lit et met en cache un JSON sous content/. `relPath` est validé : segments
 * [a-z0-9_-] uniquement, pas de remontée possible. Retourne null si absent. */
function readContentJson(relPath: string): unknown {
  if (!/^[a-z0-9_\-/]+\.json$/i.test(relPath) || relPath.includes('..')) return null
  const cached = jsonCache.get(relPath)
  if (cached !== undefined) return cached
  let parsed: unknown
  try {
    parsed = JSON.parse(readFileSync(path.join(CONTENT_ROOT, relPath), 'utf-8'))
  } catch {
    parsed = null
  }
  jsonCache.set(relPath, parsed)
  return parsed
}

// ── Dialogues ─────────────────────────────────────────────────────────────────

/** `dialogue_ref` tel qu'écrit dans les registres de carte, p. ex.
 * "npcs/new-bark-town/mom_new_bark". */
export function getDialogue(dialogueRef: string): DialogueFile | null {
  return readContentJson(`dialogues/${dialogueRef}.json`) as DialogueFile | null
}

// ── Quêtes ────────────────────────────────────────────────────────────────────

export function getQuest(questId: string): QuestFile | null {
  return readContentJson(`quests/${questId}.json`) as QuestFile | null
}

let questStepsIndex: Record<string, string[]> | null = null

/** quest_id → step_id[] ordonnés, pour Condition.quest_step (« à ce stade ou
 * après ») et l'idempotence d'advance_quest. Construit une fois par process. */
export function getQuestStepsIndex(): Record<string, string[]> {
  if (questStepsIndex) return questStepsIndex
  const index: Record<string, string[]> = {}
  for (const file of readdirSync(path.join(CONTENT_ROOT, 'quests'))) {
    if (!file.endsWith('.json')) continue
    const quest = readContentJson(`quests/${file}`) as QuestFile | null
    if (quest) index[quest.quest_id] = quest.steps.map(s => s.step_id)
  }
  questStepsIndex = index
  return index
}

// ── Registres de carte ────────────────────────────────────────────────────────

export function getMapNpcs(): MapNpcEntry[] {
  return (readContentJson('map/npcs.json') as MapNpcEntry[] | null) ?? []
}

export function getMapTrainers(): MapTrainerEntry[] {
  return (readContentJson('map/trainers.json') as MapTrainerEntry[] | null) ?? []
}

export function getMapObstacles(): MapObstacleEntry[] {
  return (readContentJson('map/obstacles.json') as MapObstacleEntry[] | null) ?? []
}

// ── Compagnons ────────────────────────────────────────────────────────────────

/** Une entrée du roster content/companions.json (CONTEXT.md § Companion
 * Choice) : seul un slot `status: "confirmed"` est choisissable — tbd_2/tbd_3
 * restent affichés comme indisponibles tant que leur identité n'est pas
 * tranchée (roadmap Étape 5 point 5). */
export interface CompanionEntry {
  companion_id: string
  name: BilingualText
  sprite_ref: string | null
  status: string
}

export function getCompanions(): CompanionEntry[] {
  const file = readContentJson('companions.json') as { companions?: CompanionEntry[] } | null
  return file?.companions ?? []
}

// ── Leçons ────────────────────────────────────────────────────────────────────

/** Les leçons d'une zone (content/lessons/<zone_id>.json), triées par
 * sequence_index ; [] si la zone n'a pas de fichier de leçons. */
export function getLessonsForZone(zoneId: string): LessonEntry[] {
  const lessons = readContentJson(`lessons/${zoneId}.json`) as LessonEntry[] | null
  return lessons ? [...lessons].sort((a, b) => a.sequence_index - b.sequence_index) : []
}

// ── Grammaire (issue 05) ──────────────────────────────────────────────────────
// L'overlay de zone (content/grammar/<zone>.json) référence la base Hanabira
// (scripts/sources/grammar_JLPT_N*.json) par grammar_id → source_index ; rien
// du contenu Hanabira n'est dupliqué dans l'overlay (voir le _note du fichier).

export interface GrammarOverlayExample {
  source_example_index: number
  jp: string
  jp_cloze: string
  point_answer: string
  /** Sous-chaîne exacte effacée du jp (défaut si absent : point_answer). */
  point_surface?: string
  distractors: string[]
  conjugation_distractors: string[] | null
}

export interface GrammarOverlayPoint {
  grammar_id: string
  source_index: number
  title: string
  selected_examples: GrammarOverlayExample[]
}

export function getGrammarForZone(zoneId: string): GrammarOverlayPoint[] {
  const file = readContentJson(`grammar/${zoneId}.json`) as { points?: GrammarOverlayPoint[] } | null
  return file?.points ?? []
}

export function getGrammarPoint(zoneId: string, grammarId: string): GrammarOverlayPoint | null {
  return getGrammarForZone(zoneId).find(p => p.grammar_id === grammarId) ?? null
}

let grammarPointIndex: Map<string, GrammarOverlayPoint> | null = null

/** Index grammar_id → point d'overlay, toutes zones confondues (issue 07 :
 * grammar_encounters ne stocke que le grammar_id, le combat doit retrouver
 * l'overlay sans connaître la zone d'origine). Construit une fois. */
export function getGrammarPointById(grammarId: string): GrammarOverlayPoint | null {
  if (!grammarPointIndex) {
    grammarPointIndex = new Map()
    for (const file of readdirSync(path.join(CONTENT_ROOT, 'grammar'))) {
      if (!file.endsWith('.json')) continue
      const zone = file.replace(/\.json$/, '')
      for (const point of getGrammarForZone(zone)) {
        if (!grammarPointIndex.has(point.grammar_id)) {
          grammarPointIndex.set(point.grammar_id, point)
        }
      }
    }
  }
  return grammarPointIndex.get(grammarId) ?? null
}

/** Une entrée de la base Hanabira — explications en anglais, réutilisées
 * telles quelles (PRD § Langue du Jeu). */
export interface GrammarSourceEntry {
  title: string
  short_explanation: string
  long_explanation: string
  formation: string
  examples: { jp: string; romaji: string; en: string; grammar_audio?: string }[]
}

const SOURCES_ROOT = path.join(process.cwd(), 'scripts', 'sources')
const sourcesCache = new Map<string, unknown>()

/** La base Hanabira d'un palier JLPT (N5..N1) ; null si palier inconnu. */
export function getGrammarSource(level: string): GrammarSourceEntry[] | null {
  if (!/^N[1-5]$/.test(level)) return null
  const cached = sourcesCache.get(level)
  if (cached !== undefined) return cached as GrammarSourceEntry[] | null
  let parsed: GrammarSourceEntry[] | null
  try {
    parsed = JSON.parse(
      readFileSync(path.join(SOURCES_ROOT, `grammar_JLPT_${level}.json`), 'utf-8')
    ) as GrammarSourceEntry[]
  } catch {
    parsed = null
  }
  sourcesCache.set(level, parsed)
  return parsed
}

/** L'entrée Hanabira d'un point de l'overlay (grammar_id "N5-001" → palier
 * N5, ligne source_index). */
export function getGrammarSourceEntry(point: GrammarOverlayPoint): GrammarSourceEntry | null {
  const level = point.grammar_id.split('-')[0]
  return getGrammarSource(level)?.[point.source_index] ?? null
}

// ── Lexique de mots pour le mode Composition (issue 07) ───────────────────────
// La table `vocabulary` de Neon n'est pas ingérée au jalon 1 (décision board :
// contenu servi depuis les fichiers) — la source fichier disponible est la
// liste JLPT yomitan (scripts/sources/yomitan-jlpt/, ~8 100 mots avec
// lecture, CC BY-SA). Même précédent que la base Hanabira ci-dessus pour la
// lecture de scripts/sources côté serveur. Le filtrage « 2 kanji exactement »
// et la garde d'unicité vivent dans src/lib/battle.ts (pur, testé).

type YomitanTermMeta = [string, string, { reading?: string }]

let lexiconWordsCache: { word: string; reading: string }[] | null = null

/** Tous les mots JLPT (avec lecture) de la source yomitan — bruts, non
 * filtrés. [] si la source manque (le mode Composition sera exclu par sa
 * garde, jamais un crash). */
export function getCompositionLexiconWords(): { word: string; reading: string }[] {
  if (lexiconWordsCache) return lexiconWordsCache
  const words: { word: string; reading: string }[] = []
  for (let bank = 1; bank <= 5; bank++) {
    try {
      const entries = JSON.parse(
        readFileSync(path.join(SOURCES_ROOT, 'yomitan-jlpt', `term_meta_bank_${bank}.json`), 'utf-8')
      ) as YomitanTermMeta[]
      for (const [word, , meta] of entries) {
        if (typeof word === 'string' && typeof meta?.reading === 'string') {
          words.push({ word, reading: meta.reading })
        }
      }
    } catch {
      // banque absente : on continue avec ce qu'on a
    }
  }
  lexiconWordsCache = words
  return words
}

// ── Textes progressifs (issue 08) ─────────────────────────────────────────────

export interface TextQuestionOption {
  jp: string
  en: string
}

export interface TextQuestion {
  type: string
  prompt: BilingualText
  options: TextQuestionOption[]
  correct_index: number
  /** Intervalle de caractères dans jp_text (brut, lectures inline comprises)
   * — obligatoire pour inférence/référence, null pour factuel/idée générale
   * (PRD § Schéma, table `texts`). */
  answer_span: { start: number; end: number } | null
}

export interface ProgressiveText {
  text_id: string
  title: BilingualText
  jp_text: string
  en_text: string
  audio_ref: string | null
  level: string
  source: string
  tier: string
  zone_id: string
  npc_ref: string | null
  found_object_ref: string | null
  event_ref: string | null
  length_chars: number
  questions: TextQuestion[]
}

let textIndex: Map<string, ProgressiveText> | null = null

/** Index text_id → texte, toutes zones confondues (le nom de fichier n'est
 * PAS le text_id : new-bark-town/lyra_mail.json porte `lyra_mail_new_bark`).
 * Construit une fois par process, comme getGrammarPointById. */
export function getTextById(textId: string): ProgressiveText | null {
  if (!textIndex) {
    textIndex = new Map()
    for (const zoneDir of readdirSync(path.join(CONTENT_ROOT, 'texts'))) {
      let files: string[]
      try {
        files = readdirSync(path.join(CONTENT_ROOT, 'texts', zoneDir))
      } catch {
        continue // pas un dossier
      }
      for (const file of files) {
        if (!file.endsWith('.json')) continue
        const parsed = readContentJson(`texts/${zoneDir}/${file}`) as {
          text?: ProgressiveText
        } | null
        if (parsed?.text?.text_id && !textIndex.has(parsed.text.text_id)) {
          textIndex.set(parsed.text.text_id, parsed.text)
        }
      }
    }
  }
  return textIndex.get(textId) ?? null
}

/** Table des `unlock_text` émis PAR LE MOTEUR (content/engine-contract.md
 * § 2) : ces 5 textes n'ont aucun dialogue porteur — leur found_object_ref /
 * event_ref ne correspond à aucun fichier content/dialogues/, donc aucun
 * Effect de contenu ne peut les débloquer. Clé = found_object_ref (ou
 * event_ref pour forest_shrine_ilex), valeur = text_id. Seules les 2
 * premières entrées ont leur zone au jalon 1 ; les 5 sont encodées pour que
 * les zones suivantes n'aient rien à ajouter ici. */
const ENGINE_UNLOCK_TEXTS: Record<string, string> = {
  player_pc_new_bark: 'lyra_mail_new_bark',
  sign_johto_entrance_route29: 'johto_entrance_sign_route29',
  forest_shrine_ilex: 'forest_shrine_ilex',
  son_in_law_letter_object_slowpoke_well: 'son_in_law_letter_slowpoke_well',
  inscription_sprout_tower: 'ancient_inscription_sprout_tower',
}

/** text_id à débloquer quand le moteur voit une interaction avec cet objet /
 * cette tuile / cet event ; null si l'id n'est pas dans la table. */
export function getEngineUnlockTextId(refId: string): string | null {
  return ENGINE_UNLOCK_TEXTS[refId] ?? null
}

// ── Lignes de blocage de leçon ────────────────────────────────────────────────

/** Banque partagée de lignes « tu vas trop vite » (PRD § Ordre des leçons :
 * content/dialogues/shared/lesson-blocked.json, pool par palier JLPT).
 * Le fichier n'existe pas encore (passe contenu à venir) — [] dans ce cas,
 * l'appelant retombe sur la ligne système de ui-strings. */
export function getLessonBlockedLines(jlptLevel = 'N5'): string[] {
  const file = readContentJson('dialogues/shared/lesson-blocked.json') as Record<
    string,
    string[]
  > | null
  return file?.[jlptLevel] ?? []
}
