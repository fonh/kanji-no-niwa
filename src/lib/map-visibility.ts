// Filtrage serveur de la présence des PNJ/dresseurs (issue 02) : une entité
// dont les unlock_conditions ne sont pas remplies « n'existe pas sur la
// tuile » (CONTEXT.md § Condition). Le client ne reçoit jamais les entités
// masquées — le filtre s'applique dans /api/zone et src/app/map/page.tsx,
// pas dans MapClient.
//
// C1 (revue jalon 1) : le même filtre garde désormais aussi les ÉCRITURES —
// accessibleNpc/accessibleTrainer/findAccessibleDialogueCarrier vérifient
// qu'une entité aurait été SERVIE au joueur dans sa zone courante
// (user_map_state.current_zone, même règle de rattachement que la lecture)
// avant que reachDialogueState / interactWithNpc / engageTrainer / winBattle
// n'appliquent le moindre Effect. Niveau de garantie documenté : zone
// courante + visibilité — jamais l'adjacence de tuile (la position client
// n'est pas fiable à la tuile près, et le serveur ne rejoue pas la marche).

import { isUnlocked, type PlayerState } from '@/lib/condition-effect'
import { getMapNpcs, getMapTrainers, getQuestStepsIndex } from '@/lib/content'
import { getNpcsForZone, type ZoneNpc } from '@/lib/npcs'
import { getTrainersForZone, type ZoneTrainer } from '@/lib/trainers'
import { getZoneByName } from '@/lib/zones'

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
  return trainers
    .filter(trainer => unlocked.has(trainer.trainer_id))
    .map(trainer => ({
      // Battu (defeated_trainers[]) : reste visible si le contenu ne le
      // masque pas, mais ne re-déclenche jamais un combat automatique —
      // le client a besoin du drapeau (issue 07).
      ...trainer,
      defeated: state.defeated_trainers.includes(trainer.trainer_id),
    }))
}

// ── Garde d'écriture (C1) ─────────────────────────────────────────────────────

/** Résolveur de placement pour les gardes d'écriture : elles doivent voir la
 * carte EXACTEMENT comme la lecture l'a servie, placements conditionnels
 * compris — sinon un PNJ qui a changé de poste devient inaccessible en
 * écriture alors qu'il est bien là à l'écran (ou l'inverse). */
function resolverFor(state: PlayerState, now: Date) {
  return { state, ctx: { questSteps: getQuestStepsIndex(), now } }
}

/** Le PNJ tel que la lecture l'aurait servi dans la zone courante du joueur
 * — null s'il n'y vit pas (zone_id/map_zone, règle de getNpcsForZone) ou s'il
 * est masqué par ses unlock_conditions. */
export function accessibleNpc(state: PlayerState, npcId: string, now = new Date()): ZoneNpc | null {
  const zone = getZoneByName(state.current_zone)
  if (!zone) return null
  const npc = getNpcsForZone(zone, resolverFor(state, now)).find(n => n.npc_id === npcId)
  if (!npc) return null
  return filterVisibleNpcs([npc], state, now)[0] ?? null
}

/** Le dresseur tel que la lecture l'aurait servi dans la zone courante du
 * joueur — null hors zone ou masqué. `defeated` posé comme à la lecture. */
export function accessibleTrainer(
  state: PlayerState,
  trainerId: string,
  now = new Date()
): ZoneTrainer | null {
  const zone = getZoneByName(state.current_zone)
  if (!zone) return null
  const trainer = getTrainersForZone(zone).find(t => t.trainer_id === trainerId)
  if (!trainer) return null
  return filterVisibleTrainers([trainer], state, now)[0] ?? null
}

/** L'entité (PNJ ou dresseur) de la zone courante qui porte ce dialogue_ref,
 * visible pour ce joueur — reachDialogueState n'accepte jamais un ref que la
 * carte servie n'aurait pas exposé. */
export function findAccessibleDialogueCarrier(
  state: PlayerState,
  dialogueRef: string,
  now = new Date()
): ZoneNpc | ZoneTrainer | null {
  const zone = getZoneByName(state.current_zone)
  if (!zone) return null
  const npc = getNpcsForZone(zone, resolverFor(state, now)).find(n => n.dialogue_ref === dialogueRef)
  if (npc) return filterVisibleNpcs([npc], state, now)[0] ?? null
  const trainer = getTrainersForZone(zone).find(t => t.dialogue_ref === dialogueRef)
  if (trainer) return filterVisibleTrainers([trainer], state, now)[0] ?? null
  return null
}
