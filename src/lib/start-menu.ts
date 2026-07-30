// Logique de présentation du menu START (issue 09) — pur, zéro I/O.
//
// Quatre écrans du jalon 1 :
//  - レッスン Carnet de leçons : getLessonBook vit dans lessons.ts (issue 05) ;
//    le mapping visited_zones (MAP_*) → slugs vit dans zone-slug.ts.
//  - ぼうけんノート Journal de quêtes : buildQuestJournal.
//  - バッグ (dont どくしょノート Journal de lecture) : groupBagItems,
//    buildReadingJournal.
//  - 図鑑 Kanjidex : kanjidexStatusMap (maîtrisé = stabilité FSRS ≥ 14 j sur
//    les DEUX facettes — PRD § Système SRS « Maîtrise », seuil abaissé de 30
//    à 14 le 2026-07-07).
//
// L'assemblage I/O (PlayerState, loaders contenu, SQL) vit dans
// src/app/menu/actions.ts ; ici tout est testable sans mock.

import type { PlayerState } from './condition-effect'
import type { BilingualText, QuestFile } from './content'

// ── Journal de quêtes (ぼうけんノート, CONTEXT.md « Adventure Journal ») ─────

export interface QuestJournalEntry {
  quest_id: string
  name: BilingualText
  /** Label bilingue de l'étape COURANTE (jp affiché, X = en). */
  step: BilingualText
  target_zone_id: string | null
}

/** Quêtes EN COURS uniquement : une entrée de quest_progress dont le fichier
 * de quête existe (la quête implicite lessons-<zone> n'en a pas — dérivée,
 * issue 05) et qui n'est pas terminée. Triées par ancienneté de l'étape
 * courante (la plus ancienne d'abord — la charge mentale va au japonais, pas
 * à la mémoire du méta-jeu, PRD § Menu Principal). */
export function buildQuestJournal(
  state: PlayerState,
  getQuestById: (questId: string) => QuestFile | null
): QuestJournalEntry[] {
  const rows: (QuestJournalEntry & { entered_at: string })[] = []
  for (const [questId, progress] of Object.entries(state.quest_progress)) {
    if (state.completed_quests.includes(questId)) continue
    const quest = getQuestById(questId)
    if (!quest) continue // quête implicite (lessons-<zone>) ou fichier absent
    const step = quest.steps.find(s => s.step_id === progress.current_step)
    if (!step) continue // contenu désynchronisé : jamais un crash
    rows.push({
      quest_id: questId,
      name: quest.name,
      step: step.label,
      target_zone_id: step.target_zone_id ?? null,
      entered_at: progress.step_entered_at,
    })
  }
  rows.sort((a, b) => a.entered_at.localeCompare(b.entered_at))
  return rows.map(row => ({
    quest_id: row.quest_id,
    name: row.name,
    step: row.step,
    target_zone_id: row.target_zone_id,
  }))
}

// ── Journal de lecture (どくしょノート, CONTEXT.md « Reading Journal ») ──────

export type ReadingStatus = 'gold' | 'read' | 'in_progress' | 'undiscovered'

export interface ReadingJournalEntry {
  text_id: string
  title: BilingualText
  zone_id: string
  /** gold = une passe sans faute (gold_at) ; read = complété (blanc) ;
   * in_progress = débloqué, quiz pas fini (rouvrable) ; undiscovered =
   * pas encore débloqué (grisé + indice du porteur). */
  status: ReadingStatus
  holder_ref: string | null
  holder_kind: 'npc' | 'object' | 'event' | null
}

interface ReadingJournalText {
  text_id: string
  title: BilingualText
  zone_id: string
  npc_ref: string | null
  found_object_ref: string | null
  event_ref: string | null
}

interface ReadingJournalCompletion {
  text_id: string
  gold_at: string | null
}

/** Tous les textes des zones débloquées, dans l'ordre fourni (ordre du
 * voyage) — blanc/doré même sémantique que les tuiles du Kanjidex. */
export function buildReadingJournal(
  texts: readonly ReadingJournalText[],
  unlockedTexts: readonly string[],
  completions: readonly ReadingJournalCompletion[]
): ReadingJournalEntry[] {
  const completionById = new Map(completions.map(c => [c.text_id, c]))
  return texts.map(text => {
    const completion = completionById.get(text.text_id)
    const status: ReadingStatus = completion
      ? completion.gold_at
        ? 'gold'
        : 'read'
      : unlockedTexts.includes(text.text_id)
        ? 'in_progress'
        : 'undiscovered'
    const [holder_ref, holder_kind] = text.npc_ref
      ? ([text.npc_ref, 'npc'] as const)
      : text.found_object_ref
        ? ([text.found_object_ref, 'object'] as const)
        : text.event_ref
          ? ([text.event_ref, 'event'] as const)
          : ([null, null] as const)
    return { text_id: text.text_id, title: text.title, zone_id: text.zone_id, status, holder_ref, holder_kind }
  })
}

