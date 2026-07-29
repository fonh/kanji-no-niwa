'use server'

import { requireUserId } from '@/lib/auth'
import { sql } from '@/lib/db'
import { applyEffects, selectDialogueState } from '@/lib/condition-effect'
import { getDialogue, getQuestStepsIndex, type DialoguePageEntry } from '@/lib/content'
import { getPlayerState, savePlayerState } from '@/lib/player-state'

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
    pages: dialogueState.pages,
  }
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
