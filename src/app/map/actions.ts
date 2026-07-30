'use server'

import { requireUserId } from '@/lib/auth'
import { sql } from '@/lib/db'
import { applyEffect, applyEffects, selectDialogueState } from '@/lib/condition-effect'
import {
  getCompanions,
  getDialogue,
  getLessonBlockedLines,
  getLessonsForZone,
  getMapNpcs,
  getQuestStepsIndex,
  type DialoguePageEntry,
} from '@/lib/content'
import { attachCompanionOptions } from '@/lib/dialogue-pages'
import { resolveLessonInteraction } from '@/lib/lessons'
import { getPlayerState, savePlayerState } from '@/lib/player-state'
import uiStrings from '@/data/ui-strings.json'

// Blob MapProgress legacy (tiroir dev + obstacles côté client) — reste sur
// users.map_progress tant que l'issue 10 (traversée + gates) n'a pas basculé
// les obstacles sur le modèle Condition/Effect.
export async function saveMapProgress(progress: unknown) {
  const userId = await requireUserId()
  await sql`update users set map_progress = ${JSON.stringify(progress)} where id = ${userId}`
}

// Position : écrit user_map_state (les colonnes users.map_* restent en place
// mais ne sont plus alimentées — retrait dans une migration ultérieure).
// Trace aussi la première entrée effective dans la zone (visited_zones,
// PRD finding 03-B3 : débloquée ≠ visitée).
export async function saveMapPosition(zoneName: string, x: number, z: number) {
  const userId = await requireUserId()
  await sql`
    insert into user_map_state (user_id, current_zone, avatar_x, avatar_y, visited_zones)
    values (${userId}, ${zoneName}, ${x}, ${z}, array[${zoneName}])
    on conflict (user_id) do update set
      current_zone = excluded.current_zone,
      avatar_x = excluded.avatar_x,
      avatar_y = excluded.avatar_y,
      visited_zones = case
        when ${zoneName} = any(user_map_state.visited_zones) then user_map_state.visited_zones
        else array_append(user_map_state.visited_zones, ${zoneName})
      end,
      updated_at = now()
  `
}

export interface ReachedDialogue {
  name: string
  state: string
  pages: DialoguePageEntry[]
}

// Le cœur de la tranche verticale (issue 02) : sélectionne le dialogue_state
// actif via les state_rules évaluées contre le vrai état joueur, applique les
// Effect[] de l'état atteint (horodatage serveur), persiste si quelque chose
// a changé. Idempotent par construction : rejouer les effets d'un état déjà
// atteint retourne le même PlayerState (===), donc zéro écriture.
export async function reachDialogueState(dialogueRef: string): Promise<ReachedDialogue | null> {
  const userId = await requireUserId()
  const dialogue = getDialogue(dialogueRef)
  if (!dialogue) return null

  const state = await getPlayerState(userId)
  const ctx = { questSteps: getQuestStepsIndex(), now: new Date() }

  const stateId = selectDialogueState(dialogue.state_rules, state, ctx)
  if (!stateId) return null
  const dialogueState = dialogue.dialogue_states[stateId]
  if (!dialogueState) return null

  if (dialogueState.effects?.length) {
    const next = applyEffects(dialogueState.effects, state, ctx)
    if (next !== state) await savePlayerState(userId, next)
  }

  return {
    name: typeof dialogue.name === 'string' ? dialogue.name : dialogue.name.jp,
    state: stateId,
    // Enrichissement issue 03 : les entrées companion_choice reçoivent le
    // roster de content/companions.json (le client ne lit jamais content/).
    // attachCompanionOptions retourne de nouvelles entrées — le cache module
    // du loader n'est pas muté.
    pages: attachCompanionOptions(dialogueState.pages, getCompanions()),
  }
}

// Interaction PNJ (issue 05) : si le PNJ est un PNJ-leçon (référencé par
// npc_ref dans content/lessons/<zone>.json), la règle leçon-ou-blocage
// (src/lib/lessons.ts) décide de la résolution AVANT le dialogue :
//  - leçon en tête + déverrouillée → le client ouvre le Book Screen
//    (route /lesson/<zone>/<seq>) au lieu de la boîte de dialogue ;
//  - hors d'ordre → ligne de blocage en boîte de dialogue (banque partagée
//    content/dialogues/shared/lesson-blocked.json quand elle existera,
//    ligne système de ui-strings en attendant) ;
//  - sinon (tête verrouillée par ses unlock_conditions, ou zone finie) →
//    le dialogue_ref ordinaire, comme n'importe quel PNJ.
export type NpcInteraction =
  | { kind: 'lesson'; zone_id: string; sequence_index: number }
  | { kind: 'dialogue'; dialogue: ReachedDialogue }

export async function interactWithNpc(
  npcId: string,
  dialogueRef: string
): Promise<NpcInteraction | null> {
  const npc = getMapNpcs().find(n => n.npc_id === npcId)
  if (npc?.role === 'lesson') {
    const userId = await requireUserId()
    const lessons = getLessonsForZone(npc.zone_id)
    const state = await getPlayerState(userId)
    const ctx = { questSteps: getQuestStepsIndex(), now: new Date() }
    const resolution = resolveLessonInteraction(npc.npc_id, lessons, state, ctx)
    if (resolution.kind === 'lesson') {
      return {
        kind: 'lesson',
        zone_id: npc.zone_id,
        sequence_index: resolution.lesson.sequence_index,
      }
    }
    if (resolution.kind === 'blocked') {
      const pool = getLessonBlockedLines('N5')
      const jp = pool.length
        ? pool[Math.floor(Math.random() * pool.length)]
        : uiStrings.lesson_blocked.jp
      const dialogue = getDialogue(dialogueRef)
      const name = dialogue
        ? typeof dialogue.name === 'string'
          ? dialogue.name
          : dialogue.name.jp
        : ''
      return { kind: 'dialogue', dialogue: { name, state: 'lesson_blocked', pages: [{ jp }] } }
    }
    // fallback_dialogue → dialogue ordinaire ci-dessous
  }
  const dialogue = await reachDialogueState(dialogueRef)
  return dialogue ? { kind: 'dialogue', dialogue } : null
}

// Persistance du choix du compagnon (kind: companion_choice, labo d'Elm) via
// Effect.set_companion — écrit UNE fois, jamais re-choisi (PRD § Compagnon,
// idempotence portée par la lib issue 02). Seul un slot `confirmed` du roster
// est acceptable : tbd_2/tbd_3 sont affichés indisponibles côté client et
// re-refusés ici (ne jamais faire confiance au client).
export async function chooseCompanion(companionId: string): Promise<{ companion_id: string | null }> {
  const userId = await requireUserId()
  const state = await getPlayerState(userId)
  const entry = getCompanions().find(c => c.companion_id === companionId)
  if (!entry || entry.status !== 'confirmed') return { companion_id: state.companion_id }

  const next = applyEffect(
    { type: 'set_companion', companion_id: companionId },
    state,
    { questSteps: getQuestStepsIndex(), now: new Date() }
  )
  if (next !== state) await savePlayerState(userId, next)
  return { companion_id: next.companion_id }
}

// Events moteur-only (engine-contract.md § 1) : posés par une mécanique de
// jeu (scène, puzzle), jamais par un Effect de contenu. Aucun consommateur
// dans le jalon 1 — seule l'API existe. Idempotent.
export async function clearEvent(eventId: string) {
  const userId = await requireUserId()
  const state = await getPlayerState(userId)
  if (state.cleared_events.includes(eventId)) return
  await savePlayerState(userId, {
    ...state,
    cleared_events: [...state.cleared_events, eventId],
  })
}
