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

// ── Leçons ────────────────────────────────────────────────────────────────────

/** Les leçons d'une zone (content/lessons/<zone_id>.json), triées par
 * sequence_index ; [] si la zone n'a pas de fichier de leçons. */
export function getLessonsForZone(zoneId: string): LessonEntry[] {
  const lessons = readContentJson(`lessons/${zoneId}.json`) as LessonEntry[] | null
  return lessons ? [...lessons].sort((a, b) => a.sequence_index - b.sequence_index) : []
}
