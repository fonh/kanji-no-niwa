// Gate SRS quotidien (issue 10) — PRD § Boucle Quotidienne pt 5.
//
// JAMAIS une Condition (tranché 2026-07-06, finding 02-D4, repris par le PRD) :
// toutes les Condition du jeu sont monotones (une fois vraies, elles le
// restent) ; « SRS fait aujourd'hui » redevient faux chaque matin. Le gate vit
// donc ici, helper dédié hors du vocabulaire Condition/Effect, et ne
// s'applique qu'à UNE chose : l'entrée en zone extérieure jamais visitée.
//   - étages/intérieurs (`is_outdoor: false`) : jamais gatés (finding 03-D5,
//     pas de blocage en plein bâtiment) ;
//   - retour en arrière (zone déjà dans visited_zones) : jamais gaté ;
//   - le booléen `srsSessionDone` vient de getDailySRSStatus[ForUser]
//     (issue 06) — file vidée OU plafond 200 OU ✓ déjà posé. Un jour sans
//     carte due donne sessionDone=true : le gate ne re-calcule rien.
//
// Pur, zéro I/O — consommé par la server action checkZoneEntry (vérité) et
// par le client au moment du franchissement.

export interface GateTargetZone {
  name: string
  is_outdoor: boolean
}

/** Le pas de franchissement vers `target` doit-il être annulé ? */
export function gateBlocksEntry(
  target: GateTargetZone,
  visitedZones: readonly string[],
  srsSessionDone: boolean
): boolean {
  if (!target.is_outdoor) return false
  if (visitedZones.includes(target.name)) return false
  return !srsSessionDone
}
