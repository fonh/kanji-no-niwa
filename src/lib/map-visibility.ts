// Filtrage serveur de la présence des PNJ/dresseurs (issue 02) : une entité
// dont les unlock_conditions ne sont pas remplies « n'existe pas sur la
// tuile » (CONTEXT.md § Condition). Le client ne reçoit jamais les entités
// masquées — le filtre s'applique dans /api/zone et src/app/map/page.tsx,
// pas dans MapClient.

import { isUnlocked, type PlayerState } from '@/lib/condition-effect'
import { getMapNpcs, getMapTrainers, getQuestStepsIndex } from '@/lib/content'
import type { ZoneNpc } from '@/lib/npcs'
import type { ZoneTrainer } from '@/lib/trainers'

function unlockedIds(state: PlayerState, now: Date): Set<string> {
  const ctx = { questSteps: getQuestStepsIndex(), now }
  const ids = new Set<string>()
  for (const npc of getMapNpcs()) {
    if (isUnlocked(npc.unlock_conditions, state, ctx)) ids.add(npc.npc_id)
  }
  for (const trainer of getMapTrainers()) {
    if (isUnlocked(trainer.unlock_conditions, state, ctx)) ids.add(trainer.trainer_id)
  }
  return ids
}

export function filterVisibleNpcs(npcs: ZoneNpc[], state: PlayerState, now = new Date()): ZoneNpc[] {
  const unlocked = unlockedIds(state, now)
  return npcs.filter(npc => unlocked.has(npc.npc_id))
}

export function filterVisibleTrainers(
  trainers: ZoneTrainer[],
  state: PlayerState,
  now = new Date()
): ZoneTrainer[] {
  const unlocked = unlockedIds(state, now)
  return trainers.filter(trainer => unlocked.has(trainer.trainer_id))
}