// ── Sac (バッグ) ──────────────────────────────────────────────────────────────

/** Registre minimal de libellés d'items (src/data/item-labels.json) — les
 * items n'ont pas encore de registre de métadonnées au jalon (la table
 * `items` du PRD attend l'ingestion) ; ce fichier fait le pont, documenté. */
export interface BagItemLabels {
  categories: { id: string; jp: string }[]
  items: Record<string, { jp: string; category: string }>
}

export interface BagCategoryView {
  id: string
  jp: string
  items: { item_id: string; jp: string; quantity: number }[]
}

const FALLBACK_CATEGORY = 'other'

/** Inventaire groupé par catégorie, dans l'ordre déclaré du registre ;
 * catégories vides omises. Item hors registre → catégorie `other`, libellé
 * = item_id brut (repli dev : visible uniquement si la passe contenu a
 * oublié un item — le lint humain le repère immédiatement). */
export function groupBagItems(
  inventory: Record<string, number>,
  labels: BagItemLabels
): BagCategoryView[] {
  const byCategory = new Map<string, BagCategoryView['items']>()
  for (const [itemId, quantity] of Object.entries(inventory)) {
    if (quantity <= 0) continue
    const label = labels.items[itemId]
    const category = label?.category ?? FALLBACK_CATEGORY
    if (!byCategory.has(category)) byCategory.set(category, [])
    byCategory.get(category)!.push({ item_id: itemId, jp: label?.jp ?? itemId, quantity })
  }
  const orderedCategories = labels.categories.some(c => c.id === FALLBACK_CATEGORY)
    ? labels.categories
    : [...labels.categories, { id: FALLBACK_CATEGORY, jp: '？？？' }]
  return orderedCategories
    .filter(category => byCategory.has(category.id))
    .map(category => ({
      id: category.id,
      jp: category.jp,
      items: byCategory
        .get(category.id)!
        .sort((a, b) => a.item_id.localeCompare(b.item_id)),
    }))
}

// ── Kanjidex (図鑑) ───────────────────────────────────────────────────────────

/** Seuil de maîtrise du PRD § Système SRS (abaissé de 30 à 14 le 2026-07-07,
 * audit 07 — s'applique partout où « maîtrisé » est lu). */
export const MASTERED_STABILITY_DAYS = 14

export type KanjidexStatus = 'studied' | 'mastered'

interface KanjidexCard {
  item_id: string
  facet: string
  stability: number
}

/** kanji → statut : mastered quand les DEUX facettes (sens ET lecture) ont
 * une stabilité ≥ 14 j ; studied dès qu'une carte existe ; absent = unseen
 * (grisé, tuile quand même tapable — PRD § Kanjidex). */
export function kanjidexStatusMap(cards: readonly KanjidexCard[]): Record<string, KanjidexStatus> {
  const stability = new Map<string, { sens: number; lecture: number }>()
  for (const card of cards) {
    if (!stability.has(card.item_id)) stability.set(card.item_id, { sens: 0, lecture: 0 })
    const entry = stability.get(card.item_id)!
    if (card.facet === 'sens') entry.sens = card.stability
    else if (card.facet === 'lecture') entry.lecture = card.stability
  }
  const map: Record<string, KanjidexStatus> = {}
  for (const [itemId, { sens, lecture }] of stability) {
    map[itemId] =
      sens >= MASTERED_STABILITY_DAYS && lecture >= MASTERED_STABILITY_DAYS
        ? 'mastered'
        : 'studied'
  }
  return map
}

// ── Libellés jp de zones ──────────────────────────────────────────────────────

/** Libellé jp d'un slug de zone : registre (src/data/zone-labels.json) →
 * dérivation route-N → 「Nばんどうろ」 → repli prettifié (latin, dev — les
 * zones hors jalon recevront leur libellé à la passe contenu). */
export function zoneJpLabel(slug: string, labels: Record<string, { jp: string }>): string {
  const known = labels[slug]
  if (known) return known.jp
  const route = /^route-(\d+)$/.exec(slug)
  if (route) return `${route[1]}ばんどうろ`
  return slug
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
