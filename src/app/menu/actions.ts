'use server'

// Assemblage serveur du menu START (issue 09) — une seule action lue à
// l'ouverture du menu : le client (StartMenu.tsx) ne lit jamais content/ ni
// src/data/kanji-content.json, il reçoit un objet sérialisable entièrement
// résolu (libellés jp compris).
//
//  - レッスン Carnet : getLessonBook (issue 05, pur) sur les zones VISITÉES
//    dans l'ordre du voyage — mapping MAP_* → slug via zone-slug.ts, le
//    « trou » noté par l'issue 05 (mapping laissé à l'appelant) est comblé ici.
//  - ぼうけんノート : quest_progress × content/quests/*.json (pur).
//  - バッグ + どくしょノート : inventaire × item-labels.json ; textes des
//    zones visitées × text_completions (issue 08) × unlocked_texts.
//  - 図鑑 : table kanji + cards (schéma étendu item_type/item_id/facet,
//    issue 05) — maîtrisé = stabilité FSRS ≥ 14 j sur les deux facettes.

import { requireUserId } from '@/lib/auth'
import { sql } from '@/lib/db'
import {
  getDialogue,
  getLessonZoneIds,
  getLessonsForZone,
  getMapNpcs,
  getQuest,
  getQuestStepsIndex,
  getTextZoneIds,
  getTextsForZone,
} from '@/lib/content'
import { getLessonBook, withLessonQuestSteps, type LessonBookLine } from '@/lib/lessons'
import { getPlayerState } from '@/lib/player-state'
import { getTextCompletions } from '@/lib/text-completions'
import {
  buildQuestJournal,
  buildReadingJournal,
  groupBagItems,
  kanjidexStatusMap,
  zoneJpLabel,
  type BagCategoryView,
  type KanjidexStatus,
  type QuestJournalEntry,
  type ReadingJournalEntry,
} from '@/lib/start-menu'
import { visitedZoneSlugs } from '@/lib/zone-slug'
import itemLabels from '@/data/item-labels.json'
import textHolderLabels from '@/data/text-holder-labels.json'
import uiStrings from '@/data/ui-strings.json'
import zoneLabels from '@/data/zone-labels.json'

// ── Types du payload ──────────────────────────────────────────────────────────

export interface LessonBookLineView extends LessonBookLine {
  /** Nom jp du PNJ donneur (états next/locked) — résolu depuis son fichier
   * dialogue ; null pour masked. */
  npc_jp: string | null
}

export interface LessonBookChapterView {
  zone_id: string
  zone_jp: string
  completed: number
  total: number
  lines: LessonBookLineView[]
}

export interface QuestJournalView extends QuestJournalEntry {
  target_zone_jp: string | null
}

export interface ReadingJournalView extends ReadingJournalEntry {
  /** Indice du porteur, résolu en jp (PNJ → nom du dialogue, objet →
   * registre text-holder-labels.json). */
  holder_jp: string | null
}

export interface KanjidexTile {
  id: string
  character: string
  jlpt_level: string | null
}

export interface StartMenuData {
  lessonBook: LessonBookChapterView[]
  questJournal: QuestJournalView[]
  bag: BagCategoryView[]
  readingJournal: ReadingJournalView[]
  kanjidex: { kanji: KanjidexTile[]; status: Record<string, KanjidexStatus> }
}

// ── Résolutions de libellés ───────────────────────────────────────────────────

type JpLabelMap = Record<string, { jp: string }>

/** Nom jp d'un PNJ (npc_ref du registre) via son fichier dialogue —
 * repli : le nom latin du registre (dev), puis le ref brut. */
function npcJpName(npcRef: string): string {
  const npc = getMapNpcs().find(n => n.npc_id === npcRef)
  const dialogue = npc?.dialogue_ref ? getDialogue(npc.dialogue_ref) : null
  if (dialogue) return typeof dialogue.name === 'string' ? dialogue.name : dialogue.name.jp
  return npc?.name ?? npcRef
}

function holderJp(entry: ReadingJournalEntry): string | null {
  if (!entry.holder_ref) return null
  if (entry.holder_kind === 'npc') return npcJpName(entry.holder_ref)
  const label = (textHolderLabels as unknown as JpLabelMap)[entry.holder_ref]
  return label?.jp ?? uiStrings.menu_reading_holder_unknown.jp
}

// ── L'action ──────────────────────────────────────────────────────────────────

export async function getStartMenuData(): Promise<StartMenuData> {
  const userId = await requireUserId()
  const state = await getPlayerState(userId)
  const now = new Date()

  // Carnet de leçons — chapitres = zones visitées (ordre du voyage) qui ont
  // un fichier de leçons ; l'index de quêtes reçoit les quêtes implicites
  // lessons-<zone> de chaque chapitre (dérivées, issue 05).
  const lessonZones = visitedZoneSlugs(state.visited_zones, getLessonZoneIds())
  const zones = lessonZones.map(zone_id => ({ zone_id, lessons: getLessonsForZone(zone_id) }))
  const questSteps = zones.reduce(
    (index, { zone_id, lessons }) => withLessonQuestSteps(index, zone_id, lessons),
    getQuestStepsIndex()
  )
  const lessonBook: LessonBookChapterView[] = getLessonBook(zones, state, {
    questSteps,
    now,
  }).map(chapter => ({
    ...chapter,
    zone_jp: zoneJpLabel(chapter.zone_id, zoneLabels as unknown as JpLabelMap),
    lines: chapter.lines.map(line => ({
      ...line,
      npc_jp: line.npc_ref ? npcJpName(line.npc_ref) : null,
    })),
  }))

  // Journal de quêtes
  const questJournal: QuestJournalView[] = buildQuestJournal(state, getQuest).map(entry => ({
    ...entry,
    target_zone_jp: entry.target_zone_id
      ? zoneJpLabel(entry.target_zone_id, zoneLabels as unknown as JpLabelMap)
      : null,
  }))

  // Sac
  const bag = groupBagItems(state.inventory, itemLabels)

  // Journal de lecture — textes des zones visitées, ordre du voyage
  const textZones = visitedZoneSlugs(state.visited_zones, getTextZoneIds())
  const texts = textZones.flatMap(zone => getTextsForZone(zone))
  const completions = await getTextCompletions(userId)
  const readingJournal: ReadingJournalView[] = buildReadingJournal(
    texts,
    state.unlocked_texts,
    completions
  ).map(entry => ({ ...entry, holder_jp: holderJp(entry) }))

  // Kanjidex — schéma étendu (item_type/item_id/facet, issue 05) ; les
  // colonnes legacy kanji_id/card_type ne sont plus lues.
  const [kanjiRows, cardRows] = await Promise.all([
    sql`select id, character, jlpt_level from kanji order by jlpt_level desc, id`,
    sql`select item_id, facet, fsrs_state from cards where user_id = ${userId} and item_type = 'kanji'`,
  ])
  const status = kanjidexStatusMap(
    cardRows.map(row => ({
      item_id: row.item_id as string,
      facet: row.facet as string,
      stability: ((row.fsrs_state as { stability?: number } | null)?.stability ?? 0) as number,
    }))
  )

  return {
    lessonBook,
    questJournal,
    bag,
    readingJournal,
    kanjidex: {
      kanji: kanjiRows.map(row => ({
        id: row.id as string,
        character: row.character as string,
        jlpt_level: (row.jlpt_level as string | null) ?? null,
      })),
      status,
    },
  }
}
